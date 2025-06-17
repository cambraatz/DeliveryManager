using DeliveryManager.Server.Models;
using DeliveryManager.Server.Models.Requests;
using DeliveryManager.Server.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using System.Threading.Tasks;
using System.Data;
using DeliveryManager.Server.Models.Responses;

namespace DeliveryManager.Server.Controllers
{
    [ApiController]
    [Route("v1/deliveries")]
    public class DeliveriesController : ControllerBase
    {
        private readonly ITokenService _tokenService;
        private readonly IUserService _userService;
        private readonly IDeliveryService _deliveryService;
        private readonly IDeliveryListService _deliveryListService;
        private readonly IImageService _imageService;
        private readonly IConfiguration _config;
        private readonly ILogger<DeliveriesController> _logger;

        public DeliveriesController(
            ITokenService tokenService,
            IUserService userService,
            IDeliveryService deliveryService,
            IDeliveryListService deliveryListService,
            IImageService imageService,
            IConfiguration config,
            ILogger<DeliveriesController> logger)
        {
            _tokenService = tokenService;
            _userService = userService;
            _deliveryService = deliveryService;
            _deliveryListService = deliveryListService;
            _imageService = imageService;
            _config = config;
            _logger = logger;
        }

        [HttpPost]
        [Route("validate-and-assign")]
        public async Task<IActionResult> ValidateAndAssignManifest([FromBody] DriverVerificationRequest request)
        {
            // validate request parameters...
            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Validation failed for DriverVerificationRequest: {Errors}", ModelState);
                return BadRequest(ModelState);
            }

            // authorize request *should this be reformatted to use in-built *[Authorize]*...
            (bool success, string message) = _tokenService.AuthorizeRequest(HttpContext);
            if (!success)
            {
                _logger.LogWarning("Unauthorized access attempt for ValidateAndAssignManifest: {Message}", message);
                return Unauthorized(new { message = message });
            }

            // if opting for [Authorize] replace with User.Identity.Name instead...
            string currUsername = request.USERNAME;

            try
            {
                // verify powerunit provided is not already assigned...
                bool puInUse = await _userService.IsPowerunitInUseAsync(request.POWERUNIT, currUsername);
                if (puInUse)
                {
                    _logger.LogWarning("Powerunit '{Powerunit}' is already assigned to another driver (user: '{Username}').", request.POWERUNIT, currUsername);
                    return Conflict(new { message = $"The provided powerunit '{request.POWERUNIT}' is already assigned to another driver. Please contact administrator." });
                }

                // update users powerunit in user DB...
                await _userService.UpdatePowerunitAsync(currUsername, request.POWERUNIT);
                _logger.LogInformation("USER '{Username}' successfully assigned powerunit '{Powerunit}'.", currUsername, request.POWERUNIT);

                // retrieve active company from cookies...
                var company = Request.Cookies["company"];
                if (string.IsNullOrEmpty(company))
                {
                    _logger.LogWarning("Company key cookies is missing for user '{Username}' during manifest verification.", currUsername);
                    return BadRequest(new { message = "Company context is missing from your session. Please ensure you are logged in correctly." });
                }

                // fetch connection string tied to active company...
                string companyConnString = _config.GetConnectionString(company)!;
                if (string.IsNullOrEmpty(companyConnString))
                {
                    _logger.LogError("Connection string for company '{Company}' not found in configuration.", company);
                    return StatusCode(StatusCodes.Status500InternalServerError, new { message = $"Server configuration error: Connection string for company '{company}' not found, contact system administrator." });
                }

                // retrieve first matching delivery manifest, if present...
                DeliveryManifest? manifest = await _deliveryService.GetDeliveryManifestAsync(companyConnString, request.POWERUNIT, request.MFSTDATE);
                if (manifest != null)
                {
                    _logger.LogInformation($"Valid delivery manifest found for powerunit '{request.POWERUNIT}' on date '{request.MFSTDATE}' for company '{company}'.");
                    return Ok(new { message = "Valid date/powerunit combination was found.", manifest = manifest });
                }
                else
                {
                    _logger.LogInformation("No matching delivery manifest found for powerunit '{Powerunit}' and date '{ManifestDate}'.", request.POWERUNIT, request.MFSTDATE);
                    return NotFound(new { message = "Invalid date/powerunit combination. No matching delivery manifests found for the provided details." });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An unexpected error occurred during delivery manifest validation and assignment for user '{Username}', powerunit '{Powerunit}', date '{ManifestDate}'.", currUsername, request.POWERUNIT, request.MFSTDATE);
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = "An internal server error occurred while processing your request. Please try again later.", details = ex.Message });
            }
        }

        private string GetMessage(int undelivered, int delivered)
        {
            if (undelivered > 0 && delivered > 0)
            {
                return "Both tables returned non-null values";
            }
            if (undelivered == 0 && delivered > 0)
            {
                return "Delivered returned non-null values, no valid undelivered records.";
            }
            if (delivered == 0 && undelivered > 0)
            {
                return "Undelivered returned non-null values, no valid delivered records.";
            }

            return "No valid records were found.";
        }

        [HttpGet] // no route needed, defaults to v1/deliveries...
        public async Task<IActionResult> GetDeliveries([FromQuery] string powerunit, [FromQuery] string mfstdate)
        {
            // authorize request *should this be reformatted to use in-built *[Authorize]*...
            (bool success, string message) = _tokenService.AuthorizeRequest(HttpContext);
            if (!success)
            {
                _logger.LogWarning("Unauthorized access attempt for GetDeliveries: {Message}", message);
                return Unauthorized(new { message = message });
            }

            // ensure non-null parameters...
            if (string.IsNullOrEmpty(powerunit) || string.IsNullOrEmpty(mfstdate))
            {
                _logger.LogWarning("Powerunit and Manifest Date are required to fetch deliveries.");
                return BadRequest(new { message = "Powerunit and Manifest Date are required." });
            }

            // retrieve active company from cookies...
            var company = Request.Cookies["company"];
            if (string.IsNullOrEmpty(company))
            {
                _logger.LogWarning("Company key cookies is missing while attempting to fetch delivery manifests, for powerunit '{Powerunit}' and date '{ManifestDate}'.", powerunit, mfstdate);
                return BadRequest(new { message = "Company context is missing from your session. Please ensure you are logged in correctly." });
            }

            string companyConnString = _config.GetConnectionString(company)!;
            if (string.IsNullOrEmpty(companyConnString))
            {
                _logger.LogError("Connection string for company '{Company}' not found in configuration.", company);
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = $"Server configuration error: Connection string for company '{company}' not found, contact system administrator." });
            }

            try
            {
                (List<DeliveryManifest> undelivered, List<DeliveryManifest> delivered) = await _deliveryListService.GetManifestListsAsync(companyConnString, powerunit, mfstdate);

                string responseMessage = GetMessage(undelivered.Count, delivered.Count);

                _logger.LogInformation("Successfully retrieved {UndeliveredCount} undelivered and {DeliveredCount} delivered manifests for Powerunit: '{Powerunit}', Date: '{ManifestDate}'.", undelivered.Count, delivered.Count, powerunit, mfstdate);

                return Ok(new DeliveryListResponse
                {
                    Undelivered = undelivered,
                    Delivered = delivered,
                    Message = responseMessage
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An unexpected error occurred while fetching deliveries for powerunit '{Powerunit}', date '{ManifestDate}'. Error: {ErrorMessage}", powerunit, mfstdate, ex.Message);
                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    message = "An internal server error occurred while retrieving deliveries. Please try again later.",
                    details = ex.Message
                });
            }
        }

        [HttpPut]
        [Route("{MFSTKEY}")]
        public async Task<IActionResult> UpdateDelivery([FromRoute] string mfstKey, [FromForm] DeliveryForm data)
        {
            // ensure mfstKey from URL matches form data...
            if (!string.Equals(mfstKey, data.MFSTKEY, StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogWarning("MFSTKEY mismatch: URL '{UrlKey}' does not match body '{BodyKey}'.", mfstKey, data.MFSTKEY);
                return BadRequest(new { message = "MFSTKEY in URL must match MFSTKEY in request body." });
            }

            // authorize request *should this be reformatted to use in-built *[Authorize]*...
            (bool success, string message) = _tokenService.AuthorizeRequest(HttpContext);
            if (!success)
            {
                _logger.LogWarning("Unauthorized access attempt for UpdateDelivery: {Message}", message);
                return Unauthorized(new { message = message });
            }

            // retrieve username from cookies...
            var username = Request.Cookies["username"];
            if (string.IsNullOrEmpty(username))
            {
                _logger.LogWarning("Username is missing from cookies while manifest updating.");
                return BadRequest(new { message = "Company context is missing from your session. Please ensure you are logged in correctly." });
            }

            // retrieve active company from cookies...
            var company = Request.Cookies["company"];
            if (string.IsNullOrEmpty(company))
            {
                _logger.LogWarning("Company key cookies is missing for user '{Username}' during manifest updating.", username);
                return BadRequest(new { message = "Company context is missing from your session. Please ensure you are logged in correctly." });
            }

            try
            {
                bool updateSuccess = await _deliveryService.UpdateDeliveryManifestAsync(data, company, username);
                if (updateSuccess)
                {
                    _logger.LogInformation("Manifest {MFSTKEY} updated successfully.", mfstKey);
                    return Ok(new { message = "Delivery updated successfully." });
                }
                else
                {
                    _logger.LogError("Failed to update manifest {MFSTKEY} in service (likely no rows affected or internal service error).", mfstKey);
                    return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Failed to update delivery. Check server logs." });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An unexpected error occurred while updating manifest {MFSTKEY}.", mfstKey);
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = "An unexpected server error occurred." + ex });
            }
        }

        [HttpGet]
        [Route("image/{fileName}")]
        public async Task<IActionResult> GetImage(string fileName)
        {
            if (string.IsNullOrEmpty(fileName))
            {
                return BadRequest("Filename cannot be empty.");
            }

            (byte[]? fileBytes, string? contentType) = await _imageService.GetImageAsync(fileName);
            if (fileBytes == null)
            {
                return NotFound();
            }

            return File(fileBytes, contentType ?? "application/octet-stream");
        }
    }
}

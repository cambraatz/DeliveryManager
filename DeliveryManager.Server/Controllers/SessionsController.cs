using DeliveryManager.Server.Models;
using DeliveryManager.Server.Models.Requests;
using DeliveryManager.Server.Services;
using DeliveryManager.Server.Services.Interfaces;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Globalization;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text.Json;
using System;
using System.Threading.Tasks;

namespace DeliveryManager.Server.Controllers
{
    [ApiController]
    [Route("v1/sessions")]
    public class SessionsController : Controller
    {
        private readonly IUserService _userService;
        private readonly ITokenService _tokenService;
        private readonly ICookieService _cookieService;
        private readonly IMappingService _mappingService;
        private readonly ILogger<SessionsController> _logger;
        private readonly IWebHostEnvironment _env;
        private readonly IConfiguration _config;
        private readonly ISessionService _sessionService;

        public SessionsController(IUserService userService, 
            ITokenService tokenService,
            ICookieService cookieService,
            IMappingService mappingService,
            ILogger<SessionsController> logger,
            IWebHostEnvironment env,
            IConfiguration config,
            ISessionService sessionService)
        {
            _userService = userService;
            _tokenService = tokenService;
            _cookieService = cookieService;
            _mappingService = mappingService;
            _logger = logger;
            _env = env;
            _config = config;
            _sessionService = sessionService;
        }

        [HttpGet]
        [Route("dev-login")]
        public async Task<IActionResult> DevLogin(
            [FromQuery] string? username = "cbraatz",
            [FromQuery] string? company = "TCS",
            [FromQuery] string? powerunit = "047",
            [FromQuery] string? mfstdate = "02162024")
        {
            // ensure development environment only...
            if (!_env.IsDevelopment())
            {
                _logger.LogWarning("Attempted to access DevLogin endpoint in non-development environment.");
                return NotFound("This endpoint is only available in the Development environment.");
            }

            // ensure valid username and company parameters...
            if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(company))
            {
                return BadRequest(new { message = "Username and company are both required for dev login." });
            }

            // fetch user credentials from local DB...
            User? user = await _userService.GetByUsernameAsync(username);
            if (user == null)
            {
                _logger.LogWarning("Development user '{Username}' not found in local DB", username);
                return NotFound(new { message = $"Development user '{username}' not found in local database. User must be created prior to login." });
            }

            // generate valid access/refresh tokens for dev session...
            (string access, string refresh) = _tokenService.GenerateToken(username);

            // adding session record to database...
            // Parse defaultMfstDate if provided
            DateTime parsedMfstDate = default(DateTime);
            if (!string.IsNullOrWhiteSpace(mfstdate))
            {
                if (!DateTime.TryParseExact(mfstdate, "MMddyyyy",
                                           CultureInfo.InvariantCulture,
                                           DateTimeStyles.None,
                                           out parsedMfstDate))
                {
                    _logger.LogWarning("DevLogin: defaultMfstDate '{DefaultMfstDate}' could not be parsed. Proceeding with default(DateTime).", mfstdate);
                    // Optionally, you could return BadRequest here if a valid defaultMfstDate is strictly required for dev-login.
                    // return BadRequest(new { message = "Invalid defaultMfstDate format. Use MMDDYYYY." });
                }
            }
            // Integrate SessionService update for dev-login
            DateTime refreshExpiryTime = DateTime.UtcNow.AddDays(1);
            try
            {
                var refreshJwtToken = new JwtSecurityTokenHandler().ReadJwtToken(refresh);
                if (refreshJwtToken.Payload.Expiration.HasValue)
                {
                    refreshExpiryTime = DateTimeOffset.FromUnixTimeSeconds(refreshJwtToken.Payload.Expiration.Value).UtcDateTime;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "DevLogin: Could not parse refresh token expiry for user {Username}. Using default expiry.", username);
            }

            // Add or update the session record in the database
            // Now passing the optional defaultPowerUnit and parsedDefaultMfstDate
            var sessionUpdateSuccess = await _sessionService.AddOrUpdateSessionAsync(
                username,
                access,
                refresh,
                refreshExpiryTime,
                powerunit, // Pass the defaultPowerUnit parameter
                parsedMfstDate.Date // Pass the parsed MfstDate (only date part)
            );

            if (!sessionUpdateSuccess)
            {
                _logger.LogError("DevLogin: Failed to initialize dev session in DB for user {Username}.", username);
                return StatusCode(500, "Failed to initialize dev session in the database.");
            }

            // fetch company and module mappings...
            IDictionary<string, string> companies = await _mappingService.GetCompaniesAsync();
            IDictionary<string, string> modules = await _mappingService.GetModulesAsync();

            /* add max size warning optional */
            Response.Cookies.Append("username", user.Username!, _cookieService.RefreshOptions());
            Response.Cookies.Append("company", company, _cookieService.RefreshOptions());
            Response.Cookies.Append("access_token", access, _cookieService.AccessOptions());
            Response.Cookies.Append("refresh_token", refresh, _cookieService.RefreshOptions());

            Response.Cookies.Append("company_mapping", JsonSerializer.Serialize(companies), _cookieService.RefreshOptions());
            Response.Cookies.Append("module_mapping", JsonSerializer.Serialize(modules), _cookieService.RefreshOptions());

            return Redirect("https://localhost:5173/");
        }

        [HttpGet]
        [Route("me")]
        [Authorize]
        public async Task<IActionResult> GetCurrentDriver()
        {
            string? username = Request.Cookies["username"];
            if (string.IsNullOrEmpty(username))
            {
                _logger.LogWarning("Required 'username' cookie is missing or empty.");
                return BadRequest(new { message = "Username cookies is missing or empty." });
            }

            string? companyMapping = Request.Cookies["company_mapping"];
            if (string.IsNullOrEmpty(companyMapping))
            {
                _logger.LogWarning("Required 'company_mapping' cookie is missing or empty.");
                return BadRequest(new { message = "Company mapping cookie is missing or empty." });
            }

            User? user = await _userService.GetByUsernameAsync(username);
            if (user == null)
            {
                return NotFound(new { message = "Driver not found." });
            }

            return Ok(new { user = user, mapping = companyMapping });
        }

        [HttpPost]
        [Route("logout")]
        public async Task<IActionResult> Logout()
        {
            bool sessionCleared = false;
            string? username = Request.Cookies["username"];
            string? accessToken = Request.Cookies["access_token"];
            string? refreshToken = Request.Cookies["refresh_token"];
            if (string.IsNullOrEmpty(username))
            {
                _logger.LogWarning("Required 'username' cookie is missing or empty.");
                sessionCleared = await _sessionService.InvalidateSessionByTokensAsync(accessToken, refreshToken);
            } else
            {
                sessionCleared = await _sessionService.InvalidateSessionAsync(username);
            }

            if (!sessionCleared)
            {
                _logger.LogWarning("Failed to clear session for user {Username} during logout.", username);
                await _sessionService.CleanupExpiredSessionsAsync(TimeSpan.FromMinutes(30));
            }

            foreach (var cookie in Request.Cookies)
            {
                Response.Cookies.Append(cookie.Key, "", _cookieService.RemoveOptions());
            }
            return Ok(new { message = "Logged out successfully" });
        }

        [HttpPost]
        [Route("return")]
        [Authorize]
        public async Task<IActionResult> Return()
        {
            string? username = Request.Cookies["username"];
            string? accessToken = Request.Cookies["access_token"];
            string? refreshToken = Request.Cookies["refresh_token"];
            if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(accessToken) || string.IsNullOrEmpty(refreshToken))
            {
                _logger.LogWarning("Return: Missing required cookies for user {Username}.", username);
                return Unauthorized(new { message = "Session cookies are missing. Please log in again." });
            }

            bool sessionCleared = await _sessionService.InvalidateSessionAsync(username);
            if (!sessionCleared)
            {
                _logger.LogWarning("Return: Failed to clear session for user {Username}.", username);
                return StatusCode(500, "Failed to clear session. Please try again later.");
            }

            _cookieService.ExtendCookies(HttpContext, 15);
            Response.Cookies.Append("return", "true", _cookieService.AccessOptions());

            return Ok(new { message = "Returning, cookies extension completed successfully." });
        }

        [HttpPost]
        [Route("check-manifest-access")]
        [Authorize]
        public async Task<IActionResult> CheckManifestAccess([FromBody] ManifestAccessRequest request)
        {
            var username = User.FindFirst(ClaimTypes.Name)?.Value;
            if (string.IsNullOrEmpty(username))
            {
                _logger.LogWarning("Attempt to access check-manifest-access without username claim.");
                return Unauthorized(new { message = "User identity not found." });
            }

            // The check `request.MfstDate == default(DateTime)` will now also catch cases
            // where `MfstDateString` couldn't be parsed into a valid date.
            if (string.IsNullOrEmpty(request.PowerUnit) || request.MfstDate == default(DateTime))
            {
                _logger.LogWarning("CheckManifestAccess: Power Unit or Manifest Date (or format issue) missing/invalid for user {Username}. Received PowerUnit: '{PowerUnit}', MfstDateString: '{MfstDateString}'",
                                   username, request.PowerUnit, request.MfstDate);
                return BadRequest(new { message = "Power Unit and Manifest Date are required and must be in 'YYYY-MM-DD' format." });
            }

            _logger.LogInformation("CheckManifestAccess: Checking for SSO conflicts for user {Username} on PowerUnit {PowerUnit} and ManifestDate {MfstDate}",
                                   username, request.PowerUnit, request.MfstDate.ToShortDateString());
            var conflictingSession = await _sessionService.GetConflictingSessionAsync(username, request.PowerUnit, request.MfstDate.Date);

            if (conflictingSession != null)
            {
                _logger.LogWarning("SSO conflict detected! User {ConflictingUser} is already accessing PowerUnit {PowerUnit} on ManifestDate {MfstDate}. Invalidating their session.",
                                   conflictingSession.Username, request.PowerUnit, request.MfstDate.ToShortDateString());

                await _sessionService.InvalidateSessionAsync(conflictingSession.Username);

                return Forbid("Another user is currently accessing this Power Unit and Manifest Date. Their session has been terminated to allow your access. Please try again or refresh their page.");
            }

            var currentAccessToken = Request.Cookies["access_token"];
            var currentRefreshToken = Request.Cookies["refresh_token"];

            if (string.IsNullOrEmpty(currentAccessToken) || string.IsNullOrEmpty(currentRefreshToken))
            {
                _logger.LogWarning("CheckManifestAccess: Missing access or refresh token for user {Username} during manifest session update.", username);
                return Unauthorized(new {message = "Session tokens missing. Please log in again." });
            }

            DateTime refreshExpiryTime = DateTime.UtcNow.AddDays(1);
            try
            {
                var refreshJwtToken = new JwtSecurityTokenHandler().ReadJwtToken(currentRefreshToken);
                if (refreshJwtToken.Payload.Expiration.HasValue)
                {
                    refreshExpiryTime = DateTimeOffset.FromUnixTimeSeconds(refreshJwtToken.Payload.Expiration.Value).UtcDateTime;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "CheckManifestAccess: Could not parse refresh token expiry for user {Username}. Using default expiry.", username);
            }

            var success = await _sessionService.AddOrUpdateSessionAsync(
                username,
                currentAccessToken,
                currentRefreshToken,
                refreshExpiryTime,
                request.PowerUnit,
                request.MfstDate.Date
            );

            if (!success)
            {
                _logger.LogError("CheckManifestAccess: Failed to update session details for user {Username} with PowerUnit {PowerUnit} and ManifestDate {MfstDate}.",
                                 username, request.PowerUnit, request.MfstDate.ToShortDateString());
                return StatusCode(500, "Failed to update session with manifest details.");
            }

            _logger.LogInformation("CheckManifestAccess: Manifest access granted and session updated for user {Username} to PowerUnit {PowerUnit} and ManifestDate {MfstDate}.",
                                   username, request.PowerUnit, request.MfstDate.ToShortDateString());

            return Ok(new { message = "Manifest access granted and session updated." });
        }
    }
}

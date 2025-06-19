using Microsoft.AspNetCore.Mvc;
using DeliveryManager.Server.Services;
using DeliveryManager.Server.Services.Interfaces;
using DeliveryManager.Server.Models;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using System.Text.Json;

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

        public SessionsController(IUserService userService, 
            ITokenService tokenService,
            ICookieService cookieService,
            IMappingService mappingService,
            ILogger<SessionsController> logger,
            IWebHostEnvironment env,
            IConfiguration config)
        {
            _userService = userService;
            _tokenService = tokenService;
            _cookieService = cookieService;
            _mappingService = mappingService;
            _logger = logger;
            _env = env;
            _config = config;
        }

        [HttpGet]
        [Route("dev-login")]
        public async Task<IActionResult> DevLogin(
            [FromQuery] string? username = "cbraatz",
            [FromQuery] string? company = "TCS")
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

            // fetch company and module mappings...
            IDictionary<string, string> companies = await _mappingService.GetCompaniesAsync();
            IDictionary<string, string> modules = await _mappingService.GetModulesAsync();

            /* add max size warning optional */
            Response.Cookies.Append("username", user.Username!, _cookieService.AccessOptions());
            Response.Cookies.Append("company", company, _cookieService.AccessOptions());
            Response.Cookies.Append("access_token", access, _cookieService.AccessOptions());
            Response.Cookies.Append("refresh_token", refresh, _cookieService.RefreshOptions());

            Response.Cookies.Append("company_mapping", JsonSerializer.Serialize(companies), _cookieService.AccessOptions());
            Response.Cookies.Append("module_mapping", JsonSerializer.Serialize(modules), _cookieService.AccessOptions());

            return Redirect("https://localhost:5173/");
        }

        [HttpGet]
        [Route("me")]
        [Authorize]
        public async Task<IActionResult> GetCurrentDriver()
        {
            /*(bool success, string message) = _tokenService.AuthorizeRequest(HttpContext);
            if (!success)
            {
                _logger.LogWarning("Authentication failed for request to /api/sessions/me");
                return Unauthorized(new { message = message });
            }*/

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
        [Authorize]
        public IActionResult Logout()
        {
            foreach (var cookie in Request.Cookies)
            {
                Response.Cookies.Append(cookie.Key, "", _cookieService.RemoveOptions());
            }
            return Ok(new { message = "Logged out successfully" });
        }

        [HttpPost]
        [Route("return")]
        [Authorize]
        public IActionResult Return()
        {
            _cookieService.ExtendCookies(HttpContext, 15);
            Response.Cookies.Append("return", "true", _cookieService.AccessOptions());

            return Ok(new { message = "Returning, cookies extension completed successfully." });
        }
    }
}

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
            [FromQuery] string? mfstdate = "02162024",
            long userId = 0
            )
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

            // generate valid access/refresh tokens for dev session...
            (string access, string refresh) = _tokenService.GenerateToken(username);

            // fetch user credentials from local DB...
            User? user = await _userService.GetByUsernameAsync(username);
            if (user == null)
            {
                _logger.LogWarning("Development user '{Username}' not found in local DB", username);
                return NotFound(new { message = $"Development user '{username}' not found in local database. User must be created prior to login." });
            }

            // adding session record to database...
            // Parse defaultMfstDate if provided
            /*DateTime parsedMfstDate = default(DateTime);
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
            }*/
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
            var sessionUpdateSuccess = await _sessionService.AddSessionAsync(
                userId,
                username,
                access,
                refresh,
                refreshExpiryTime,
                null, //powerunit, // Pass the defaultPowerUnit parameter
                null //parsedMfstDate.Date // Pass the parsed MfstDate (only date part)
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

            string? accessToken = Request.Cookies["access_token"];
            string? refreshToken = Request.Cookies["refresh_token"];
            if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(accessToken) || string.IsNullOrEmpty(refreshToken))
            {
                _logger.LogWarning("Return: Missing required cookies for user {Username}.", username);
                return Unauthorized(new { message = "Session cookies are missing. Please log in again." });
            }

            User? user = await _userService.GetByUsernameAsync(username);
            if (user == null)
            {
                return NotFound(new { message = "Driver not found." });
            }

            SessionModel? session = await _sessionService.GetSessionAsync(username, accessToken, refreshToken);
            if (session != null)
            {
                return Ok(new { user = user, mapping = companyMapping, userId = session.Id });
            }
            return Unauthorized(new { message = "Session cookies are missing. Please log in again." });
        }

        [HttpPost]
        [Route("logout/{userId}")]
        public async Task<IActionResult> Logout([FromBody] SessionModel? session, long userId)
        {
            if (session != null)
            {
                // Always attempt to get tokens from cookies, as they are the primary source for browser sessions
                string? accessTokenFromRequest = Request.Cookies["access_token"];
                string? refreshTokenFromRequest = Request.Cookies["refresh_token"];

                // If the SessionModel was provided (e.g., from a request body),
                // and it contains a username, use it. Otherwise, get it from what's available.
                string? username = session?.Username;
                //long? userId = session?.Id;
                string? powerUnit = session?.PowerUnit;
                string? mfstDate = session?.MfstDate;

                // Prioritize tokens from cookies. If not found, use from the session model if present.
                // Ensure we coalesce to string.Empty if ultimately null, as service methods might expect string.
                string accessToken = accessTokenFromRequest
                                            ?? session?.AccessToken // Fallback to session model's token
                                            ?? string.Empty;       // Default to empty string if all are null

                string refreshToken = refreshTokenFromRequest
                                            ?? session?.RefreshToken // Fallback to session model's token
                                            ?? string.Empty;

                bool sessionCleared = false;

                // delete session after delivery validation...
                /*if (!string.IsNullOrEmpty(username) && !string.IsNullOrEmpty(powerUnit) && !string.IsNullOrEmpty(mfstDate))
                {
                    _logger.LogWarning($"Invalidate by tokens {powerUnit} and {mfstDate}");
                    sessionCleared = await _sessionService.InvalidateSessionByDeliveryManifest(username, powerUnit, mfstDate);
                }

                // delete session from tokens before validation...
                if (!sessionCleared && !string.IsNullOrEmpty(accessToken) && !string.IsNullOrEmpty(refreshToken))
                {
                    _logger.LogWarning($"Invalidate by tokens {accessToken} and {refreshToken}");
                    sessionCleared = await _sessionService.InvalidateSessionByTokensAsync(accessToken, refreshToken);
                }*/

                // delete session by ID...
                _logger.LogWarning($"Invalidate by session ID {userId}");
                sessionCleared = await _sessionService.DeleteUserSessionByIdAsync(userId);

                // stale session, clean expired sessions...
                if (!sessionCleared)
                {
                    _logger.LogWarning("Failed to clear session for user {Username} during logout.", username);
                    await _sessionService.CleanupExpiredSessionsAsync(TimeSpan.FromMinutes(30));
                } else
                {
                    _logger.LogWarning("Successfully cleared session for user {Username} during logout.", username);
                }
            }
            // remove all cookies and return...
            foreach (var cookie in Request.Cookies)
            {
                Response.Cookies.Append(cookie.Key, "", _cookieService.RemoveOptions());
            }
            return Ok(new { message = "Logged out successfully" });
        }

        [HttpPost]
        [Route("return/{userId}")]
        [Authorize]
        public async Task<IActionResult> Return(long userId)
        {
            string? username = Request.Cookies["username"];
            string? accessToken = Request.Cookies["access_token"];
            string? refreshToken = Request.Cookies["refresh_token"];
            if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(accessToken) || string.IsNullOrEmpty(refreshToken))
            {
                _logger.LogWarning("Return: Missing required cookies for user {Username}.", username);
                return Unauthorized(new { message = "Session cookies are missing. Please log in again." });
            }

            /*bool sessionCleared = await _sessionService.InvalidateSessionAsync(username, accessToken, refreshToken);
            if (!sessionCleared)
            {
                _logger.LogWarning("Return: Failed to clear session for user {Username}.", username);
                return StatusCode(500, "Failed to clear session. Please try again later.");
            }*/
            DateTime refreshExpiryTime = DateTime.UtcNow.AddDays(1);
            try
            {
                var refreshJwtToken = new JwtSecurityTokenHandler().ReadJwtToken(refreshToken);
                if (refreshJwtToken.Payload.Expiration.HasValue)
                {
                    refreshExpiryTime = DateTimeOffset.FromUnixTimeSeconds(refreshJwtToken.Payload.Expiration.Value).UtcDateTime;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "CheckManifestAccess: Could not parse refresh token expiry for user {Username}. Using default expiry.", username);
            }

            var success = await _sessionService.UpdateSessionAsync(
                userId,
                username,
                accessToken,
                refreshToken,
                refreshExpiryTime,
                null,
                null
            );

            if (!success)
            {
                _logger.LogError($"CheckManifestAccess: Failed to release session access for user {username}.");
                return StatusCode(500, "Failed to release session with manifest details.");
            }

            _cookieService.ExtendCookies(HttpContext, 15);
            Response.Cookies.Append("return", "true", _cookieService.AccessOptions());

            return Ok(new { message = "Returning, cookies extension completed successfully." });
        }

        [HttpPost]
        [Route("check-manifest-access/{userId}")]
        [Authorize(Policy = "SessionActive")]
        public async Task<IActionResult> CheckManifestAccess([FromBody] ManifestAccessRequest request, long userId)
        {
            var username = User.FindFirst(ClaimTypes.Name)?.Value;
            if (string.IsNullOrEmpty(username))
            {
                _logger.LogWarning("Attempt to access check-manifest-access without username claim.");
                return Unauthorized(new { message = "User identity not found." });
            }

            // The check `request.MfstDate == default(DateTime)` will now also catch cases
            // where `MfstDateString` couldn't be parsed into a valid date.
            if (string.IsNullOrEmpty(request.PowerUnit) || string.IsNullOrEmpty(request.MfstDate))
            {
                _logger.LogWarning("CheckManifestAccess: Power Unit or Manifest Date (or format issue) missing/invalid for user {Username}. Received PowerUnit: '{PowerUnit}', MfstDateString: '{MfstDateString}'",
                                   username, request.PowerUnit, request.MfstDate);
                return BadRequest(new { message = "Power Unit and Manifest Date are required and must be in 'YYYY-MM-DD' format." });
            }

            var accessToken = Request.Cookies["access_token"];
            var refreshToken = Request.Cookies["refresh_token"];
            if (string.IsNullOrEmpty(accessToken) || string.IsNullOrEmpty(refreshToken))
            {
                _logger.LogWarning("CheckManifestAccess: Missing access or refresh token for user {Username} during manifest session update.", username);
                return Unauthorized(new { message = "Session tokens missing. Please log in again." });
            }

            _logger.LogInformation("CheckManifestAccess: Checking for SSO conflicts for user {Username} on PowerUnit {PowerUnit} and ManifestDate {MfstDate}",
                                   username, request.PowerUnit, request.MfstDate);

            /*var assignedSession = await _sessionService.GetConflictingSessionAsync(
                username,
                request.PowerUnit,
                request.MfstDate,
                accessToken,
                refreshToken);*/
            var assignedSession = await _sessionService.GetConflictingSessionIdAsync(request.PowerUnit, request.MfstDate, userId);

            if (assignedSession != null)
            {
                // Check if the found assigned session is the *current* user's *current* session
                bool isCurrentSession =
                    assignedSession!.Username.Equals(username, StringComparison.OrdinalIgnoreCase) &&
                    assignedSession.AccessToken!.Equals(accessToken, StringComparison.Ordinal) &&
                    assignedSession.RefreshToken!.Equals(refreshToken, StringComparison.Ordinal);

                if (isCurrentSession)
                {
                    // NOT A CONFLICT, just confirming the current session is valid in DB...
                    _logger.LogInformation("CheckManifestAccess: User {Username}'s current session (ID: {SessionId}) is already assigned to PowerUnit {PowerUnit} on ManifestDate {MfstDate}.",
                                    username, assignedSession.Id, request.PowerUnit, request.MfstDate);
                    return Ok(new { message = "Manifest already assigned to your current session. Access granted.", conflict = false });
                }
                else
                {
                    _logger.LogWarning("SSO conflict detected! PowerUnit {PowerUnit} on ManifestDate {MfstDate} is already assigned to session ID {ConflictingSessionId} (User: {ConflictingUser}). Current user {CurrentUser} is blocked.",
                                   request.PowerUnit, request.MfstDate, assignedSession.Id, assignedSession.Username, username);

                    if (assignedSession.Username.Equals(username, StringComparison.OrdinalIgnoreCase))
                    {
                        // Conflict Type A: Same user, but a different session
                        // Return 200 OK so client can show a popup, but include conflict details
                        return Ok(new
                        {
                            message = $"'{username}') already has active session.",
                            conflict = true,
                            conflictType = "same_user", // Client will look for this
                            conflictingSessionId = assignedSession.Id,
                            conflictingSessionUser = assignedSession.Username
                        });
                    }
                    else
                    {
                        // Conflict Type B: Different user
                        // Return 403 Forbidden for immediate rejection on client
                        return StatusCode(403, new
                        {
                            message = $"Manifest is already in use by another user ({assignedSession.Username}).",
                            conflict = true,
                            conflictType = "different_user", // Client will look for this
                            conflictingSessionId = assignedSession.Id,
                            conflictingSessionUser = assignedSession.Username
                        });
                    }
                }
            }

            DateTime refreshExpiryTime = DateTime.UtcNow.AddDays(1);
            try
            {
                var refreshJwtToken = new JwtSecurityTokenHandler().ReadJwtToken(refreshToken);
                if (refreshJwtToken.Payload.Expiration.HasValue)
                {
                    refreshExpiryTime = DateTimeOffset.FromUnixTimeSeconds(refreshJwtToken.Payload.Expiration.Value).UtcDateTime;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "CheckManifestAccess: Could not parse refresh token expiry for user {Username}. Using default expiry.", username);
            }

            var success = await _sessionService.UpdateSessionAsync(
                userId,
                username,
                accessToken,
                refreshToken,
                refreshExpiryTime,
                request.PowerUnit,
                request.MfstDate
            );

            if (!success)
            {
                _logger.LogError("CheckManifestAccess: Failed to update session details for user {Username} with PowerUnit {PowerUnit} and ManifestDate {MfstDate}.",
                                 username, request.PowerUnit, request.MfstDate);
                return StatusCode(500, "Failed to update session with manifest details.");
            }

            _logger.LogInformation("CheckManifestAccess: Manifest access granted and session updated for user {Username} to PowerUnit {PowerUnit} and ManifestDate {MfstDate}.",
                                   username, request.PowerUnit, request.MfstDate);

            return Ok(new { message = "Manifest access granted and session updated." });
        }

        [HttpPost]
        [Route("release-manifest-access/{userId}")]
        [Authorize(Policy = "SessionActive")]
        public async Task<IActionResult> ReleaseManifestAccess([FromBody] DriverVerificationRequest delivery, long userId)
        {
            /*var username = User.FindFirst(ClaimTypes.Name)?.Value;
            if (string.IsNullOrEmpty(username))
            {
                _logger.LogWarning("Attempt to access release-manifest-access without username claim.");
                return Unauthorized(new { message = "User identity not found." });
            }*/

            string message;
            bool success;
            if (delivery.MFSTDATE != null && delivery.POWERUNIT != null)
            {
                // delete previous conflicting session from database...
                //success = await _sessionService.InvalidateSessionByDeliveryManifest(delivery.USERNAME, delivery.POWERUNIT, delivery.MFSTDATE);
                success = await _sessionService.DeleteUserSessionByIdAsync(userId);
                if (!success)
                {
                    _logger.LogError("ReleaseManifestAccess: Failed to release manifest access for user {Username} on PowerUnit {PowerUnit} and ManifestDate {MfstDate}.",
                                     delivery.USERNAME, delivery.POWERUNIT, delivery.MFSTDATE);
                    return StatusCode(500, "Failed to release manifest access.");
                }
                message = success ? "Successfully released previous manifest access."
                    : "Failed to release previous manifest access.";
            }
            // THIS MAY BE HANDLED AS A RESET AND NOT A RELEASE...
            else
            {
                // remove powerunit/mfstdate from current session and update tokens...
                var currentAccessToken = Request.Cookies["access_token"];
                var currentRefreshToken = Request.Cookies["refresh_token"];
                if (string.IsNullOrEmpty(currentAccessToken) || string.IsNullOrEmpty(currentRefreshToken))
                {
                    _logger.LogWarning("CheckManifestAccess: Missing access or refresh token for user {Username} during manifest session update.", delivery.USERNAME);
                    return Unauthorized(new { message = "Session tokens missing. Please log in again." });
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
                    _logger.LogError(ex, "CheckManifestAccess: Could not parse refresh token expiry for user {Username}. Using default expiry.", delivery.USERNAME);
                }

                success = await _sessionService.UpdateSessionAsync(
                    userId,
                    delivery.USERNAME,
                    currentAccessToken,
                    currentRefreshToken,
                    refreshExpiryTime,
                    null,
                    null
                );

                message = success ? "Manifest access granted and session updated."
                    : "Failed to release session with manifest details.";
            }

            if (!success)
            {
                _logger.LogError($"CheckManifestAccess: Failed to release session access for user {delivery.USERNAME}.");
                return StatusCode(500, message);
            }

            _logger.LogInformation($"ReleaseManifestAccess: Manifest access granted and session updated for user {delivery.USERNAME}.");
            return Ok(new { message = message });
        }

        [HttpPost]
        [Route("reset-manifest-access/{userId}")]
        [Authorize(Policy = "SessionActive")]
        public async Task<IActionResult> ResetManifestAccess([FromBody] DriverVerificationRequest delivery, long userId)
        {
            var accessToken = Request.Cookies["access_token"];
            if (string.IsNullOrEmpty(accessToken))
            {
                _logger.LogWarning("Missing access or refresh token for user {Username} during manifest session update.", delivery.USERNAME);
                return Unauthorized(new { message = "Session tokens missing. Please log in again." });
            }

            var success = await _sessionService.ResetSessionByIdAsync(userId);
            if (!success)
            {
                _logger.LogError($"CheckManifestAccess: Failed to reset session access for user {delivery.USERNAME}.");
                return StatusCode(500, $"Failed to reset session access for user {delivery.USERNAME} ({delivery.MFSTDATE} - {delivery.POWERUNIT}).");
            }

            _logger.LogInformation($"ReleaseManifestAccess: Manifest access granted and session updated for user {delivery.USERNAME}.");
            return Ok(new { message = $"Manifest access ({delivery.MFSTDATE} - {delivery.POWERUNIT}) released and session reset for user {delivery.USERNAME}." });
        }
    }
}

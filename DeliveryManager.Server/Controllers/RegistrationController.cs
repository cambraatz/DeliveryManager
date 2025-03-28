/*/////////////////////////////////////////////////////////////////////////////
 
Author: Cameron Braatz
Date: 11/15/2024
Update: 1/9/2025

*//////////////////////////////////////////////////////////////////////////////

using DeliveryManager.Server.Models;
using DeliveryManager.Server.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Data;
using System.Data.SqlClient;

// token initialization...
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using System.Threading.Tasks;
using System.Security.Cryptography.X509Certificates;

public class CompanyRequest
{
    public string Username { get; set; }
    public string Company { get; set; }
    public string AccessToken { get; set; }

}

/*/////////////////////////////////////////////////////////////////////////////
 
Registration Controller API Functions

API endpoint functions that handle standard user credential verification, 

API Endpoints (...api/Registration/*):
    Login: check database for matching username/password combo, divert admins
    

*//////////////////////////////////////////////////////////////////////////////

namespace DeliveryManager.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RegistrationController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly IHostEnvironment _environment;
        private readonly ILogger<RegistrationController> _logger;
        //private readonly TokenService _tokenService;
        private readonly string connString;

        public RegistrationController(IConfiguration configuration, TokenService tokenService)
        {
            _configuration = configuration;
            //_tokenService = tokenService;
            //connString = _configuration.GetConnectionString("LOCAL");
            connString = _configuration.GetConnectionString("DriverChecklistDBCon");
        }

        [HttpPost]
        [Route("Logout")]
        public IActionResult Logout()
        {
            /*CookieOptions options = new CookieOptions
            {
                Expires = DateTime.UtcNow.AddDays(-1),
                HttpOnly = true,
                Secure = true,
                Domain = ".tcsservices.com",
            };*/

            foreach (var cookie in Request.Cookies)
            {
                Response.Cookies.Append(cookie.Key, cookie.Value, CookieService.removeOptions);
            }

            return Ok(new { message = "Logged out successfully" });
        }

        [HttpPost]
        [Route("Return")]
        public IActionResult Return()
        {
            CookieService.ExtendCookies(HttpContext, 15);

            /*CookieOptions options = new CookieOptions
            {
                Expires = DateTime.UtcNow.AddMinutes(15),
                HttpOnly = true,
                Secure = true,
                Domain = ".tcsservices.com",
                SameSite = SameSiteMode.None,
                Path = "/"
            };*/

            Response.Cookies.Append("return", "true", CookieService.accessOptions);

            return Ok(new { message = "Returning, cookies extended by 15 minutes." });
        }

        [HttpPost]
        [Route("RefreshToken")]
        public IActionResult RefreshToken([FromBody] RefreshRequest request)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var principal = tokenHandler.ValidateToken(request.RefreshToken, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"])),
                ValidateIssuer = true,
                ValidIssuer = _configuration["Jwt:Issuer"],
                ValidateAudience = true,
                ValidAudience = _configuration["Jwt:Audience"],
                ValidateLifetime = false
            }, out SecurityToken validatedToken);

            if (validatedToken is JwtSecurityToken jwtToken &&
                jwtToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
            {
                var tokenService = new TokenService(_configuration);
                var tokens = tokenService.GenerateToken(request.Username);
                return Ok(new { AccessToken = tokens.AccessToken, RefreshToken = tokens.RefreshToken });
            }
            return Unauthorized("Invalid Token.");
        }

        /*/////////////////////////////////////////////////////////////////////////////
 
        ValidateUser()

        i.p.

        *//////////////////////////////////////////////////////////////////////////////

        /*REVISITED + REQUIRED*/
        [HttpPost]
        [Route("ValidateUser")]
        public async Task<JsonResult> ValidateUser()
        {
            //var accessToken = Request.Cookies["access_token"];
            //var refreshToken = Request.Cookies["refresh_token"];
            //var username = Request.Cookies["username"];
            //var company = Request.Cookies["company"];

            var tokenService = new TokenService(_configuration);
            (bool success, string message) tokenAuth = tokenService.AuthorizeRequest(HttpContext);
            if (!tokenAuth.success)
            {
                return new JsonResult(new { success = false, message = tokenAuth.message });
            }

            var username = Request.Cookies["username"];
            if (username == null)
            {
                return new JsonResult(new { success = false, message = "Username was not found in cookies." });
            }

            string query = "select * from dbo.USERS where USERNAME COLLATE SQL_Latin1_General_CP1_CS_AS = @USERNAME";

            DataTable table = new DataTable();
            string sqlDatasource = connString;
            SqlDataReader myReader;
            await using (SqlConnection myCon = new SqlConnection(sqlDatasource))
            {
                myCon.Open();
                using (SqlCommand myCommand = new SqlCommand(query, myCon))
                {
                    myCommand.Parameters.AddWithValue("@USERNAME", username);

                    myReader = myCommand.ExecuteReader();
                    table.Load(myReader);
                    myReader.Close();
                    myCon.Close();
                }
            }
            if (table.Rows.Count > 0)
            {
                User user = new User
                { 
                    Username = username,
                    Permissions = table.Rows[0]["PERMISSIONS"] != DBNull.Value ? table.Rows[0]["PERMISSIONS"].ToString() : null,
                    Powerunit = table.Rows[0]["POWERUNIT"].ToString(),
                    ActiveCompany = table.Rows[0]["COMPANYKEY01"].ToString(),
                    Companies = new List<string>(),
                    Modules = new List<string>()
                };

                return new JsonResult(new { success = true, user = user });
            }
            else
            {
                return new JsonResult(new { success = false, message = "Invalid Credentials" });
            }
        }

        /*/////////////////////////////////////////////////////////////////////////////
 
        VerifyPowerunit(driverVerification driver)

        Token-protected verification of powerunit/delivery date combination existence
        in database. Handling of success/fail is handled with frontend logic.

        *//////////////////////////////////////////////////////////////////////////////

        // LOGIN FUNCTION...
        [HttpPost]
        [Route("VerifyPowerunit")]
        public async Task<JsonResult> VerifyPowerunit([FromBody] driverVerification driver)
        {
            var tokenService = new TokenService(_configuration);
            (bool success, string message) tokenAuth = tokenService.AuthorizeRequest(HttpContext);
            if (!tokenAuth.success)
            {
                return new JsonResult(new { success = false, message = tokenAuth.message });
            }

            string updatequery = "update dbo.USERS set POWERUNIT=@POWERUNIT where USERNAME=@USERNAME";
            string selectquery = "select * from dbo.DMFSTDAT where MFSTDATE=@MFSTDATE and POWERUNIT=@POWERUNIT";

            DataTable table = new DataTable();
            string sqlDatasource = connString;
            SqlDataReader myReader;

            try
            {
                await using (SqlConnection con = new SqlConnection(sqlDatasource))
                {
                    con.Open();

                    using (SqlCommand cmd = new SqlCommand(updatequery, con))
                    {
                        cmd.Parameters.AddWithValue("@USERNAME", driver.USERNAME);
                        cmd.Parameters.AddWithValue("@PASSWORD", driver.PASSWORD);
                        cmd.Parameters.AddWithValue("@POWERUNIT", driver.POWERUNIT);

                        myReader = cmd.ExecuteReader();
                        myReader.Close();
                    }

                    con.Close();
                }
            }
            catch (Exception ex)
            {
                return new JsonResult("Error: " + ex.Message);
            }

            var company = Request.Cookies["company"];
            if (string.IsNullOrEmpty(company))
            {
                return new JsonResult(new { success = false, message = "Company key is missing." });
            }

            sqlDatasource = _configuration.GetConnectionString(company);

            try
            {
                await using (SqlConnection con = new SqlConnection(sqlDatasource))
                {
                    con.Open();

                    using (SqlCommand cmd = new SqlCommand(selectquery, con))
                    {
                        cmd.Parameters.AddWithValue("@MFSTDATE", driver.MFSTDATE);
                        cmd.Parameters.AddWithValue("@POWERUNIT", driver.POWERUNIT);
                        //myCommand.ExecuteNonQuery();

                        myReader = cmd.ExecuteReader();
                        table.Load(myReader);
                        myReader.Close();
                    }

                    con.Close();
                }

                if (table.Rows.Count > 0)
                {
                    return new JsonResult(new { success = true, message = "Valid date/powerunit combination was found." });
                }
                else
                {
                    return new JsonResult(new { success = false, message = "Invalid date/powerunit combination, please try again." });
                }
            }
            catch (Exception ex)
            {
                return new JsonResult(new { success = false, message = "Querying for valid delivery failed:" + ex });
            }
        }
    }
}

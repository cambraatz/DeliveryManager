/*/////////////////////////////////////////////////////////////////////////////
 
Author: Cameron Braatz
Date: 11/15/2024

*//////////////////////////////////////////////////////////////////////////////

using DeliveryManager.Server.Models;
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

// add utility to generate JWTs...
public class TokenService
{
    private readonly IConfiguration _configuration;
    public TokenService(IConfiguration configuration)
    {
        _configuration = configuration;
    }
    public (string AccessToken, string RefreshToken) GenerateToken(string username)
    {
        var accessClaims = new[]
        {
            new Claim(ClaimTypes.Name, username),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var refreshClaims = new[]
        {
            new Claim(ClaimTypes.Name, username),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var accessToken = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: accessClaims,
            expires: DateTime.UtcNow.AddMinutes(15),
            signingCredentials: creds);

        var refreshToken = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: refreshClaims,
            expires: DateTime.UtcNow.AddDays(1),
            signingCredentials: creds);

        return (new JwtSecurityTokenHandler().WriteToken(accessToken), new JwtSecurityTokenHandler().WriteToken(refreshToken));
    }
}

public class RefreshRequest
{
    public string Username { get; set; }
    public string RefreshToken { get; set; }
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
        //private readonly TokenService _tokenService;
        private readonly string connString;

        public RegistrationController(IConfiguration configuration, TokenService tokenService)
        {
            _configuration = configuration;
            //_tokenService = tokenService;
            connString = _configuration.GetConnectionString("DriverChecklistTestCon");
            //connString = _configuration.GetConnectionString("DriverChecklistDBCon");
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
                /*var username = principal.Identity.Name;
                if (username == null)
                {
                    return Unauthorized("Invalid token payload");
                }*/
                var tokenService = new TokenService(_configuration);
                var tokens = tokenService.GenerateToken(request.Username);
                return Ok(new { AccessToken = tokens.AccessToken, RefreshToken = tokens.RefreshToken });
            }
            return Unauthorized();
        }

        /*/////////////////////////////////////////////////////////////////////////////
 
        Login(username, password, powerunit=null)

        Handles both driver and administrator login credentials, sending the former to
        the standard application flow and the latter to the admin portal.

        Queries the USERS database table for any users matching the provided username 
        and password combination provided by the user. On successful query, declare the
        task (ie: admin/driver) and return the powerunit on record when logging into a
        valid driver account.

        *//////////////////////////////////////////////////////////////////////////////

        [HttpPost]
        [Route("Login")]
        public async Task<JsonResult> Login([FromBody] driverCredentials user)
        {
            string query = "select * from dbo.USERS where USERNAME COLLATE SQL_Latin1_General_CP1_CS_AS = @USERNAME and PASSWORD COLLATE SQL_Latin1_General_CP1_CS_AS = @PASSWORD";

            DataTable table = new DataTable();
            string sqlDatasource = connString;
            SqlDataReader myReader;
            await using (SqlConnection myCon = new SqlConnection(sqlDatasource))
            {
                myCon.Open();
                using (SqlCommand myCommand = new SqlCommand(query, myCon))
                {
                    myCommand.Parameters.AddWithValue("@USERNAME", user.USERNAME);
                    myCommand.Parameters.AddWithValue("@PASSWORD", user.PASSWORD);

                    myReader = myCommand.ExecuteReader();
                    table.Load(myReader);
                    myReader.Close();
                    myCon.Close();
                }
            }
            if (table.Rows.Count > 0)
            {
                // derive task/powerunit values...
                string task = user.USERNAME == "admin" ? "admin" : "driver";
                string powerunit = (task == "driver") ? table.Rows[0]["POWERUNIT"].ToString() : null;

                // generate token...
                var tokenService = new TokenService(_configuration);
                (string accessToken, string refreshToken) = tokenService.GenerateToken(user.USERNAME);

                return new JsonResult(new { success = true, task = task, powerunit = powerunit, accessToken = accessToken, refreshToken = refreshToken });
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
        [Authorize]
        public async Task<JsonResult> VerifyPowerunit([FromBody] driverVerification driver)
        {
            string updatequery = "update dbo.USERS set USERNAME=@USERNAME, PASSWORD=@PASSWORD, POWERUNIT=@POWERUNIT where USERNAME=@USERNAME";
            string selectquery = "select * from dbo.DMFSTDAT where MFSTDATE=@MFSTDATE and POWERUNIT=@POWERUNIT";

            DataTable table = new DataTable();
            string sqlDatasource = connString;
            SqlDataReader myReader;

            await using (SqlConnection myCon = new SqlConnection(sqlDatasource))
            {
                try
                {
                    myCon.Open();
                    using (SqlCommand myCommand = new SqlCommand(updatequery, myCon))
                    {
                        myCommand.Parameters.AddWithValue("@USERNAME", driver.USERNAME);
                        myCommand.Parameters.AddWithValue("@PASSWORD", driver.PASSWORD);
                        myCommand.Parameters.AddWithValue("@POWERUNIT", driver.POWERUNIT);

                        myReader = myCommand.ExecuteReader();
                        table.Load(myReader);
                        myReader.Close();
                    }

                    using (SqlCommand myCommand = new SqlCommand(selectquery, myCon))
                    {
                        myCommand.Parameters.AddWithValue("@MFSTDATE", driver.MFSTDATE);
                        myCommand.Parameters.AddWithValue("@POWERUNIT", driver.POWERUNIT);
                        //myCommand.ExecuteNonQuery();

                        myReader = myCommand.ExecuteReader();
                        table.Load(myReader);
                        myReader.Close();
                    }
                    myCon.Close();

                    if (table.Rows.Count > 0)
                    {
                        //return new JsonResult("Valid");
                        return new JsonResult(new { success = true });
                    }
                    else
                    {
                        //return new JsonResult("Invalid");
                        return new JsonResult(new { success = false });
                    }
                }
                catch (Exception ex)
                {
                    return new JsonResult("Error: " + ex.Message);
                }
            }
        }

        /*/////////////////////////////////////////////////////////////////////////////
 
        GetAllDrivers() - INACTIVE

        Helper function used in debugging, originally used in the context of a 'dump 
        users' button to dump all current users to console for review.

        *//////////////////////////////////////////////////////////////////////////////

        [HttpGet]
        [Route("GetAllDrivers")]
        [Authorize]
        public JsonResult GetAllDrivers()
        {
            string query = "select * from dbo.USERS";

            DataTable table = new DataTable();
            string sqlDatasource = connString;
            SqlDataReader myReader;

            using (SqlConnection myCon = new SqlConnection(sqlDatasource))
            {
                myCon.Open();
                using (SqlCommand myCommand = new SqlCommand(query, myCon))
                {
                    myReader = myCommand.ExecuteReader();
                    table.Load(myReader);
                    myReader.Close();
                    myCon.Close();
                }
            }

            //return new JsonResult(table);
            return new JsonResult(new { success = true, table = table });
        }

        // ADMIN FUNCTION...
        [HttpPut]
        [Route("UpdateDriver")]
        [Authorize]
        public async Task<JsonResult> UpdateDriver([FromForm] driverCredentials user)
        {
            string query = "update dbo.USERS set USERNAME=@USERNAME, PASSWORD=@PASSWORD, POWERUNIT=@POWERUNIT where USERNAME=@USERNAME";

            DataTable table = new DataTable();
            string sqlDatasource = connString;
            SqlDataReader myReader;

            await using (SqlConnection myCon = new SqlConnection(sqlDatasource))
            {
                myCon.Open();
                using (SqlCommand myCommand = new SqlCommand(query, myCon))
                {
                    myCommand.Parameters.AddWithValue("@USERNAME", user.USERNAME);
                    myCommand.Parameters.AddWithValue("@PASSWORD", user.PASSWORD);
                    myCommand.Parameters.AddWithValue("@POWERUNIT", user.POWERUNIT);

                    myReader = myCommand.ExecuteReader();
                    table.Load(myReader);
                    myReader.Close();
                    myCon.Close();
                }
            }
            return new JsonResult("Updated Successfully");
        }

        // ADMIN FUNCTION...
        [HttpPut]
        [Route("AddDriver")]
        [Authorize]
        public async Task<JsonResult> AddDriver([FromForm] string USERNAME, [FromForm] string PASSWORD, [FromForm] string POWERUNIT)
        {
            string insertQuery = "INSERT INTO dbo.USERS(USERNAME, PASSWORD, POWERUNIT) VALUES (@USERNAME, @PASSWORD, @POWERUNIT)";
            string selectQuery = "SELECT * FROM dbo.USERS";

            DataTable table = new DataTable();
            string sqlDatasource = connString;

            await using (SqlConnection myCon = new SqlConnection(sqlDatasource))
            {
                try
                {
                    // open the db connection...
                    myCon.Open();

                    // insert new user to dbo.USERS...
                    using (SqlCommand insertCommand = new SqlCommand(insertQuery, myCon))
                    {
                        insertCommand.Parameters.AddWithValue("@USERNAME", USERNAME);
                        insertCommand.Parameters.AddWithValue("@PASSWORD", DBNull.Value);
                        insertCommand.Parameters.AddWithValue("@POWERUNIT", POWERUNIT);

                        int insertResponse = await insertCommand.ExecuteNonQueryAsync();

                        // check if new user was inserted successfully...
                        if (insertResponse <= 0)
                        {
                            return new JsonResult("Error creating new user.");
                        }
                    }

                    // gather the new table contents for dbo.USERS...
                    using (SqlCommand selectCommand = new SqlCommand(selectQuery, myCon))
                    {
                        SqlDataAdapter adapter = new SqlDataAdapter(selectCommand);
                        adapter.Fill(table);
                    }

                    // close db connection...
                    myCon.Close();

                    // return success message...
                    return new JsonResult(new { success = true, table = table });
                }
                catch (Exception ex)
                {
                    //return new JsonResult("Error: " + ex.Message);
                    return new JsonResult(new { success = false, error = ex.Message });
                }
            }
        }

        // ADMIN + LOGIN FUNCTION...
        [HttpPut]
        [Route("ReplaceDriver")]
        [Authorize]
        public async Task<JsonResult> ReplaceDriver([FromBody] driverCredentials user, string PREVUSER)
        {
            string deleteQuery = "DELETE FROM dbo.USERS WHERE USERNAME = @PREVUSER";
            string insertQuery = "INSERT INTO dbo.USERS(USERNAME, PASSWORD, POWERUNIT) VALUES (@USERNAME, @PASSWORD, @POWERUNIT)";
            string selectQuery = "SELECT * FROM dbo.USERS";

            DataTable table = new DataTable();
            string sqlDatasource = connString;

            await using (SqlConnection myCon = new SqlConnection(sqlDatasource))
            {
                try
                {
                    // open the db connection...
                    myCon.Open();

                    // delete the old user from dbo.USERS...
                    using (SqlCommand deleteCommand = new SqlCommand(deleteQuery, myCon))
                    {
                        deleteCommand.Parameters.AddWithValue("@PREVUSER", PREVUSER);

                        int deleteResult = await deleteCommand.ExecuteNonQueryAsync();

                        // check if old user was deleted successfully...
                        if (deleteResult <= 0)
                        {
                            return new JsonResult("Error deleting previous user, moving forward with replacing user.");
                        }
                    }

                    // insert new user to dbo.USERS...
                    using (SqlCommand insertCommand = new SqlCommand(insertQuery, myCon))
                    {
                        insertCommand.Parameters.AddWithValue("@USERNAME", user.USERNAME);
                        insertCommand.Parameters.AddWithValue("@PASSWORD", string.IsNullOrEmpty(user.PASSWORD) ? DBNull.Value : user.PASSWORD);
                        insertCommand.Parameters.AddWithValue("@POWERUNIT", user.POWERUNIT);

                        int insertResponse = await insertCommand.ExecuteNonQueryAsync();

                        // check if new user was inserted successfully...
                        if (insertResponse <= 0)
                        {
                            return new JsonResult("Error creating new user.");
                        }
                    }

                    // gather the new table contents for dbo.USERS...
                    using (SqlCommand selectCommand = new SqlCommand(selectQuery, myCon))
                    {
                        SqlDataAdapter adapter = new SqlDataAdapter(selectCommand);
                        adapter.Fill(table);
                    }

                    // close db connection...
                    myCon.Close();

                    // return success message...
                    return new JsonResult(new { success = true, table = table });
                }
                catch (Exception ex) 
                {
                    return new JsonResult("Error: " + ex.Message);
                }
            }
        }

        // ADMIN FUNCTION...
        [HttpDelete]
        [Route("DeleteDriver")]
        [Authorize]
        public JsonResult DeleteDriver(string USERNAME)
        {
            string query = "delete from dbo.USERS where USERNAME=@USERNAME";
            string selectQuery = "SELECT * FROM dbo.USERS";

            DataTable table = new DataTable();
            string sqlDatasource = connString;
            SqlDataReader myReader;

            using (SqlConnection myCon = new SqlConnection(sqlDatasource))
            {
                try
                {
                    myCon.Open();
                    using (SqlCommand myCommand = new SqlCommand(query, myCon))
                    {

                        myCommand.Parameters.AddWithValue("@USERNAME", USERNAME);
                        myReader = myCommand.ExecuteReader();
                        table.Load(myReader);
                        myReader.Close();

                    }

                    // gather the new table contents for dbo.USERS...
                    using (SqlCommand selectCommand = new SqlCommand(selectQuery, myCon))
                    {
                        SqlDataAdapter adapter = new SqlDataAdapter(selectCommand);
                        adapter.Fill(table);
                    }
                    myCon.Close();

                    // return success message...
                    //return new JsonResult(table);
                    return new JsonResult(new { success = true });
                }
                catch (Exception ex)
                {
                    //return new JsonResult("Error: " + ex.Message);
                    return new JsonResult(new { success = false, error = "Error: " + ex.Message });

                }
            }
        }
        // ADMIN + LOGIN FUNCTION...
        [HttpPost]
        //[HttpGet]
        [Route("PullDriver")]
        [Authorize]
        public JsonResult PullDriver([FromBody] driverCredentials user)
        {
            string query = "SELECT USERNAME, PASSWORD, POWERUNIT FROM dbo.USERS WHERE USERNAME = @USERNAME";

            DataTable table = new DataTable();
            string sqlDatasource = connString;

            SqlDataReader myReader;
            using (SqlConnection myCon = new SqlConnection(sqlDatasource))
            {
                try
                {
                    myCon.Open();
                    using (SqlCommand myCommand = new SqlCommand(query, myCon))
                    {
                        myCommand.Parameters.AddWithValue("@USERNAME", user.USERNAME);

                        myReader = myCommand.ExecuteReader();
                        table.Load(myReader);
                        myReader.Close();
                    }

                    myCon.Close();

                    // return success message...
                    return new JsonResult(table);
                }
                catch (Exception ex)
                {
                    return new JsonResult("Error: " + ex.Message);
                }
            }
        }

        // ADMIN + LOGIN FUNCTION...
        [HttpGet]
        [Route("GetCompany")]
        public async Task<JsonResult> GetCompany([FromQuery] string COMPANYKEY) 
        {
            string query = "SELECT * FROM dbo.COMPANY where COMPANYKEY=@COMPANYKEY";
            Company company = null;

            string sqlDatasource = connString;

            await using (SqlConnection myCon = new SqlConnection(sqlDatasource))
            {
                try
                {
                    await myCon.OpenAsync();
                    using (SqlCommand myCommand = new SqlCommand(query, myCon))
                    {
                        myCommand.Parameters.AddWithValue("@COMPANYKEY", COMPANYKEY);
                        using(SqlDataReader myReader = await myCommand.ExecuteReaderAsync())
                        {
                            if (myReader.Read())
                            {
                                company = new Company
                                {
                                    COMPANYKEY = myReader["COMPANYKEY"].ToString(),
                                    COMPANYNAME = myReader["COMPANYNAME"].ToString()
                                };
                            }
                        }
                    }

                    return new JsonResult(new { success=true, COMPANYKEY=company.COMPANYKEY, COMPANYNAME=company.COMPANYNAME });
                }
                catch (Exception ex)
                {
                    //return new JsonResult("Error: ", ex.Message);
                    return new JsonResult(new { success=false, error=ex.Message });
                }
            }

        }
        // ADMIN FUNCTION...
        [HttpPut]
        [Route("SetCompany")]
        [Authorize]
        public async Task<JsonResult> SetCompany([FromForm] string COMPANYNAME)
        {
            string query = "update dbo.COMPANY set COMPANYNAME=@COMPANYNAME where COMPANYKEY=@COMPANYKEY";
            string insertQuery = "insert into dbo.COMPANY (COMPANYKEY, COMPANYNAME) values (@COMPANYKEY, @COMPANYNAME)";

            DataTable table = new DataTable();
            string sqlDatasource = connString;
            SqlDataReader myReader;

            await using (SqlConnection myCon = new SqlConnection(sqlDatasource))
            {
                try 
                {
                    await myCon.OpenAsync();
                    using (SqlCommand myCommand = new SqlCommand(query, myCon))
                    {
                        myCommand.Parameters.AddWithValue("@COMPANYNAME", COMPANYNAME);
                        myCommand.Parameters.AddWithValue("@COMPANYKEY", "c01");

                        int rowsAffected = await myCommand.ExecuteNonQueryAsync();

                        if (rowsAffected > 0)
                        { 
                            return new JsonResult(new { success=true, message="Company Updated", COMPANYNAME } );
                        }
                    }

                    using (SqlCommand myCommand = new SqlCommand(insertQuery, myCon))
                    {
                        myCommand.Parameters.AddWithValue("@COMPANYNAME", COMPANYNAME);
                        myCommand.Parameters.AddWithValue("@COMPANYKEY", "c01");

                        int rowsInserted = await myCommand.ExecuteNonQueryAsync();

                        if (rowsInserted > 0)
                        {
                            return new JsonResult(new { success = true, message = "New Company Added", COMPANYNAME });
                        }
                        else
                        {
                            return new JsonResult(new { success = false, message = "Failed to add new company" });
                        }
                    }
                }
                catch (Exception ex)
                {
                    return new JsonResult("Error: " + ex.Message);
                }
            }
        }
    }
}

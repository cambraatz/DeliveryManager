/*/////////////////////////////////////////////////////////////////////////////
 
Author: Cameron Braatz
Date: 4/9/2025
Update: -/-/2025

*//////////////////////////////////////////////////////////////////////////////

using DeliveryManager.Server.Models;
using DeliveryManager.Server.Services;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Data;
using System.Data.SqlClient;
using System.Runtime.CompilerServices;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace DeliveryManager.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DeliveryController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly IHostEnvironment _environment;
        private readonly ILogger<DeliveryController> _logger;
        private readonly LoggingService _loggingService;
        //private readonly TokenService _tokenService;
        private readonly string connString;

        public DeliveryController(IConfiguration configuration, TokenService tokenService, ILogger<DeliveryController> logger)
        {
            _configuration = configuration;
            //_tokenService = tokenService;
            connString = _configuration.GetConnectionString("DriverChecklistDBCon");
            _logger = logger;
            _loggingService = new LoggingService(_logger);
        }

        /*/////////////////////////////////////////////////////////////////////////////
 
        ValidateUser()

        i.p.

        *//////////////////////////////////////////////////////////////////////////////

        [HttpPost]
        [Route("ValidateUser")]
        public async Task<JsonResult> ValidateUser()
        {
            string logData()
            {
                CallerData caller = _loggingService.CallerLocation();
                string tag = $"{caller.filePath}: line {caller.lineNumber}";
                return tag;
            } 
            
            _logger.Log(LogLevel.Information, $"Attempting to validate user credentials; {logData()}");

            var tokenService = new TokenService(_configuration);
            (bool success, string message) tokenAuth = tokenService.AuthorizeRequest(HttpContext);
            if (!tokenAuth.success)
            {
                UnauthorizedAccessException exception = new UnauthorizedAccessException($"Token authorization failed, {tokenAuth.message}; {logData()}");
                //_logger.LogError(exception, exception.Message);
                return new JsonResult(new { success = false, message = exception.Message }) { StatusCode = StatusCodes.Status401Unauthorized };
            }

            var username = Request.Cookies["username"];
            if (username == null)
            {
                ArgumentNullException exception = new ArgumentNullException($"Failed to find 'username' from cookies; {logData()}");
                _logger.LogError(exception, exception.Message);
                return new JsonResult(new { success = false, message = exception.Message }) { StatusCode = StatusCodes.Status401Unauthorized };
            }

            var company_mapping = Request.Cookies["company_mapping"];
            if (company_mapping == null) 
            {
                ArgumentNullException exception = new ArgumentNullException($"Failed to find 'company_mapping' from cookies; {logData()}");
                _logger.LogError(exception, exception.Message);
                return new JsonResult(new { success = false, message = exception.Message }) { StatusCode = StatusCodes.Status401Unauthorized };
            };

            string query = "select * from dbo.USERS where USERNAME COLLATE SQL_Latin1_General_CP1_CS_AS = @USERNAME";
            DataTable table = new DataTable();
            SqlDataReader myReader;

            try
            {
                await using (SqlConnection myCon = new SqlConnection(connString))
                {
                    await myCon.OpenAsync();
                    using (SqlCommand myCommand = new SqlCommand(query, myCon))
                    {
                        myCommand.Parameters.AddWithValue("@USERNAME", username);
                        myReader = myCommand.ExecuteReader();
                        table.Load(myReader);
                        myReader.Close();
                        await myCon.CloseAsync();
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

                    return new JsonResult(new { success = true, user = user, mapping = company_mapping });
                }
                else
                {
                    ArgumentNullException exception = new ArgumentNullException($"Failed to find valid credentials for the current user, contact administrator; {logData()}");
                    _logger.LogError(exception, exception.Message);
                    return new JsonResult(new { success = false, message = exception.Message });
                }
            }
            catch (Exception ex) 
            {
                _logger.LogError(ex, ex.Message);
                return new JsonResult(new { success = false, message = ex.Message });
            }
        }

        /*/////////////////////////////////////////////////////////////////////////////
 
        VerifyPowerunit(driverVerification driver)

        Token-protected verification of powerunit/delivery date combination existence
        in database. Handling of success/fail is handled with frontend logic.

        *//////////////////////////////////////////////////////////////////////////////

        [HttpPost]
        [Route("VerifyPowerunit")]
        public async Task<JsonResult> VerifyPowerunit([FromBody] driverVerification driver)
        {
            var tokenService = new TokenService(_configuration);
            (bool success, string message) tokenAuth = tokenService.AuthorizeRequest(HttpContext);
            if (!tokenAuth.success)
            {
                return new JsonResult(new { success = false, message = tokenAuth.message }) { StatusCode = StatusCodes.Status401Unauthorized };
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
                return new JsonResult(new { success = false, message = "Company key is missing." }) { StatusCode = StatusCodes.Status401Unauthorized };
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

        /*/////////////////////////////////////////////////////////////////////////////
 
        GetDeliveries(string POWERUNIT, string MFSTDATE)

        i.p.

        *//////////////////////////////////////////////////////////////////////////////

        private string GetMessage(DataTable undelivered, DataTable delivered)
        {
            if (undelivered.Rows.Count > 0 && delivered.Rows.Count > 0)
            {
                return "Both tables returned non-null values";
            }
            if (undelivered.Rows.Count == 0 && delivered.Rows.Count > 0)
            {
                return "Delivered returned non-null values, no valid undelivered records.";
            }
            if (delivered.Rows.Count == 0 && undelivered.Rows.Count > 0)
            {
                return "Undelivered returned non-null values, no valid delivered records.";
            }

            return "No valid records were found.";
        }

        [HttpGet]
        [Route("GetDeliveries")]
        public async Task<JsonResult> GetDeliveries(string powerunit, string mfstdate)
        {
            _logger.Log(LogLevel.Information, $"Attempting to retrieve deliveries ({powerunit}, {mfstdate})");

            var tokenService = new TokenService(_configuration);
            (bool success, string message) tokenAuth = tokenService.AuthorizeRequest(HttpContext);
            if (!tokenAuth.success)
            {
                return new JsonResult(new { success = false, message = tokenAuth.message }) { StatusCode = StatusCodes.Status401Unauthorized };
            }

            var company = Request.Cookies["company"];
            if (string.IsNullOrEmpty(company))
            {
                return new JsonResult(new { success = false, message = "Company key is missing." }) { StatusCode = StatusCodes.Status401Unauthorized };
            }

            string undeliveredQuery = "select * from dbo.DMFSTDAT where POWERUNIT=@POWERUNIT and MFSTDATE=@MFSTDATE and STATUS=0 order by STOP";
            DataTable undeliveredTable = new DataTable();

            string deliveredQuery = "select * from dbo.DMFSTDAT where POWERUNIT=@POWERUNIT and MFSTDATE=@MFSTDATE and STATUS=1 order by STOP";
            DataTable deliveredTable = new DataTable();

            string sqlDatasource = _configuration.GetConnectionString(company);
            SqlDataReader myReader;

            try 
            {
                using (SqlConnection myCon = new SqlConnection(sqlDatasource))
                {
                    await myCon.OpenAsync();
                    using (SqlCommand undeliveredCmd = new SqlCommand(undeliveredQuery, myCon))
                    {
                        undeliveredCmd.Parameters.AddWithValue("@POWERUNIT", powerunit);
                        undeliveredCmd.Parameters.AddWithValue("@MFSTDATE", mfstdate);
                        myReader = await undeliveredCmd.ExecuteReaderAsync();
                        undeliveredTable.Load(myReader);
                        myReader.Close();
                    }

                    using (SqlCommand deliveredCmd = new SqlCommand(deliveredQuery, myCon))
                    {
                        deliveredCmd.Parameters.AddWithValue("@POWERUNIT", powerunit);
                        deliveredCmd.Parameters.AddWithValue("@MFSTDATE", mfstdate);
                        myReader = await deliveredCmd.ExecuteReaderAsync();
                        deliveredTable.Load(myReader);
                        myReader.Close();
                    }
                    await myCon.CloseAsync();

                    return new JsonResult(new
                    {
                        success = true,
                        delivered = deliveredTable,
                        undelivered = undeliveredTable,
                        message = GetMessage(undeliveredTable, deliveredTable)
                    });
                }
            } catch (Exception ex) 
            {
                _logger.LogError(ex, $"An error occurred while fetching deliveries (GetDeliveries(), DeliveryManagerController.cs); Exception: {ex.Message}");
                return new JsonResult(new { success = false, error = "Error: " + ex.Message });
            }
        }

        /*/////////////////////////////////////////////////////////////////////////////
 
        UpdateManifest(DeliveryForm data) - {}

        i.p.

        *//////////////////////////////////////////////////////////////////////////////

        [HttpPut]
        [Route("UpdateManifest")]
        public async Task<JsonResult> UpdateManifest([FromForm] DeliveryForm data)
        {
            //_logger.Log(LogLevel.Information,$"Attempting to update manifest ({data[0].MFSTKEY + (data.Count > 1 ? $"+ {data.Count} others" : "")}), [DeliveryManagerController, UpdateManifest]");

            var tokenService = new TokenService(_configuration);
            (bool success, string message) tokenAuth = tokenService.AuthorizeRequest(HttpContext);
            if (!tokenAuth.success)
            {
                UnauthorizedAccessException exception = new UnauthorizedAccessException($"Token authorization failed (UpdateManifest(), DeliveryManagerController.cs); Verbose: {tokenAuth.message}");
                _logger.LogError(exception,exception.Message);

                return new JsonResult(new { success = false, message = exception.Message }) { StatusCode = StatusCodes.Status401Unauthorized };
            }

            var company = Request.Cookies["company"];
            if (string.IsNullOrEmpty(company))
            {
                ArgumentNullException exception = new ArgumentNullException("Failed to find 'company' from cookies (UpdateManifest(), DeliveryManagerController.cs)");
                return new JsonResult(new { success = false, message = "Company key is missing." }) { StatusCode = StatusCodes.Status401Unauthorized };
            }

            var username = Request.Cookies["username"];
            if (username == null)
            {
                ArgumentNullException exception = new ArgumentNullException($"Failed to find 'username' from cookies");
                //_logger.LogError(exception, exception.Message);
                return new JsonResult(new { success = false, message = exception.Message }) { StatusCode = StatusCodes.Status401Unauthorized };
            }

            try
            {
                // define path where the image is to be saved...
                string folderPath = Path.Combine("wwwroot", "uploads");
                if (!Directory.Exists(folderPath))
                {
                    Directory.CreateDirectory(folderPath);
                }

                string location_path = null;
                string loc_name = null;

                string sign_path = null;
                string sign_name = null;

                // save image locally when photo was uploaded...
                if (data.DLVDIMGFILELOCN != null)
                {
                    try
                    {
                        // generate a unique file name...
                        loc_name = Guid.NewGuid().ToString().Substring(16) + Path.GetExtension(path: data.DLVDIMGFILELOCN.FileName);
                        location_path = Path.Combine(folderPath, loc_name);

                        // save the file to the server...
                        using (var fileStream = new FileStream(location_path, FileMode.Create))
                        {
                            await data.DLVDIMGFILELOCN.CopyToAsync(fileStream);
                        }
                    }
                    catch (Exception ex)
                    {
                        System.Diagnostics.Debug.WriteLine($"Error saving delivery image file: {ex.Message}");
                    }
                }
                // omit saving, point back to image already on file...
                else
                {
                    loc_name = data.location_string;
                }

                // save image locally when photo was uploaded...
                if (data.DLVDIMGFILESIGN != null)
                {
                    try
                    {
                        // generate a unique file name...
                        sign_name = Guid.NewGuid().ToString().Substring(16) + Path.GetExtension(path: data.DLVDIMGFILESIGN.FileName);
                        sign_path = Path.Combine(folderPath, sign_name);

                        // save the file to the server...
                        using (var fileStream = new FileStream(sign_path, FileMode.Create))
                        {
                            await data.DLVDIMGFILESIGN.CopyToAsync(fileStream);
                        }
                    }
                    catch (Exception ex)
                    {
                        System.Diagnostics.Debug.WriteLine($"Error saving delivery signature file: {ex.Message}");
                    }
                }
                // omit saving, point back to image already on file...
                else
                {
                    sign_name = data.signature_string;
                }

                string query = "update dbo.DMFSTDAT set MFSTKEY = @MFSTKEY,STATUS = @STATUS,LASTUPDATE = @LASTUPDATE,MFSTNUMBER = @MFSTNUMBER," +
                "POWERUNIT = @POWERUNIT,STOP = @STOP,MFSTDATE = @MFSTDATE,PRONUMBER = @PRONUMBER,PRODATE = @PRODATE,SHIPNAME = @SHIPNAME," +
                "CONSNAME = @CONSNAME,CONSADD1 = @CONSADD1,CONSADD2 = @CONSADD2,CONSCITY = @CONSCITY,CONSSTATE = @CONSSTATE,CONSZIP = @CONSZIP," +
                "TTLPCS = @TTLPCS,TTLYDS = @TTLYDS,TTLWGT = @TTLWGT,DLVDDATE = @DLVDDATE,DLVDTIME = @DLVDTIME,DLVDPCS = @DLVDPCS,DLVDSIGN = @DLVDSIGN," +
                "DLVDNOTE = @DLVDNOTE,DLVDIMGFILELOCN = @DLVDIMGFILELOCN,DLVDIMGFILESIGN = @DLVDIMGFILESIGN,USERNAME = @USERNAME where MFSTKEY=@MFSTKEY";

                DataTable table = new DataTable();
                string sqlDatasource = _configuration.GetConnectionString(company);
                SqlDataReader myReader;

                await using (SqlConnection myCon = new SqlConnection(sqlDatasource))
                {
                    myCon.Open();
                    using (SqlCommand myCommand = new SqlCommand(query, myCon))
                    {
                        myCommand.Parameters.AddWithValue("@MFSTKEY", data.MFSTKEY);
                        myCommand.Parameters.AddWithValue("@STATUS", data.STATUS);
                        myCommand.Parameters.AddWithValue("@LASTUPDATE", data.LASTUPDATE);
                        myCommand.Parameters.AddWithValue("@MFSTNUMBER", data.MFSTNUMBER);
                        myCommand.Parameters.AddWithValue("@POWERUNIT", data.POWERUNIT);
                        myCommand.Parameters.AddWithValue("@STOP", data.STOP);
                        myCommand.Parameters.AddWithValue("@MFSTDATE", data.MFSTDATE);
                        myCommand.Parameters.AddWithValue("@PRONUMBER", data.PRONUMBER);
                        myCommand.Parameters.AddWithValue("@PRODATE", data.PRODATE);
                        myCommand.Parameters.AddWithValue("@SHIPNAME", data.SHIPNAME);
                        myCommand.Parameters.AddWithValue("@CONSNAME", data.CONSNAME);
                        myCommand.Parameters.AddWithValue("@CONSADD1", data.CONSADD1);
                        myCommand.Parameters.AddWithValue("@CONSADD2", data.CONSADD2 == null || data.CONSADD2 == "null" ? DBNull.Value : data.CONSADD2);
                        myCommand.Parameters.AddWithValue("@CONSCITY", data.CONSCITY);
                        myCommand.Parameters.AddWithValue("@CONSSTATE", data.CONSSTATE);
                        myCommand.Parameters.AddWithValue("@CONSZIP", data.CONSZIP);
                        myCommand.Parameters.AddWithValue("@TTLPCS", data.TTLPCS);
                        myCommand.Parameters.AddWithValue("@TTLYDS", data.TTLYDS);
                        myCommand.Parameters.AddWithValue("@TTLWGT", data.TTLWGT);
                        myCommand.Parameters.AddWithValue("@DLVDDATE", data.DLVDDATE == null || data.DLVDDATE == "null" ? DBNull.Value : data.DLVDDATE);
                        myCommand.Parameters.AddWithValue("@DLVDTIME", data.DLVDTIME == null || data.DLVDTIME == "null" ? DBNull.Value : data.DLVDTIME);
                        myCommand.Parameters.AddWithValue("@DLVDPCS", data.DLVDPCS == null || data.DLVDPCS == -1 ? DBNull.Value : data.DLVDPCS);
                        myCommand.Parameters.AddWithValue("@DLVDSIGN", data.DLVDSIGN == null || data.DLVDSIGN == "null" ? DBNull.Value : data.DLVDSIGN);
                        myCommand.Parameters.AddWithValue("@DLVDNOTE", data.DLVDNOTE == null || data.DLVDNOTE == "null" ? DBNull.Value : data.DLVDNOTE);
                        myCommand.Parameters.AddWithValue("@DLVDIMGFILELOCN", loc_name == null || loc_name == "null" ? DBNull.Value : loc_name);
                        myCommand.Parameters.AddWithValue("@DLVDIMGFILESIGN", sign_name == null || sign_name == "null" ? DBNull.Value : sign_name);
                        myCommand.Parameters.AddWithValue("@USERNAME", username);

                        myReader = myCommand.ExecuteReader();
                        table.Load(myReader);
                        myReader.Close();
                        myCon.Close();
                    }
                    return new JsonResult(new { success = true, table = table });
                }
            }
            catch (Exception ex)
            {
                return new JsonResult(new { success = false, error = "Error updating delivery: " + ex.Message });
            }
        }

        [HttpPut]
        [Route("UpdateManifests")]
        public async Task<JsonResult> UpdateManifests([FromBody] List<DeliveryForm> data)
        {
            _logger.Log(LogLevel.Information,$"Attempting to update manifest ({data[0].MFSTKEY + (data.Count > 1 ? $"+ {data.Count} others" : "")}), [DeliveryManagerController, UpdateManifest]");

            var tokenService = new TokenService(_configuration);
            (bool success, string message) tokenAuth = tokenService.AuthorizeRequest(HttpContext);
            if (!tokenAuth.success)
            {
                UnauthorizedAccessException exception = new UnauthorizedAccessException($"Token authorization failed (UpdateManifest(), DeliveryManagerController.cs); Verbose: {tokenAuth.message}");
                _logger.LogError(exception, exception.Message);

                return new JsonResult(new { success = false, message = exception.Message }) { StatusCode = StatusCodes.Status401Unauthorized };
            }

            var company = Request.Cookies["company"];
            if (string.IsNullOrEmpty(company))
            {
                ArgumentNullException exception = new ArgumentNullException("Failed to find 'company' from cookies (UpdateManifest(), DeliveryManagerController.cs)");
                return new JsonResult(new { success = false, message = "Company key is missing." }) { StatusCode = StatusCodes.Status401Unauthorized };
            }

            string? location_path = null;
            string? loc_name = null;

            string? sign_path = null;
            string? sign_name = null;

            // define path where the image is to be saved...
            string folderPath = Path.Combine("wwwroot", "uploads");
            if (!Directory.Exists(folderPath))
            {
                Directory.CreateDirectory(folderPath);
            }

            // save image locally when photo was uploaded...
            DeliveryForm activeDelivery = data[0];
            if (activeDelivery.DLVDIMGFILELOCN != null)
            {
                try
                {
                    // generate a unique file name...
                    loc_name = Guid.NewGuid().ToString().Substring(16) + Path.GetExtension(path: activeDelivery.DLVDIMGFILELOCN.FileName);
                    location_path = Path.Combine(folderPath, loc_name);

                    // save the file to the server...
                    using (var fileStream = new FileStream(location_path, FileMode.Create))
                    {
                        await activeDelivery.DLVDIMGFILELOCN.CopyToAsync(fileStream);
                    }
                }
                catch (Exception ex)
                {
                    System.Diagnostics.Debug.WriteLine($"Error saving delivery image file: {ex.Message}");
                }
            }
            // omit saving, point back to image already on file...
            else
            {
                loc_name = activeDelivery.location_string;
            }

            // save image locally when photo was uploaded...
            if (activeDelivery.DLVDIMGFILESIGN != null)
            {
                try
                {
                    // generate a unique file name...
                    sign_name = Guid.NewGuid().ToString().Substring(16) + Path.GetExtension(path: activeDelivery.DLVDIMGFILESIGN.FileName);
                    sign_path = Path.Combine(folderPath, sign_name);

                    // save the file to the server...
                    using (var fileStream = new FileStream(sign_path, FileMode.Create))
                    {
                        await activeDelivery.DLVDIMGFILESIGN.CopyToAsync(fileStream);
                    }
                }
                catch (Exception ex)
                {
                    System.Diagnostics.Debug.WriteLine($"Error saving delivery signature file: {ex.Message}");
                }
            }
            // omit saving, point back to image already on file...
            else
            {
                sign_name = activeDelivery.signature_string;
            }

            try
            {
                string query = "update dbo.DMFSTDAT set MFSTKEY = @MFSTKEY,STATUS = @STATUS,LASTUPDATE = @LASTUPDATE,MFSTNUMBER = @MFSTNUMBER," +
                    "POWERUNIT = @POWERUNIT,STOP = @STOP,MFSTDATE = @MFSTDATE,PRONUMBER = @PRONUMBER,PRODATE = @PRODATE,SHIPNAME = @SHIPNAME," +
                    "CONSNAME = @CONSNAME,CONSADD1 = @CONSADD1,CONSADD2 = @CONSADD2,CONSCITY = @CONSCITY,CONSSTATE = @CONSSTATE,CONSZIP = @CONSZIP," +
                    "TTLPCS = @TTLPCS,TTLYDS = @TTLYDS,TTLWGT = @TTLWGT,DLVDDATE = @DLVDDATE,DLVDTIME = @DLVDTIME,DLVDPCS = @DLVDPCS,DLVDSIGN = @DLVDSIGN," +
                    "DLVDNOTE = @DLVDNOTE,DLVDIMGFILELOCN = @DLVDIMGFILELOCN,DLVDIMGFILESIGN = @DLVDIMGFILESIGN where MFSTKEY=@MFSTKEY";

                DataTable table = new DataTable();
                string sqlDatasource = _configuration.GetConnectionString(company);
                SqlDataReader myReader;

                await using (SqlConnection myCon = new SqlConnection(sqlDatasource))
                {
                    myCon.Open();

                    foreach (var delivery in data)
                    {
                        using (SqlCommand myCommand = new SqlCommand(query, myCon))
                        {
                            myCommand.Parameters.AddWithValue("@MFSTKEY", delivery.MFSTKEY);
                            myCommand.Parameters.AddWithValue("@STATUS", delivery.STATUS);
                            myCommand.Parameters.AddWithValue("@LASTUPDATE", delivery.LASTUPDATE);
                            myCommand.Parameters.AddWithValue("@MFSTNUMBER", delivery.MFSTNUMBER);
                            myCommand.Parameters.AddWithValue("@POWERUNIT", delivery.POWERUNIT);
                            myCommand.Parameters.AddWithValue("@STOP", delivery.STOP);
                            myCommand.Parameters.AddWithValue("@MFSTDATE", delivery.MFSTDATE);
                            myCommand.Parameters.AddWithValue("@PRONUMBER", delivery.PRONUMBER);
                            myCommand.Parameters.AddWithValue("@PRODATE", delivery.PRODATE);
                            myCommand.Parameters.AddWithValue("@SHIPNAME", delivery.SHIPNAME);
                            myCommand.Parameters.AddWithValue("@CONSNAME", delivery.CONSNAME);
                            myCommand.Parameters.AddWithValue("@CONSADD1", delivery.CONSADD1);
                            myCommand.Parameters.AddWithValue("@CONSADD2", delivery.CONSADD2 == null || delivery.CONSADD2 == "null" ? DBNull.Value : delivery.CONSADD2);
                            myCommand.Parameters.AddWithValue("@CONSCITY", delivery.CONSCITY);
                            myCommand.Parameters.AddWithValue("@CONSSTATE", delivery.CONSSTATE);
                            myCommand.Parameters.AddWithValue("@CONSZIP", delivery.CONSZIP);
                            myCommand.Parameters.AddWithValue("@TTLPCS", delivery.TTLPCS);
                            myCommand.Parameters.AddWithValue("@TTLYDS", delivery.TTLYDS);
                            myCommand.Parameters.AddWithValue("@TTLWGT", delivery.TTLWGT);
                            myCommand.Parameters.AddWithValue("@DLVDDATE", delivery.DLVDDATE == null || delivery.DLVDDATE == "null" ? DBNull.Value : delivery.DLVDDATE);
                            myCommand.Parameters.AddWithValue("@DLVDTIME", delivery.DLVDTIME == null || delivery.DLVDTIME == "null" ? DBNull.Value : delivery.DLVDTIME);
                            myCommand.Parameters.AddWithValue("@DLVDPCS", delivery.DLVDPCS == null || delivery.DLVDPCS == -1 ? DBNull.Value : delivery.DLVDPCS);
                            myCommand.Parameters.AddWithValue("@DLVDSIGN", delivery.DLVDSIGN == null || delivery.DLVDSIGN == "null" ? DBNull.Value : delivery.DLVDSIGN);
                            myCommand.Parameters.AddWithValue("@DLVDNOTE", delivery.DLVDNOTE == null || delivery.DLVDNOTE == "null" ? DBNull.Value : delivery.DLVDNOTE);
                            myCommand.Parameters.AddWithValue("@DLVDIMGFILELOCN", loc_name == null || loc_name == "null" ? DBNull.Value : loc_name);
                            myCommand.Parameters.AddWithValue("@DLVDIMGFILESIGN", sign_name == null || sign_name == "null" ? DBNull.Value : sign_name);

                            myReader = myCommand.ExecuteReader();
                            table.Load(myReader);
                            myReader.Close();
                        }
                        // add key to list to send a confirmed list back...
                    }

                    myCon.Close();
                }
                return new JsonResult(new { success = true, message = "Updated deliveries." });
            }
            catch (Exception ex)
            {
                return new JsonResult(new { success = false, error = "Error updating delivery: " + ex.Message });
            }
        }

        /* 
         * 
         * PHASE THESE OUT OF DEVELOPMENT 
         *
         */

        [HttpGet]
        [Route("GetUndelivered")]
        public JsonResult GetUndelivered(string POWERUNIT, string MFSTDATE)
        {
            var tokenService = new TokenService(_configuration);
            (bool success, string message) tokenAuth = tokenService.AuthorizeRequest(HttpContext);
            if (!tokenAuth.success)
            {
                return new JsonResult(new { success = false, message = tokenAuth.message }) { StatusCode = StatusCodes.Status401Unauthorized };
            }

            var company = Request.Cookies["company"];
            if (string.IsNullOrEmpty(company))
            {
                return new JsonResult(new { success = false, message = "Company key is missing." }) { StatusCode = StatusCodes.Status401Unauthorized };
            }

            string query = "select * from dbo.DMFSTDAT where POWERUNIT=@POWERUNIT and MFSTDATE=@MFSTDATE and STATUS=0 order by STOP";
            DataTable table = new DataTable();
            string sqlDatasource = _configuration.GetConnectionString(company);
            SqlDataReader myReader;

            try
            {
                using (SqlConnection myCon = new SqlConnection(sqlDatasource))
                {
                    myCon.Open();
                    using (SqlCommand myCommand = new SqlCommand(query, myCon))
                    {
                        myCommand.Parameters.AddWithValue("@POWERUNIT", POWERUNIT);
                        myCommand.Parameters.AddWithValue("@MFSTDATE", MFSTDATE);
                        myReader = myCommand.ExecuteReader();
                        table.Load(myReader);
                        myReader.Close();
                        myCon.Close();
                    }
                }
                if (table.Rows.Count > 0)
                {
                    return new JsonResult(new { success = true, table = table });
                }
                else
                {
                    return new JsonResult(new { success = false, error = "Error: Empty table results" });
                }
            }
            catch (Exception ex)
            {
                return new JsonResult(new { success = false, error = "Error: " + ex.Message });
            }
        }
        [HttpGet]
        [Route("GetDelivered")]
        public JsonResult GetDelivered(string POWERUNIT, string MFSTDATE)
        {
            var tokenService = new TokenService(_configuration);
            (bool success, string message) tokenAuth = tokenService.AuthorizeRequest(HttpContext);
            if (!tokenAuth.success)
            {
                return new JsonResult(new { success = false, message = tokenAuth.message }) { StatusCode = StatusCodes.Status401Unauthorized };
            }

            var company = Request.Cookies["company"];
            if (string.IsNullOrEmpty(company))
            {
                return new JsonResult(new { success = false, message = "Company key is missing." }) { StatusCode = StatusCodes.Status401Unauthorized };
            }

            string query = "select * from dbo.DMFSTDAT where POWERUNIT=@POWERUNIT and MFSTDATE=@MFSTDATE and STATUS=1 order by STOP";
            DataTable table = new DataTable();
            string sqlDatasource = _configuration.GetConnectionString(company);
            SqlDataReader myReader;

            try
            {
                using (SqlConnection myCon = new SqlConnection(sqlDatasource))
                {
                    myCon.Open();
                    using (SqlCommand myCommand = new SqlCommand(query, myCon))
                    {
                        myCommand.Parameters.AddWithValue("@POWERUNIT", POWERUNIT);
                        myCommand.Parameters.AddWithValue("@MFSTDATE", MFSTDATE);
                        myReader = myCommand.ExecuteReader();
                        table.Load(myReader);
                        myReader.Close();
                        myCon.Close();
                    }
                }
                if (table.Rows.Count > 0)
                {
                    return new JsonResult(new { success = true, table = table });
                }
                else
                {
                    return new JsonResult(new { success = true, table = table });
                }
            }
            catch (Exception ex)
            {
                return new JsonResult(new { success = false, error = "Error: " + ex.Message });
            }
        }
    }
}

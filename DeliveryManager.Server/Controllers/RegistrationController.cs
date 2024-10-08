﻿using DeliveryManager.Server.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Data;
using System.Data.SqlClient;

namespace DeliveryManager.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RegistrationController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly string connString;

        public RegistrationController(IConfiguration configuration)
        {
            _configuration = configuration;
            connString = _configuration.GetConnectionString("DriverChecklistTestCon");
        }


        [HttpPost]
        [Route("Login")]

        public JsonResult Login(string USERNAME, string PASSWORD)
        {
            string query = "select * from dbo.USERS where USERNAME=@USERNAME and PASSWORD=@PASSWORD";
            DataTable table = new DataTable();
            //string sqlDatasource = _configuration.GetConnectionString("DriverChecklistDBCon");
            string sqlDatasource = connString;
            SqlDataReader myReader;
            using (SqlConnection myCon = new SqlConnection(sqlDatasource))
            {
                myCon.Open();
                using (SqlCommand myCommand = new SqlCommand(query, myCon))
                {
                    myCommand.Parameters.AddWithValue("@USERNAME", USERNAME);
                    myCommand.Parameters.AddWithValue("@PASSWORD", PASSWORD);
                    //myCommand.ExecuteNonQuery();

                    myReader = myCommand.ExecuteReader();
                    table.Load(myReader);
                    myReader.Close();
                    myCon.Close();
                }
            }
            if (table.Rows.Count > 0)
            {
                return new JsonResult("Valid Login.");
            }
            else
            {
                return new JsonResult("Invalid Login.");
            }

        }

        [HttpGet]
        [Route("GetDriver")]

        public JsonResult GetDriver(string USERNAME)
        {
            string query = "select POWERUNIT from dbo.USERS where USERNAME=@USERNAME";
            DataTable table = new DataTable();
            //string sqlDatasource = _configuration.GetConnectionString("DriverChecklistDBCon");
            string sqlDatasource = connString;
            SqlDataReader myReader;
            using (SqlConnection myCon = new SqlConnection(sqlDatasource))
            {
                myCon.Open();
                using (SqlCommand myCommand = new SqlCommand(query, myCon))
                {
                    myCommand.Parameters.AddWithValue("@USERNAME", USERNAME);;
                    myReader = myCommand.ExecuteReader();
                    table.Load(myReader);
                    myReader.Close();
                    myCon.Close();
                }
            }

            return new JsonResult(table);
        }

        [HttpPut]
        [Route("ChangePowerunit")]

        public JsonResult ChangePowerunit(string USERNAME, string PASSWORD, string POWERUNIT)
        {
            string query = "update dbo.USERS set POWERUNIT=@POWERUNIT where USERNAME=@USERNAME and PASSWORD=@PASSWORD";
            DataTable table = new DataTable();
            //string sqlDatasource = _configuration.GetConnectionString("DriverChecklistDBCon");
            string sqlDatasource = connString;
            SqlDataReader myReader;
            using (SqlConnection myCon = new SqlConnection(sqlDatasource))
            {
                myCon.Open();
                using (SqlCommand myCommand = new SqlCommand(query, myCon))
                {
                    myCommand.Parameters.AddWithValue("@USERNAME", USERNAME);
                    myCommand.Parameters.AddWithValue("@PASSWORD", PASSWORD); ;
                    myCommand.Parameters.AddWithValue("@POWERUNIT", POWERUNIT);
                    //myCommand.ExecuteNonQuery();

                    myReader = myCommand.ExecuteReader();
                    table.Load(myReader);
                    myReader.Close();
                    myCon.Close();
                }
            }
            return new JsonResult("Driver Updated.");
        }

        [HttpDelete]
        [Route("DeleteDriver")]

        public JsonResult DeleteDriver(string POWERUNIT)
        {
            string query = "delete from dbo.USERS where POWERUNIT=@POWERUNIT";
            DataTable table = new DataTable();
            //string sqlDatasource = _configuration.GetConnectionString("DriverChecklistDBCon");
            string sqlDatasource = connString;
            SqlDataReader myReader;
            using (SqlConnection myCon = new SqlConnection(sqlDatasource))
            {
                myCon.Open();
                using (SqlCommand myCommand = new SqlCommand(query, myCon))
                {
                    myCommand.Parameters.AddWithValue("@POWERUNIT", POWERUNIT);
                    myReader = myCommand.ExecuteReader();
                    table.Load(myReader);
                    myReader.Close();
                    myCon.Close();
                }
            }

            return new JsonResult("Deleted Successfully");
        }

        [HttpPost]
        [Route("AddPowerunit")]

        public JsonResult AddPowerunit(string USERNAME, string PASSWORD, string POWERUNIT)
        {
            string query = "insert into dbo.USERS(USERNAME,PASSWORD,POWERUNIT) values(@USERNAME,@PASSWORD,@POWERUNIT)";
            DataTable table = new DataTable();
            //string sqlDatasource = _configuration.GetConnectionString("DriverChecklistDBCon");
            string sqlDatasource = connString;
            SqlDataReader myReader;
            using (SqlConnection myCon = new SqlConnection(sqlDatasource))
            {
                myCon.Open();
                using (SqlCommand myCommand = new SqlCommand(query, myCon))
                {
                    myCommand.Parameters.AddWithValue("@USERNAME", USERNAME);
                    myCommand.Parameters.AddWithValue("@PASSWORD", PASSWORD);
                    myCommand.Parameters.AddWithValue("@POWERUNIT", POWERUNIT);
                    //myCommand.ExecuteNonQuery();

                    myReader = myCommand.ExecuteReader();
                    table.Load(myReader);
                    myReader.Close();
                    myCon.Close();
                }
            }
            return new JsonResult("Added Successfully");
        }

        [HttpPut]
        [Route("UpdateDriver")]

        public JsonResult UpdateDriver(string USERNAME, string PASSWORD, string POWERUNIT) 
        {
            string query = "update dbo.USERS set USERNAME = @USERNAME, PASSWORD = @PASSWORD, POWERUNIT = @POWERUNIT where USERNAME = @USERNAME";
            DataTable table = new DataTable();
            //string sqlDatasource = _configuration.GetConnectionString("DriverChecklistDBCon");
            string sqlDatasource = connString;
            SqlDataReader myReader;
            using (SqlConnection myCon = new SqlConnection(sqlDatasource))
            { 
                myCon.Open();
                using (SqlCommand myCommand = new SqlCommand(query, myCon)) 
                {
                    myCommand.Parameters.AddWithValue("@USERNAME", USERNAME);
                    myCommand.Parameters.AddWithValue("@PASSWORD", PASSWORD);
                    myCommand.Parameters.AddWithValue("@POWERUNIT", POWERUNIT);

                    myReader = myCommand.ExecuteReader();
                    table.Load(myReader);
                    myReader.Close();
                    myCon.Close();
                }
            }
            return new JsonResult("Updated Successfully");
        }

        [HttpPost]
        [Route("VerifyPowerunit")]

        public JsonResult VerifyPowerunit(string MFSTDATE, string POWERUNIT)
        {
            string query = "select * from dbo.DMFSTDAT where MFSTDATE=@MFSTDATE and POWERUNIT=@POWERUNIT";
            DataTable table = new DataTable();
            //string sqlDatasource = _configuration.GetConnectionString("DriverChecklistDBCon");
            string sqlDatasource = connString;
            SqlDataReader myReader;
            using (SqlConnection myCon = new SqlConnection(sqlDatasource))
            {
                myCon.Open();
                using (SqlCommand myCommand = new SqlCommand(query, myCon))
                {
                    myCommand.Parameters.AddWithValue("@MFSTDATE", MFSTDATE);
                    myCommand.Parameters.AddWithValue("@POWERUNIT", POWERUNIT);
                    //myCommand.ExecuteNonQuery();

                    myReader = myCommand.ExecuteReader();
                    table.Load(myReader);
                    myReader.Close();
                    myCon.Close();
                }
            }
            if (table.Rows.Count > 0)
            {
                return new JsonResult("Valid");
            }
            else
            {
                return new JsonResult("Invalid");
            }

        }
    }
}

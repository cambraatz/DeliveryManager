using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Data;
using System.Data.SqlClient;

namespace DeliveryManager.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DriverChecklistController : ControllerBase
    {
        private IConfiguration _configuration;

        public DriverChecklistController(IConfiguration configuration)
        {
            _configuration = configuration;
        }
        /*
        [HttpGet]
        [Route("GetManifest")]

        public JsonResult GetManifest()
        {
            string query = "select * from dbo.DMFSTDAT";
            DataTable table = new DataTable();
            string sqlDatasource = _configuration.GetConnectionString("DriverChecklistDBCon");
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

            return new JsonResult(table);
        }
        */
        [HttpGet]
        [Route("GetDriverLog")]

        public JsonResult GetDriverLog(string POWERUNIT)
        {
            string query = "select * from dbo.DMFSTDAT where POWERUNIT=@POWERUNIT order by STOP";
            DataTable table = new DataTable();
            string sqlDatasource = _configuration.GetConnectionString("DriverChecklistDBCon");
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

            return new JsonResult(table);
        }

        [HttpGet]
        [Route("GetUndelivered")]

        public JsonResult GetUndelivered(string POWERUNIT, string MFSTDATE)
        {
            string query = "select * from dbo.DMFSTDAT where POWERUNIT=@POWERUNIT and MFSTDATE=@MFSTDATE and STATUS=0 order by STOP";
            DataTable table = new DataTable();
            string sqlDatasource = _configuration.GetConnectionString("DriverChecklistDBCon");
            SqlDataReader myReader;
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
                return new JsonResult(table);
            }
            else
            {
                return new JsonResult("Invalid Delivery.");
            }
        }

        [HttpGet]
        [Route("GetDelivered")]

        public JsonResult GetDelivered(string POWERUNIT, string MFSTDATE)
        {
            string query = "select * from dbo.DMFSTDAT where POWERUNIT=@POWERUNIT and MFSTDATE=@MFSTDATE and STATUS=1 order by STOP";
            DataTable table = new DataTable();
            string sqlDatasource = _configuration.GetConnectionString("DriverChecklistDBCon");
            SqlDataReader myReader;
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
                return new JsonResult(table);
            }
            else
            {
                return new JsonResult(table);
                //return new JsonResult("No Deliveries On Record.");
            }
        }
        /*
        [HttpGet]
        [Route("GetDelivery")]

        public JsonResult GetDelivery(string MFSTKEY)
        {
            string query = "select * from dbo.DMFSTDAT where MFSTKEY=@MFSTKEY";
            DataTable table = new DataTable();
            string sqlDatasource = _configuration.GetConnectionString("DriverChecklistDBCon");
            SqlDataReader myReader;
            using (SqlConnection myCon = new SqlConnection(sqlDatasource))
            {
                myCon.Open();
                using (SqlCommand myCommand = new SqlCommand(query, myCon))
                {
                    myCommand.Parameters.AddWithValue("@MFSTKEY", MFSTKEY);
                    myReader = myCommand.ExecuteReader();
                    table.Load(myReader);
                    myReader.Close();
                    myCon.Close();
                }
            }

            return new JsonResult(table);
        }
        */
        /*
        [HttpPut]
        [Route("UpdateDelivery")]

        public JsonResult UpdateDelivery([FromForm] string DLVDDATE, [FromForm] string DLVTIME, [FromForm] int DLVDPCS, 
                                         [FromForm] string DLVDNOTE, [FromForm] string DLVDIMGFILELOCN, 
                                         [FromForm] string DLVDIMGFILESIGN, string MFSTKEY)
        {
            string query = "update dbo.DMFSTDAT set DLVDDATE=@DLVDDATE,DLVTIME=@DLVTIME,DLVDPCS=@DLVDPCS," +
                            "DLVDNOTE=@DLVDNOTE,DLVDIMGFILELOCN=@DLVDIMGFILELOCN,DLVDIMGFILESIGN=@DLVDIMGFILESIGN " +
                            "where MFSTKEY=@MFSTKEY";

            DataTable table = new DataTable();
            string sqlDatasource = _configuration.GetConnectionString("DriverChecklistDBCon");
            SqlDataReader myReader;
            using (SqlConnection myCon = new SqlConnection(sqlDatasource))
            {
                myCon.Open();
                using (SqlCommand myCommand = new SqlCommand(query, myCon))
                {
                    myCommand.Parameters.AddWithValue("@DLVDDATE", DLVDDATE);
                    myCommand.Parameters.AddWithValue("@DLVTIME", DLVTIME);
                    myCommand.Parameters.AddWithValue("@DLVDPCS", DLVDPCS);
                    myCommand.Parameters.AddWithValue("@DLVDNOTE", DLVDNOTE);
                    myCommand.Parameters.AddWithValue("@DLVDIMGFILELOCN", DLVDIMGFILELOCN);
                    myCommand.Parameters.AddWithValue("@DLVDIMGFILESIGN", DLVDIMGFILESIGN);
                    myCommand.Parameters.AddWithValue("@MFSTKEY", MFSTKEY);
                    myReader = myCommand.ExecuteReader();
                    table.Load(myReader);
                    myReader.Close();
                    myCon.Close();
                }
            }

            return new JsonResult("Updated Successfully");
        }
        */

        [HttpPost]
        [Route("AddManifest")]

        public JsonResult AddManifest(string MFSTKEY, string STATUS, string LASTUPDATE, string MFSTNUMBER,
            string POWERUNIT, int STOP, string MFSTDATE, string PRONUMBER, string PRODATE,
            string SHIPNAME, string CONSNAME, string CONSADD1, string CONSADD2, string CONSCITY,
            string CONSSTATE, string CONSZIP, int TTLPCS, int TTLYDS, int TTLWGT, string DLVDDATE,
            string DLVDTIME, int DLVDPCS, string DLVDSIGN, string DLVDNOTE, string DLVDIMGFILELOCN, string DLVDIMGFILESIGN)
        {
            string query = "insert into dbo.DMFSTDAT(MFSTKEY,STATUS,LASTUPDATE,MFSTNUMBER,POWERUNIT,STOP,MFSTDATE,PRONUMBER,PRODATE,SHIPNAME,CONSNAME,CONSADD1," +
                "CONSADD2,CONSCITY,CONSSTATE,CONSZIP,TTLPCS,TTLYDS,TTLWGT,DLVDDATE,DLVDTIME,DLVDPCS,DLVDSIGN,DLVDNOTE,DLVDIMGFILELOCN,DLVDIMGFILESIGN) values(@MFSTKEY," +
                "@STATUS,@LASTUPDATE,@MFSTNUMBER,@POWERUNIT,@STOP,@MFSTDATE,@PRONUMBER,@PRODATE,@SHIPNAME,@CONSNAME,@CONSADD1,@CONSADD2,@CONSCITY,@CONSSTATE," +
                "@CONSZIP,@TTLPCS,@TTLYDS,@TTLWGT,@DLVDDATE,@DLVDTIME,@DLVDPCS,@DLVDSIGN,@DLVDNOTE,@DLVDIMGFILELOCN,@DLVDIMGFILESIGN)";

            DataTable table = new DataTable();
            string sqlDatasource = _configuration.GetConnectionString("DriverChecklistDBCon");
            SqlDataReader myReader;
            using (SqlConnection myCon = new SqlConnection(sqlDatasource))
            {
                myCon.Open();
                using (SqlCommand myCommand = new SqlCommand(query, myCon))
                {
                    myCommand.Parameters.AddWithValue("@MFSTKEY", MFSTKEY);
                    myCommand.Parameters.AddWithValue("@STATUS", STATUS);
                    myCommand.Parameters.AddWithValue("@LASTUPDATE", LASTUPDATE);
                    myCommand.Parameters.AddWithValue("@MFSTNUMBER", MFSTNUMBER);
                    myCommand.Parameters.AddWithValue("@POWERUNIT", POWERUNIT);
                    myCommand.Parameters.AddWithValue("@STOP", STOP);
                    myCommand.Parameters.AddWithValue("@MFSTDATE", MFSTDATE);
                    myCommand.Parameters.AddWithValue("@PRONUMBER", PRONUMBER);
                    myCommand.Parameters.AddWithValue("@PRODATE", PRODATE);
                    myCommand.Parameters.AddWithValue("@SHIPNAME", SHIPNAME);
                    myCommand.Parameters.AddWithValue("@CONSNAME", CONSNAME);
                    myCommand.Parameters.AddWithValue("@CONSADD1", CONSADD1);
                    myCommand.Parameters.AddWithValue("@CONSADD2", CONSADD2);
                    myCommand.Parameters.AddWithValue("@CONSCITY", CONSCITY);
                    myCommand.Parameters.AddWithValue("@CONSSTATE", CONSSTATE);
                    myCommand.Parameters.AddWithValue("@CONSZIP", CONSZIP);
                    myCommand.Parameters.AddWithValue("@TTLPCS", TTLPCS);
                    myCommand.Parameters.AddWithValue("@TTLYDS", TTLYDS);
                    myCommand.Parameters.AddWithValue("@TTLWGT", TTLWGT);
                    myCommand.Parameters.AddWithValue("@DLVDDATE", DLVDDATE);
                    myCommand.Parameters.AddWithValue("@DLVDTIME", DLVDTIME);
                    myCommand.Parameters.AddWithValue("@DLVDPCS", DLVDPCS);
                    myCommand.Parameters.AddWithValue("@DLVDSIGN", DLVDSIGN);
                    myCommand.Parameters.AddWithValue("@DLVDNOTE", DLVDNOTE);
                    myCommand.Parameters.AddWithValue("@DLVDIMGFILELOCN", DLVDIMGFILELOCN);
                    myCommand.Parameters.AddWithValue("@DLVDIMGFILESIGN", DLVDIMGFILESIGN);

                    myReader = myCommand.ExecuteReader();
                    table.Load(myReader);
                    myReader.Close();
                    myCon.Close();
                }
            }

            return new JsonResult("Added Successfully");
        }

        /*
        [HttpPost]
        [Route("AddManifest")]

        public JsonResult AddManifest([FromForm] string MFSTKEY, [FromForm] string STATUS, [FromForm] string LASTUPDATE, [FromForm] string MFSTNUMBER,
            [FromForm] string POWERUNIT, [FromForm] int STOP, [FromForm] string MFSTDATE, [FromForm] string PRONUMBER, [FromForm] string PRODATE,
            [FromForm] string SHIPNAME, [FromForm] string CONSNAME, [FromForm] string CONSADD1, [FromForm] string CONSADD2, [FromForm] string CONSCITY,
            [FromForm] string CONSSTATE, [FromForm] string CONSZIP, [FromForm] int TTLPCS, [FromForm] int TTLYDS, [FromForm] int TTLWGT, [FromForm] string DLVDDATE,
            [FromForm] string DLVTIME, [FromForm] int DLVDPCS, [FromForm] string DLVDNOTE, [FromForm] string DLVDIMGFILELOCN, [FromForm] string DLVDIMGFILESIGN)
        {
            string query = "insert into dbo.DMFSTDAT(MFSTKEY,STATUS,LASTUPDATE,MFSTNUMBER,POWERUNIT,STOP,MFSTDATE,PRONUMBER,PRODATE,SHIPNAME,CONSNAME,CONSADD1," +
                "CONSADD2,CONSCITY,CONSSTATE,CONSZIP,TTLPCS,TTLYDS,TTLWGT,DLVDDATE,DLVTIME,DLVDPCS,DLVDNOTE,DLVDIMGFILELOCN,DLVDIMGFILESIGN) values(@MFSTKEY," +
                "@STATUS,@LASTUPDATE,@MFSTNUMBER,@POWERUNIT,@STOP,@MFSTDATE,@PRONUMBER,@PRODATE,@SHIPNAME,@CONSNAME,@CONSADD1,@CONSADD2,@CONSCITY,@CONSSTATE," +
                "@CONSZIP,@TTLPCS,@TTLYDS,@TTLWGT,@DLVDDATE,@DLVTIME,@DLVDPCS,@DLVDNOTE,@DLVDIMGFILELOCN,@DLVDIMGFILESIGN)";

            DataTable table = new DataTable();
            string sqlDatasource = _configuration.GetConnectionString("DriverChecklistDBCon");
            SqlDataReader myReader;
            using (SqlConnection myCon = new SqlConnection(sqlDatasource))
            {
                myCon.Open();
                using (SqlCommand myCommand = new SqlCommand(query, myCon))
                {
                    myCommand.Parameters.AddWithValue("@MFSTKEY", MFSTKEY);
                    myCommand.Parameters.AddWithValue("@STATUS", STATUS);
                    myCommand.Parameters.AddWithValue("@LASTUPDATE", LASTUPDATE);
                    myCommand.Parameters.AddWithValue("@MFSTNUMBER", MFSTNUMBER);
                    myCommand.Parameters.AddWithValue("@POWERUNIT", POWERUNIT);
                    myCommand.Parameters.AddWithValue("@STOP", STOP);
                    myCommand.Parameters.AddWithValue("@MFSTDATE", MFSTDATE);
                    myCommand.Parameters.AddWithValue("@PRONUMBER", PRONUMBER);
                    myCommand.Parameters.AddWithValue("@PRODATE", PRODATE);
                    myCommand.Parameters.AddWithValue("@SHIPNAME", SHIPNAME);
                    myCommand.Parameters.AddWithValue("@CONSNAME", CONSNAME);
                    myCommand.Parameters.AddWithValue("@CONSADD1", CONSADD1);
                    myCommand.Parameters.AddWithValue("@CONSADD2", CONSADD2);
                    myCommand.Parameters.AddWithValue("@CONSCITY", CONSCITY);
                    myCommand.Parameters.AddWithValue("@CONSSTATE", CONSSTATE);
                    myCommand.Parameters.AddWithValue("@CONSZIP", CONSZIP);
                    myCommand.Parameters.AddWithValue("@TTLPCS", TTLPCS);
                    myCommand.Parameters.AddWithValue("@TTLYDS", TTLYDS);
                    myCommand.Parameters.AddWithValue("@TTLWGT", TTLWGT);
                    myCommand.Parameters.AddWithValue("@DLVDDATE", DLVDDATE);
                    myCommand.Parameters.AddWithValue("@DLVTIME", DLVTIME);
                    myCommand.Parameters.AddWithValue("@DLVDPCS", DLVDPCS);
                    myCommand.Parameters.AddWithValue("@DLVDNOTE", DLVDNOTE);
                    myCommand.Parameters.AddWithValue("@DLVDIMGFILELOCN", DLVDIMGFILELOCN);
                    myCommand.Parameters.AddWithValue("@DLVDIMGFILESIGN", DLVDIMGFILESIGN);

                    myReader = myCommand.ExecuteReader();
                    table.Load(myReader);
                    myReader.Close();
                    myCon.Close();
                }
            }

            return new JsonResult("Added Successfully");
        }
        */

        [HttpDelete]
        [Route("DeleteManifest")]

        public JsonResult DeleteManifest(string MFSTKEY)
        {
            string query = "delete from dbo.DMFSTDAT where MFSTKEY=@MFSTKEY";
            DataTable table = new DataTable();
            string sqlDatasource = _configuration.GetConnectionString("DriverChecklistDBCon");
            SqlDataReader myReader;
            using (SqlConnection myCon = new SqlConnection(sqlDatasource))
            {
                myCon.Open();
                using (SqlCommand myCommand = new SqlCommand(query, myCon))
                {
                    myCommand.Parameters.AddWithValue("@MFSTKEY", MFSTKEY);
                    myReader = myCommand.ExecuteReader();
                    table.Load(myReader);
                    myReader.Close();
                    myCon.Close();
                }
            }

            return new JsonResult("Deleted Successfully");
        }
    }
}

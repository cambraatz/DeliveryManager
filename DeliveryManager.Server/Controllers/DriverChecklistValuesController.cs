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
        private readonly string connString;

        public DriverChecklistController(IConfiguration configuration)
        {
            _configuration = configuration;
            //connString = _configuration.GetConnectionString("DriverChecklistTestCon");
            connString = _configuration.GetConnectionString("DriverChecklistDBCon");
        }
        [HttpGet]
        [Route("GetDriverLog")]

        public JsonResult GetDriverLog(string POWERUNIT)
        {
            string query = "select * from dbo.DMFSTDAT where POWERUNIT=@POWERUNIT order by STOP";
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

            return new JsonResult(table);
        }

        [HttpGet]
        [Route("GetUndelivered")]

        public JsonResult GetUndelivered(string POWERUNIT, string MFSTDATE)
        {
            string query = "select * from dbo.DMFSTDAT where POWERUNIT=@POWERUNIT and MFSTDATE=@MFSTDATE and STATUS=0 order by STOP";
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
            //string sqlDatasource = _configuration.GetConnectionString("DriverChecklistDBCon");
            string sqlDatasource = connString;
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
            //string sqlDatasource = _configuration.GetConnectionString("DriverChecklistDBCon");
            string sqlDatasource = connString;
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

        [HttpDelete]
        [Route("DeleteManifest")]

        public JsonResult DeleteManifest(string MFSTKEY)
        {
            string query = "delete from dbo.DMFSTDAT where MFSTKEY=@MFSTKEY";
            DataTable table = new DataTable();
            //string sqlDatasource = _configuration.GetConnectionString("DriverChecklistDBCon");
            string sqlDatasource = connString;
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

        [HttpPut]
        [Route("UpdateManifest")]

        public JsonResult UpdateManifest(string MFSTKEY, string STATUS, string LASTUPDATE, string MFSTNUMBER,
            string POWERUNIT, int STOP, string MFSTDATE, string PRONUMBER, string PRODATE,
            string SHIPNAME, string CONSNAME, string CONSADD1, string CONSADD2, string CONSCITY,
            string CONSSTATE, string CONSZIP, int TTLPCS, int TTLYDS, int TTLWGT, string DLVDDATE,
            string DLVDTIME, int DLVDPCS, string DLVDSIGN, string DLVDNOTE, string DLVDIMGFILELOCN, string DLVDIMGFILESIGN)
        {
            string query = "update dbo.DMFSTDAT set MFSTKEY = @MFSTKEY,STATUS = @STATUS,LASTUPDATE = @LASTUPDATE,MFSTNUMBER = @MFSTNUMBER," +
                "POWERUNIT = @POWERUNIT,STOP = @STOP,MFSTDATE = @MFSTDATE,PRONUMBER = @PRONUMBER,PRODATE = @PRODATE,SHIPNAME = @SHIPNAME," +
                "CONSNAME = @CONSNAME,CONSADD1 = @CONSADD1,CONSADD2 = @CONSADD2,CONSCITY = @CONSCITY,CONSSTATE = @CONSSTATE,CONSZIP = @CONSZIP," +
                "TTLPCS = @TTLPCS,TTLYDS = @TTLYDS,TTLWGT = @TTLWGT,DLVDDATE = @DLVDDATE,DLVDTIME = @DLVDTIME,DLVDPCS = @DLVDPCS,DLVDSIGN = @DLVDSIGN," +
                "DLVDNOTE = @DLVDNOTE,DLVDIMGFILELOCN = @DLVDIMGFILELOCN,DLVDIMGFILESIGN = @DLVDIMGFILESIGN where MFSTKEY=@MFSTKEY";

            DataTable table = new DataTable();
            //string sqlDatasource = _configuration.GetConnectionString("DriverChecklistDBCon");
            string sqlDatasource = connString;
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

            return new JsonResult("Updated Successfully");
        }
    }
}

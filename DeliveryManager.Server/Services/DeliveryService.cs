using Microsoft.Extensions.Logging;
using System.Data;
using System.Data.SqlClient;
using System.Threading.Tasks;
using DeliveryManager.Server.Services.Interfaces;
using DeliveryManager.Server.Models;

namespace DeliveryManager.Server.Services
{
    public class DeliveryService : IDeliveryService
    {
        private readonly IConfiguration _config;
        private readonly ILogger<DeliveryService> _logger;

        public DeliveryService(IConfiguration config, ILogger<DeliveryService> logger)
        {
            _config = config;
            _logger = logger;
        }

        public async Task<DeliveryManifest?> GetDeliveryManifestAsync(string companyConn, string powerunit, string manifestDate)
        {
            //string connString = _config.GetConnectionString(companyConn);
            string query = "select * from dbo.DMFSTDAT where MFSTDATE=@MFSTDATE and POWERUNIT=@POWERUNIT";
            var table = new DataTable();

            try
            {
                await using var conn = new SqlConnection(companyConn);
                await conn.OpenAsync();
                await using var comm = new SqlCommand(query, conn);

                comm.Parameters.AddWithValue("@MFSTDATE", manifestDate);
                comm.Parameters.AddWithValue("@POWERUNIT", powerunit);

                await using var reader = await comm.ExecuteReaderAsync();
                table.Load(reader);

                if (table.Rows.Count > 0)
                {
                    DataRow row = table.Rows[0];
                    return new DeliveryManifest
                    {
                        MFSTKEY = row.Field<string>("MFSTKEY") ?? string.Empty,
                        STATUS = row.Field<string>("STATUS") ?? string.Empty,
                        LASTUPDATE = row.Field<string>("LASTUPDATE") ?? string.Empty,
                        MFSTNUMBER = row.Field<string>("MFSTNUMBER") ?? string.Empty,
                        POWERUNIT = row.Field<string>("POWERUNIT") ?? string.Empty,
                        STOP = row.Field<short>("STOP"),
                        MFSTDATE = row.Field<string>("MFSTDATE") ?? string.Empty,
                        PRONUMBER = row.Field<string>("PRONUMBER") ?? string.Empty,
                        PRODATE = row.Field<string>("PRODATE") ?? string.Empty,
                        SHIPNAME = row.Field<string>("SHIPNAME") ?? string.Empty,
                        CONSNAME = row.Field<string>("CONSNAME") ?? string.Empty,
                        CONSADD1 = row.Field<string>("CONSADD1") ?? string.Empty,
                        CONSADD2 = row.Field<string>("CONSADD2") ?? string.Empty,
                        CONSCITY = row.Field<string>("CONSCITY") ?? string.Empty,
                        CONSSTATE = row.Field<string>("CONSSTATE") ?? string.Empty,
                        CONSZIP = row.Field<string>("CONSZIP") ?? string.Empty,
                        TTLPCS = row.Field<short?>("TTLPCS") ?? 0,
                        TTLYDS = row.Field<short?>("TTLYDS") ?? 0,
                        TTLWGT = row.Field<short?>("TTLWGT") ?? 0,
                        DLVDDATE = row.Field<string>("DLVDDATE") ?? string.Empty,
                        DLVDTIME = row.Field<string>("DLVDTIME") ?? string.Empty,
                        DLVDPCS = row.Field<short?>("DLVDPCS") ?? 0,
                        DLVDSIGN = row.Field<string>("DLVDSIGN") ?? string.Empty,
                        DLVDNOTE = row.Field<string>("DLVDNOTE") ?? string.Empty,
                        DLVDIMGFILELOCN = row.Field<string>("DLVDIMGFILELOCN") ?? string.Empty,
                        DLVDIMGFILESIGN = row.Field<string>("DLVDIMGFILESIGN") ?? string.Empty
                    };
                }
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to retrieve delivery manifest for powerunit '{Powerunit}', date '{ManifestADate}' from company DB. Error: {ErrorMessage}", powerunit, manifestDate, ex.Message);
                throw;
            }
        }
    }
}

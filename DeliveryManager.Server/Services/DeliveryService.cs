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
        private readonly string _uploadFolderPath;

        public DeliveryService(IConfiguration config, ILogger<DeliveryService> logger)
        {
            _config = config;
            _logger = logger;
            _uploadFolderPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
            if (!Directory.Exists(_uploadFolderPath))
            {
                Directory.CreateDirectory(_uploadFolderPath);
            }
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

        private async Task<(string? locationFileName, string? signatureFileName)> HandleImageUploadAsync(DeliveryForm data)
        {
            // initialize with null (if absent) or file paths (if present)...
            string? locationFileName = data.location_string;
            string? signatureFileName = data.signature_string;

            if (data.DLVDIMGFILELOCN != null)
            {
                try
                {
                    locationFileName = Guid.NewGuid().ToString() + Path.GetExtension(data.DLVDIMGFILELOCN.FileName);
                    string filePath = Path.Combine(_uploadFolderPath, locationFileName);
                    using (var fileStream = new FileStream(filePath, FileMode.Create))
                    {
                        await data.DLVDIMGFILELOCN.CopyToAsync(fileStream);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error saving delivery location image file.");
                    locationFileName = null;
                }
            }

            if (data.DLVDIMGFILESIGN != null)
            {
                try
                {
                    signatureFileName = Guid.NewGuid().ToString() + Path.GetExtension(data.DLVDIMGFILESIGN.FileName);
                    string filePath = Path.Combine(_uploadFolderPath, signatureFileName);
                    using (var fileStream = new FileStream(filePath, FileMode.Create))
                    {
                        await data.DLVDIMGFILESIGN.CopyToAsync(fileStream);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error saving delivery signature image file.");
                    signatureFileName = null;
                }
            }

            return (locationFileName, signatureFileName);
        }

        public async Task<bool> UpdateDeliveryManifestAsync(DeliveryForm data, string companyConn, string username)
        {
            (string? locationPath, string? signaturePath) = await HandleImageUploadAsync(data);

            string query = @"
                UPDATE dbo.DMFSTDAT SET
                    STATUS = @STATUS,
                    LASTUPDATE = @LASTUPDATE,
                    MFSTNUMBER = @MFSTNUMBER,
                    POWERUNIT = @POWERUNIT,
                    STOP = @STOP,
                    MFSTDATE = @MFSTDATE,
                    PRONUMBER = @PRONUMBER,
                    PRODATE = @PRODATE,
                    SHIPNAME = @SHIPNAME,
                    CONSNAME = @CONSNAME,
                    CONSADD1 = @CONSADD1,
                    CONSADD2 = @CONSADD2,
                    CONSCITY = @CONSCITY,
                    CONSSTATE = @CONSSTATE,
                    CONSZIP = @CONSZIP,
                    TTLPCS = @TTLPCS,
                    TTLYDS = @TTLYDS,
                    TTLWGT = @TTLWGT,
                    DLVDDATE = @DLVDDATE,
                    DLVDTIME = @DLVDTIME,
                    DLVDPCS = @DLVDPCS,
                    DLVDSIGN = @DLVDSIGN,
                    DLVDNOTE = @DLVDNOTE,
                    DLVDIMGFILELOCN = @DLVDIMGFILELOCN,
                    DLVDIMGFILESIGN = @DLVDIMGFILESIGN,
                    USERNAME = @USERNAME
                WHERE MFSTKEY = @MFSTKEY";

            string connString = _config.GetConnectionString(companyConn)!;

            try
            {
                await using var conn = new SqlConnection(connString);
                await conn.OpenAsync();
                await using var comm = new SqlCommand(query, conn);

                comm.Parameters.AddWithValue("@MFSTKEY", data.MFSTKEY);
                comm.Parameters.AddWithValue("@STATUS", data.STATUS); 
                comm.Parameters.AddWithValue("@LASTUPDATE", data.LASTUPDATE);
                comm.Parameters.AddWithValue("@MFSTNUMBER", data.MFSTNUMBER);
                comm.Parameters.AddWithValue("@POWERUNIT", data.POWERUNIT);
                comm.Parameters.AddWithValue("@STOP", data.STOP);
                comm.Parameters.AddWithValue("@MFSTDATE", data.MFSTDATE);
                comm.Parameters.AddWithValue("@PRONUMBER", data.PRONUMBER);
                comm.Parameters.AddWithValue("@PRODATE", data.PRODATE);
                comm.Parameters.AddWithValue("@SHIPNAME", data.SHIPNAME);
                comm.Parameters.AddWithValue("@CONSNAME", data.CONSNAME);
                comm.Parameters.AddWithValue("@CONSADD1", data.CONSADD1);
                comm.Parameters.AddWithValue("@CONSADD2", data.CONSADD2 ?? (object)DBNull.Value); // If "null" string comes from frontend, change frontend to send actual null
                comm.Parameters.AddWithValue("@CONSCITY", data.CONSCITY);
                comm.Parameters.AddWithValue("@CONSSTATE", data.CONSSTATE);
                comm.Parameters.AddWithValue("@CONSZIP", data.CONSZIP);
                comm.Parameters.AddWithValue("@TTLPCS", data.TTLPCS);
                comm.Parameters.AddWithValue("@TTLYDS", data.TTLYDS);
                comm.Parameters.AddWithValue("@TTLWGT", data.TTLWGT);
                comm.Parameters.AddWithValue("@DLVDDATE", data.DLVDDATE ?? (object)DBNull.Value);
                comm.Parameters.AddWithValue("@DLVDTIME", data.DLVDTIME ?? (object)DBNull.Value);
                comm.Parameters.AddWithValue("@DLVDPCS", data.DLVDPCS == -1 ? DBNull.Value : data.DLVDPCS); // handle -1 null values...
                comm.Parameters.AddWithValue("@DLVDSIGN", data.DLVDSIGN ?? (object)DBNull.Value);
                comm.Parameters.AddWithValue("@DLVDNOTE", data.DLVDNOTE ?? (object)DBNull.Value);
                comm.Parameters.AddWithValue("@DLVDIMGFILELOCN", locationPath ?? (object)DBNull.Value); // Use new file name
                comm.Parameters.AddWithValue("@DLVDIMGFILESIGN", signaturePath ?? (object)DBNull.Value); // Use new file name
                comm.Parameters.AddWithValue("@USERNAME", username ?? (object)DBNull.Value);

                int rowsAffected = await comm.ExecuteNonQueryAsync();
                return rowsAffected > 0;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Database update failed for manifest {ManifestKey}.", data.MFSTKEY);
                return false;
            }
        }
    }
}

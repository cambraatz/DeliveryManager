using DeliveryManager.Server.Services.Interfaces;
using DeliveryManager.Server.Models;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Globalization;
using System.Threading.Tasks;

namespace DeliveryManager.Server.Services
{
    public class DeliveryListService : IDeliveryListService
    {
        private readonly ILogger<DeliveryListService> _logger;

        public DeliveryListService(ILogger<DeliveryListService> logger)
        {
            _logger = logger;
        }

        public async Task<(List<DeliveryManifest> Undelivered, List<DeliveryManifest> Delivered)> GetManifestListsAsync(
            string companyConn,
            string powerunit,
            string manifestDate)
        {
            var undelivered = new List<DeliveryManifest>();
            var delivered = new List<DeliveryManifest>();

            string query = "select * from dbo.DMFSTDAT where POWERUNIT=@POWERUNIT and MFSTDATE=@MFSTDATE and STATUS=@STATUS order by STOP";
            try
            {
                await using var conn = new SqlConnection(companyConn);
                await conn.OpenAsync();

                await using var undeliveredComm = new SqlCommand(query, conn);
                undeliveredComm.Parameters.AddWithValue("@POWERUNIT", powerunit);
                undeliveredComm.Parameters.AddWithValue("@MFSTDATE", manifestDate);
                undeliveredComm.Parameters.AddWithValue("@STATUS", 0);

                await using (var uReader = await undeliveredComm.ExecuteReaderAsync())
                {
                    while (uReader.Read())
                    {
                        undelivered.Add(MapDeliveryManifest(uReader));
                    }
                };
                

                await using var deliveredComm = new SqlCommand(query, conn);
                deliveredComm.Parameters.AddWithValue("@POWERUNIT", powerunit);
                deliveredComm.Parameters.AddWithValue("@MFSTDATE", manifestDate);
                deliveredComm.Parameters.AddWithValue("@STATUS", 1);

                await using (var dReader = await deliveredComm.ExecuteReaderAsync())
                {
                    while (dReader.Read())
                    {
                        delivered.Add(MapDeliveryManifest(dReader));
                    }
                };
                

                return (undelivered, delivered);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to retrieve delivery manifests for powerunit '{Powerunit}', date '{ManifestDate}' from company DB. Error: {ErrorMessage}", powerunit, manifestDate, ex.Message);
                throw;
            }
        }
        private DeliveryManifest MapDeliveryManifest(SqlDataReader reader)
        {
            return new DeliveryManifest
            {
                MFSTKEY = reader["MFSTKEY"]?.ToString() ?? string.Empty,
                STATUS = reader["STATUS"]?.ToString() ?? string.Empty,
                LASTUPDATE = reader["LASTUPDATE"]?.ToString() ?? string.Empty,
                MFSTNUMBER = reader["MFSTNUMBER"]?.ToString() ?? string.Empty,
                POWERUNIT = reader["POWERUNIT"]?.ToString() ?? string.Empty,
                STOP = reader.IsDBNull(reader.GetOrdinal("STOP")) ? (short)0 : reader.GetInt16(reader.GetOrdinal("STOP")),
                MFSTDATE = reader["MFSTDATE"]?.ToString() ?? string.Empty,
                PRONUMBER = reader["PRONUMBER"]?.ToString() ?? string.Empty,
                PRODATE = reader["PRODATE"]?.ToString() ?? string.Empty,
                SHIPNAME = reader["SHIPNAME"]?.ToString() ?? string.Empty,
                CONSNAME = reader["CONSNAME"]?.ToString() ?? string.Empty,
                CONSADD1 = reader["CONSADD1"]?.ToString() ?? string.Empty,
                CONSADD2 = reader["CONSADD2"]?.ToString() ?? string.Empty,
                CONSCITY = reader["CONSCITY"]?.ToString() ?? string.Empty,
                CONSSTATE = reader["CONSSTATE"]?.ToString() ?? string.Empty,
                CONSZIP = reader["CONSZIP"]?.ToString() ?? string.Empty,
                TTLPCS = reader.IsDBNull(reader.GetOrdinal("TTLPCS")) ? (short)0 : reader.GetInt16(reader.GetOrdinal("TTLPCS")),
                TTLYDS = reader.IsDBNull(reader.GetOrdinal("TTLYDS")) ? (short)0 : reader.GetInt16(reader.GetOrdinal("TTLYDS")),
                TTLWGT = reader.IsDBNull(reader.GetOrdinal("TTLWGT")) ? (short)0 : reader.GetInt16(reader.GetOrdinal("TTLWGT")),
                DLVDDATE = reader["DLVDDATE"]?.ToString() ?? string.Empty,
                DLVDTIME = reader["DLVDTIME"]?.ToString() ?? string.Empty,
                DLVDPCS = reader.IsDBNull(reader.GetOrdinal("DLVDPCS")) ? (short)0 : reader.GetInt16(reader.GetOrdinal("DLVDPCS")),
                DLVDSIGN = reader["DLVDSIGN"]?.ToString() ?? string.Empty,
                DLVDNOTE = reader["DLVDNOTE"]?.ToString() ?? string.Empty,
                DLVDIMGFILELOCN = reader["DLVDIMGFILELOCN"]?.ToString() ?? string.Empty,
                DLVDIMGFILESIGN = reader["DLVDIMGFILESIGN"]?.ToString() ?? string.Empty
            };
        }
    }
}

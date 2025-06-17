using System.Threading.Tasks;
using DeliveryManager.Server.Models;

namespace DeliveryManager.Server.Services.Interfaces
{
    public interface IDeliveryService
    {
        Task<DeliveryManifest?> GetDeliveryManifestAsync(string companyConn, string powerunit, string manifestDate);

        Task<bool> UpdateDeliveryManifestAsync(DeliveryForm data, string companyConn, string username);

        //Task<(string? locationFileName, string? signatureFileName)> SaveDeliveryImagesAsync(DeliveryForm data);
    }
}

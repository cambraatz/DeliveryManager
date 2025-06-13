using System.Threading.Tasks;
using DeliveryManager.Server.Models;

namespace DeliveryManager.Server.Services.Interfaces
{
    public interface IDeliveryService
    {
        Task<DeliveryManifest?> GetDeliveryManifestAsync(string companyConn, string powerunit, string manifestDate);
    }
}

using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using DeliveryManager.Server.Models;

namespace DeliveryManager.Server.Services.Interfaces
{
    public interface IDeliveryListService
    {
        Task<(List<DeliveryManifest> Undelivered, List<DeliveryManifest> Delivered)> GetManifestListsAsync(
            string companyConn,
            string powerunit,
            string manifestDate);
    }
}

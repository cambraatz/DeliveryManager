using System.Collections.Generic;

namespace DeliveryManager.Server.Models.Responses
{
    public class DeliveryListResponse
    {
        public List<DeliveryManifest> Undelivered { get; set; } = new List<DeliveryManifest>();
        public List<DeliveryManifest> Delivered { get; set; } = new List<DeliveryManifest>();
        public string Message { get; set; } = string.Empty;
    }
}

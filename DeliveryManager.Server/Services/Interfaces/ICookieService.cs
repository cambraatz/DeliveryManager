using Microsoft.AspNetCore.Http;

namespace DeliveryManager.Server.Services.Interfaces
{
    public interface ICookieService
    {
        CookieOptions RemoveOptions();
        CookieOptions AccessOptions();
        CookieOptions RefreshOptions();
        void ExtendCookies(HttpContext context, int extensionMinutes);
    }
}

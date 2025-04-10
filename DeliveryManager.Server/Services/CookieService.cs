using Microsoft.Extensions.Options;

namespace DeliveryManager.Server.Services
{
    public class CookieService
    {
        public static CookieOptions RemoveOptions()
        {
            return new CookieOptions
            {
                Expires = DateTime.UtcNow.AddDays(-1),
                HttpOnly = true,
                Secure = true,
                Domain = ".tcsservices.com",
                SameSite = SameSiteMode.None,
                Path = "/"
            };
        }
        public static CookieOptions AccessOptions()
        {
            return new CookieOptions
            {
                Expires = DateTime.UtcNow.AddMinutes(15),
                HttpOnly = true,
                Secure = true,
                Domain = ".tcsservices.com",
                SameSite = SameSiteMode.None,
                Path = "/"
            };
        }
        public static CookieOptions RefreshOptions()
        {
            return new CookieOptions
            {
                Expires = DateTime.UtcNow.AddDays(1),
                HttpOnly = true,
                Secure = true,
                Domain = ".tcsservices.com",
                SameSite = SameSiteMode.None,
                Path = "/"
            };
        }
        public static void ExtendCookies(HttpContext context)
        {
            var response = context.Response;
            var request = context.Request;

            foreach (var cookie in request.Cookies)
            {
                if (cookie.Key == "refresh_token")
                {
                    response.Cookies.Append(cookie.Key, cookie.Value, RefreshOptions());
                } 
                else
                {
                    response.Cookies.Append(cookie.Key, cookie.Value, AccessOptions());
                }
            }
        }
    }
}

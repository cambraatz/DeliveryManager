using DeliveryManager.Server.Models;

namespace DeliveryManager.Server.Services.Interfaces
{
    public interface ISessionService
    {
        Task<bool> AddOrUpdateSessionAsync(string username, string accessToken, string refreshToken, DateTime expiryTime, string? powerUnit, string? mfstDate);
        Task<bool> UpdateSessionLastActivityAsync(string username, string accessToken);
        Task<SessionModel?> GetSessionAsync(string username, string accessToken, string refreshToken);
        Task<SessionModel?> GetSessionByManifestDetailsAsync(string username, string powerUnit, string mfstDate, string accessToken, string refreshToken);
        Task<SessionModel?> GetConflictingSessionAsync(string currentUsername, string powerUnit, string mfstDate, string accessToken, string refreshToken);
        Task<bool> InvalidateSessionAsync(string username, string accessToken, string refreshToken);
        Task<bool> InvalidateSessionByTokensAsync(string accessToken, string refreshToken); // For when tokens are revoked externally
        Task<bool> InvalidateSessionByDeliveryManifest(string username, string powerunit, string mfstdate);
        Task<bool> ResetSessionByDeliveryManifestAsync(string username, string powerunit, string mfstdate, string accessToken);
        Task CleanupExpiredSessionsAsync(TimeSpan idleTimeout); // For background cleanup
    }
}

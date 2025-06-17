using DeliveryManager.Server.Models;

namespace DeliveryManager.Server.Services.Interfaces
{
    public interface IImageService
    {
        Task<(string? fileName, string? errorMessage)> SaveImageAsync(IFormFile imageFile);

        Task<(byte[]? fileBytes, string? contentType)> GetImageAsync(string fileName);
    }
}

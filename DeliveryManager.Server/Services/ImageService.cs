using DeliveryManager.Server.Services.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using System.IO;
using System.Threading.Tasks;
using DeliveryManager.Server.Models;

namespace DeliveryManager.Server.Services
{
    public class ImageService : IImageService
    {
        private readonly IWebHostEnvironment _webHostEnvironment;
        private readonly ILogger<ImageService> _logger;
        private readonly string _uploadFilePath;

        public ImageService(IWebHostEnvironment webHostEnvironment, ILogger<ImageService> logger)
        {
            _webHostEnvironment = webHostEnvironment;
            _logger = logger;
            _uploadFilePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
            if (!Directory.Exists(_uploadFilePath))
            {
                Directory.CreateDirectory(_uploadFilePath);
                _logger.LogInformation("Image uploads directory created at: {Path}", _uploadFilePath);
            }

            _logger.LogInformation("Image uploads directory located at: {Path}", _uploadFilePath);
        }

        public async Task<(string? fileName, string? errorMessage)> SaveImageAsync(IFormFile imageFile)
        {
            if (imageFile == null || imageFile.Length == 0)
            {
                return (null, "No image file provided or file is empty.");
            }

            try
            {
                string baseName = Guid.NewGuid().ToString().Substring(0,23) + Path.GetExtension(imageFile.FileName);
                string fileName = Path.Combine(_uploadFilePath, baseName);

                using (var fileStream = new FileStream(fileName, FileMode.Create))
                {
                    await imageFile.CopyToAsync(fileStream);
                }

                _logger.LogInformation("Image saved successfully: {FileName}", fileName);
                return (fileName, null);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving image file {FileName}.", imageFile.FileName);
                return (null, $"Error saving image: {ex.Message}");
            }
        }

        public async Task<(byte[]? fileBytes, string? contentType)> GetImageAsync(string fileName)
        {
            if (string.IsNullOrEmpty(fileName))
            {
                return (null, null);
            }

            string filePath = Path.Combine(_uploadFilePath, fileName);
            if (!File.Exists(filePath))
            {
                _logger.LogWarning("Image file not found: {FilePath}", filePath);
                return (null, null);
            }

            try
            {
                byte[] fileBytes = await File.ReadAllBytesAsync(filePath);
                string contentType = GetContentType(fileName);
                _logger.LogInformation("Image retrieved successfully: {FileName}", fileName);

                return (fileBytes, contentType);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving image file: {FilePath}", filePath);
                return(null, null);
            }
        }

        private string GetContentType(string fileName)
        {
            var ext = Path.GetExtension(fileName)?.ToLowerInvariant();
            return ext switch
            {
                ".jpg" or ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                ".gif" => "image/gif",
                ".bmp" => "image/bmp",
                ".tiff" or ".tif" => "image/tiff",
                _ => "application/octet-stream",
            };
        }
    }
}

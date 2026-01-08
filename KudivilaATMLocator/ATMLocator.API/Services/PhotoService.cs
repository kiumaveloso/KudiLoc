namespace ATMLocator.API.Services;

public interface IPhotoService
{
    Task<string> SavePhotoAsync(byte[] photoData, string atmId);
    string GetPhotoUrl(string fileName);
}

public class PhotoService : IPhotoService
{
    private readonly string _photoDirectory;
    private readonly string _baseUrl;

    public PhotoService(IConfiguration configuration)
    {
        _photoDirectory = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "photos");
        _baseUrl = configuration["BaseUrl"] ?? "http://localhost:5000";
        
        if (!Directory.Exists(_photoDirectory))
        {
            Directory.CreateDirectory(_photoDirectory);
        }
    }

    public async Task<string> SavePhotoAsync(byte[] photoData, string atmId)
    {
        var fileName = $"{atmId}_{Guid.NewGuid()}.jpg";
        var filePath = Path.Combine(_photoDirectory, fileName);
        await File.WriteAllBytesAsync(filePath, photoData);
        return fileName;
    }

    public string GetPhotoUrl(string fileName)
    {
        return $"{_baseUrl}/photos/{fileName}";
    }
}
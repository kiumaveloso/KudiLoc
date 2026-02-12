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

    private const int MaxPhotoSizeBytes = 5 * 1024 * 1024; // 5 MB

    // JPEG: FF D8 FF, PNG: 89 50 4E 47
    private static readonly byte[] JpegMagic = [0xFF, 0xD8, 0xFF];
    private static readonly byte[] PngMagic = [0x89, 0x50, 0x4E, 0x47];

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
        if (photoData.Length == 0)
            throw new ArgumentException("Dados da foto estão vazios");

        if (photoData.Length > MaxPhotoSizeBytes)
            throw new ArgumentException($"Foto excede o tamanho máximo de {MaxPhotoSizeBytes / (1024 * 1024)}MB");

        var extension = DetectImageExtension(photoData)
            ?? throw new ArgumentException("Formato de imagem inválido. Apenas JPEG e PNG são aceites");

        var fileName = $"{atmId}_{Guid.NewGuid()}{extension}";
        var filePath = Path.Combine(_photoDirectory, fileName);
        await File.WriteAllBytesAsync(filePath, photoData);
        return fileName;
    }

    public string GetPhotoUrl(string fileName)
    {
        return $"{_baseUrl}/photos/{fileName}";
    }

    private static string? DetectImageExtension(byte[] data)
    {
        if (data.Length >= 3 && data[..3].SequenceEqual(JpegMagic))
            return ".jpg";
        if (data.Length >= 4 && data[..4].SequenceEqual(PngMagic))
            return ".png";
        return null;
    }
}

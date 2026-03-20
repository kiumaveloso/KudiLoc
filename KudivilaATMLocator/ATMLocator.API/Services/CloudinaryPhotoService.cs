using CloudinaryDotNet;
using CloudinaryDotNet.Actions;

namespace ATMLocator.API.Services;

public class CloudinaryPhotoService : IPhotoService
{
    private readonly Cloudinary _cloudinary;
    private const int MaxPhotoSizeBytes = 5 * 1024 * 1024; // 5 MB

    // JPEG: FF D8 FF, PNG: 89 50 4E 47
    private static readonly byte[] JpegMagic = [0xFF, 0xD8, 0xFF];
    private static readonly byte[] PngMagic = [0x89, 0x50, 0x4E, 0x47];

    public CloudinaryPhotoService(IConfiguration configuration)
    {
        var cloudName = configuration["Cloudinary:CloudName"]!;
        var apiKey = configuration["Cloudinary:ApiKey"]!;
        var apiSecret = configuration["Cloudinary:ApiSecret"]!;

        var account = new Account(cloudName, apiKey, apiSecret);
        _cloudinary = new Cloudinary(account) { Api = { Secure = true } };
    }

    public async Task<string> SavePhotoAsync(byte[] photoData, string atmId)
    {
        if (photoData.Length == 0)
            throw new ArgumentException("Dados da foto estão vazios");

        if (photoData.Length > MaxPhotoSizeBytes)
            throw new ArgumentException($"Foto excede o tamanho máximo de {MaxPhotoSizeBytes / (1024 * 1024)}MB");

        if (!IsValidImage(photoData))
            throw new ArgumentException("Formato de imagem inválido. Apenas JPEG e PNG são aceites");

        var publicId = $"kudiloc/atms/{atmId}/{Guid.NewGuid()}";

        using var stream = new MemoryStream(photoData);
        var uploadParams = new ImageUploadParams
        {
            File = new FileDescription(publicId, stream),
            PublicId = publicId,
            Overwrite = false,
            Folder = $"kudiloc/atms/{atmId}",
            Transformation = new Transformation()
                .Width(1200).Height(900).Crop("limit")
                .Quality("auto").FetchFormat("auto"),
        };

        var result = await _cloudinary.UploadAsync(uploadParams);

        if (result.Error != null)
            throw new InvalidOperationException($"Erro ao fazer upload da foto: {result.Error.Message}");

        return result.SecureUrl.ToString();
    }

    public string GetPhotoUrl(string fileNameOrUrl)
    {
        // If already a full URL (Cloudinary), return as-is
        if (fileNameOrUrl.StartsWith("http"))
            return fileNameOrUrl;

        // Fallback for legacy local filenames
        return fileNameOrUrl;
    }

    private static bool IsValidImage(byte[] data)
    {
        if (data.Length >= 3 && data[..3].SequenceEqual(JpegMagic)) return true;
        if (data.Length >= 4 && data[..4].SequenceEqual(PngMagic)) return true;
        return false;
    }
}

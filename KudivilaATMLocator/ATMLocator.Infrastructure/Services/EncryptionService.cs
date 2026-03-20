using System.Security.Cryptography;
using System.Text;
using ATMLocator.Core.Interfaces;
using Microsoft.Extensions.Configuration;

namespace ATMLocator.Infrastructure.Services;

/// <summary>
/// AES-256-CBC encryption for sensitive fields (phone numbers).
/// The IV is prepended to the ciphertext and stored as a single Base64 string.
/// A separate HMAC-SHA256 key is used for deterministic hashing so lookup queries
/// can match without decrypting the full field.
/// </summary>
public class EncryptionService : IEncryptionService
{
    private readonly byte[] _key;
    private readonly byte[] _hmacKey;

    public EncryptionService(IConfiguration configuration)
    {
        var keyBase64 = configuration["Encryption:Key"]
            ?? throw new InvalidOperationException("Encryption:Key is not configured.");
        var hmacKeyBase64 = configuration["Encryption:HmacKey"]
            ?? throw new InvalidOperationException("Encryption:HmacKey is not configured.");

        _key = Convert.FromBase64String(keyBase64);
        _hmacKey = Convert.FromBase64String(hmacKeyBase64);

        if (_key.Length != 32)
            throw new InvalidOperationException("Encryption:Key must be a 32-byte (256-bit) Base64 string.");
        if (_hmacKey.Length < 32)
            throw new InvalidOperationException("Encryption:HmacKey must be at least 32 bytes.");
    }

    public string Encrypt(string plainText)
    {
        using var aes = Aes.Create();
        aes.Key = _key;
        aes.Mode = CipherMode.CBC;
        aes.Padding = PaddingMode.PKCS7;
        aes.GenerateIV();

        using var encryptor = aes.CreateEncryptor();
        var plainBytes = Encoding.UTF8.GetBytes(plainText);
        var cipherBytes = encryptor.TransformFinalBlock(plainBytes, 0, plainBytes.Length);

        // Prepend IV so it can be extracted on decryption
        var result = new byte[aes.IV.Length + cipherBytes.Length];
        Buffer.BlockCopy(aes.IV, 0, result, 0, aes.IV.Length);
        Buffer.BlockCopy(cipherBytes, 0, result, aes.IV.Length, cipherBytes.Length);

        return Convert.ToBase64String(result);
    }

    public string Decrypt(string cipherText)
    {
        var allBytes = Convert.FromBase64String(cipherText);

        using var aes = Aes.Create();
        aes.Key = _key;
        aes.Mode = CipherMode.CBC;
        aes.Padding = PaddingMode.PKCS7;

        // First 16 bytes are the IV
        var iv = new byte[16];
        var cipher = new byte[allBytes.Length - 16];
        Buffer.BlockCopy(allBytes, 0, iv, 0, 16);
        Buffer.BlockCopy(allBytes, 16, cipher, 0, cipher.Length);

        aes.IV = iv;
        using var decryptor = aes.CreateDecryptor();
        var plainBytes = decryptor.TransformFinalBlock(cipher, 0, cipher.Length);
        return Encoding.UTF8.GetString(plainBytes);
    }

    public string Hash(string value)
    {
        using var hmac = new HMACSHA256(_hmacKey);
        var hashBytes = hmac.ComputeHash(Encoding.UTF8.GetBytes(value));
        return Convert.ToHexString(hashBytes).ToLowerInvariant();
    }
}

using System.Collections.Concurrent;
using System.Security.Cryptography;

namespace ATMLocator.Application.Services;

public interface IOtpService
{
    string GenerateOtp(string phoneNumber);
    bool VerifyOtp(string phoneNumber, string otpCode);
}

public class OtpService : IOtpService
{
    private readonly ConcurrentDictionary<string, OtpEntry> _otpStore = new();
    private static readonly TimeSpan OtpExpiration = TimeSpan.FromMinutes(5);

    public string GenerateOtp(string phoneNumber)
    {
        var code = RandomNumberGenerator.GetInt32(100000, 999999).ToString();
        var entry = new OtpEntry(code, DateTime.UtcNow.Add(OtpExpiration));
        _otpStore.AddOrUpdate(phoneNumber, entry, (_, _) => entry);
        return code;
    }

    public bool VerifyOtp(string phoneNumber, string otpCode)
    {
        if (!_otpStore.TryRemove(phoneNumber, out var entry))
            return false;

        if (DateTime.UtcNow > entry.ExpiresAt)
            return false;

        return entry.Code == otpCode;
    }

    private record OtpEntry(string Code, DateTime ExpiresAt);
}

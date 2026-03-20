using System.Security.Cryptography;
using ATMLocator.Core.Interfaces;

namespace ATMLocator.Application.Services;

public interface IOtpService
{
    Task<string> GenerateOtpAsync(string phoneNumber);
    Task<bool> VerifyOtpAsync(string phoneNumber, string otpCode);
}

public class OtpService : IOtpService
{
    private readonly IOtpRepository _otpRepository;

    public OtpService(IOtpRepository otpRepository)
    {
        _otpRepository = otpRepository;
    }

    public async Task<string> GenerateOtpAsync(string phoneNumber)
    {
        var code = RandomNumberGenerator.GetInt32(100000, 999999).ToString();
        await _otpRepository.SaveAsync(phoneNumber, code, DateTime.UtcNow.AddMinutes(5));
        return code;
    }

    public async Task<bool> VerifyOtpAsync(string phoneNumber, string otpCode)
    {
        var entry = await _otpRepository.GetAsync(phoneNumber);

        if (entry == null)
            return false;

        if (DateTime.UtcNow > entry.ExpiresAt)
            return false;

        await _otpRepository.DeleteAsync(phoneNumber);

        return entry.Code == otpCode;
    }
}

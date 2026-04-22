using System.Security.Cryptography;
using ATMLocator.Core.Interfaces;
using Microsoft.Extensions.Configuration;

namespace ATMLocator.Application.Services;

public interface IOtpService
{
    Task<string> GenerateOtpAsync(string phoneNumber);
    Task<bool> VerifyOtpAsync(string phoneNumber, string otpCode);
}

public class OtpService : IOtpService
{
    private readonly IOtpRepository _otpRepository;
    private readonly HashSet<string> _demoPhoneNumbers;
    private const string DemoOtpCode = "123456";

    public OtpService(IOtpRepository otpRepository, IConfiguration config)
    {
        _otpRepository = otpRepository;
        var numbers = config.GetSection("Demo:PhoneNumbers").Get<string[]>() ?? [];
        _demoPhoneNumbers = new HashSet<string>(numbers, StringComparer.OrdinalIgnoreCase);
    }

    public async Task<string> GenerateOtpAsync(string phoneNumber)
    {
        if (_demoPhoneNumbers.Contains(phoneNumber))
        {
            await _otpRepository.SaveAsync(phoneNumber, DemoOtpCode, DateTime.UtcNow.AddHours(24));
            return DemoOtpCode;
        }

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

        if (entry.Code != otpCode)
            return false;

        await _otpRepository.DeleteAsync(phoneNumber);
        return true;
    }
}

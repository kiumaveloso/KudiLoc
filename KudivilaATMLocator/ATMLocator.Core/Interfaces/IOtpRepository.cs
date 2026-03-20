using ATMLocator.Core.Entities;

namespace ATMLocator.Core.Interfaces;

public interface IOtpRepository
{
    Task SaveAsync(string phoneNumber, string code, DateTime expiresAt);
    Task<OtpEntry?> GetAsync(string phoneNumber);
    Task DeleteAsync(string phoneNumber);
}

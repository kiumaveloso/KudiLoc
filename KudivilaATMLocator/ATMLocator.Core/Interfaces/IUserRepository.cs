using ATMLocator.Core.Entities;

namespace ATMLocator.Core.Interfaces;

public interface IUserRepository
{
    Task<User?> GetByIdAsync(string id);
    Task<User?> GetByPhoneNumberAsync(string phoneNumber);
    Task<User> CreateAsync(User user);
    Task<User> UpdateAsync(User user);
}
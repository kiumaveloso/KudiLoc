using ATMLocator.Core.Entities;

namespace ATMLocator.Core.Interfaces;

public interface IUserRepository
{
    Task<User?> GetByIdAsync(string id);
    Task<User?> GetByPhoneNumberAsync(string phoneNumber);
    Task<User> CreateAsync(User user);
    Task<User> UpdateAsync(User user);
    Task<long> CountAllAsync();
    Task<bool> DeleteAsync(string id);
    Task<List<User>> GetTopByReportsAsync(int limit = 20);
    Task<List<User>> GetByIdsAsync(IEnumerable<string> ids);
    Task<List<User>> GetUnmigratedAsync(); // users where PhoneNumberHash is null or empty
}
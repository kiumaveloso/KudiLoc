using ATMLocator.Core.Entities;
using ATMLocator.Core.Interfaces;
using ATMLocator.Application.DTOs;

namespace ATMLocator.Application.Services;

public interface IUserService
{
    Task<User?> GetUserByIdAsync(string id);
    Task<User?> GetUserByPhoneNumberAsync(string phoneNumber);
    Task<User> CreateUserAsync(CreateUserDto dto);
    Task<User> UpdateUserAsync(string id, UpdateUserDto dto);
    Task<bool> DeleteUserAsync(string id);
}

public class UserService : IUserService
{
    private readonly IUserRepository _userRepository;

    public UserService(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public async Task<User?> GetUserByIdAsync(string id)
    {
        return await _userRepository.GetByIdAsync(id);
    }

    public async Task<User?> GetUserByPhoneNumberAsync(string phoneNumber)
    {
        return await _userRepository.GetByPhoneNumberAsync(phoneNumber);
    }

    public async Task<User> CreateUserAsync(CreateUserDto dto)
    {
        var existingUser = await _userRepository.GetByPhoneNumberAsync(dto.PhoneNumber);
        if (existingUser != null)
        {
            throw new InvalidOperationException("User with this phone number already exists");
        }

        var user = new User
        {
            PhoneNumber = dto.PhoneNumber,
            Name = dto.Name,
            ReputationScore = 50,
            TotalReports = 0,
            AccurateReports = 0,
            CreatedAt = DateTime.UtcNow
        };

        return await _userRepository.CreateAsync(user);
    }

    public async Task<User> UpdateUserAsync(string id, UpdateUserDto dto)
    {
        var user = await _userRepository.GetByIdAsync(id);
        if (user == null)
        {
            throw new ArgumentException("User not found");
        }

        if (!string.IsNullOrEmpty(dto.Name))
        {
            user.Name = dto.Name;
        }

        return await _userRepository.UpdateAsync(user);
    }

    public async Task<bool> DeleteUserAsync(string id)
    {
        return await _userRepository.DeleteAsync(id);
    }
}

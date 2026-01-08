using ATMLocator.Core.Entities;
using ATMLocator.Core.Interfaces;
using ATMLocator.Application.DTOs;

namespace ATMLocator.Application.Services;

public interface IUserService
{
    Task<UserDto> CreateUserAsync(CreateUserDto dto);
    Task<UserDto?> GetUserByPhoneNumberAsync(string phoneNumber);
    Task<UserDto?> GetUserByIdAsync(string id);
}

public class UserService : IUserService
{
    private readonly IUserRepository _userRepository;

    public UserService(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public async Task<UserDto> CreateUserAsync(CreateUserDto dto)
    {
        // Check if user already exists
        var existingUser = await _userRepository.GetByPhoneNumberAsync(dto.PhoneNumber);
        if (existingUser != null)
        {
            throw new InvalidOperationException("Utilizador já existe com este número");
        }

        var user = new User
        {
            PhoneNumber = dto.PhoneNumber,
            Name = dto.Name,
            ReputationScore = 50,
            TotalReports = 0,
            AccurateReports = 0
        };

        var created = await _userRepository.CreateAsync(user);
        return MapToDto(created);
    }

    public async Task<UserDto?> GetUserByPhoneNumberAsync(string phoneNumber)
    {
        var user = await _userRepository.GetByPhoneNumberAsync(phoneNumber);
        return user == null ? null : MapToDto(user);
    }

    public async Task<UserDto?> GetUserByIdAsync(string id)
    {
        var user = await _userRepository.GetByIdAsync(id);
        return user == null ? null : MapToDto(user);
    }
  
    private UserDto MapToDto(User user)
    {
        return new UserDto(
            user.Id,
            user.PhoneNumber,
            user.Name,
            user.ReputationScore,
            user.TotalReports,
            user.AccurateReports
        );
    }
}
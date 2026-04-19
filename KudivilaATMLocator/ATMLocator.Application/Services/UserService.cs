using ATMLocator.Core.Entities;
using ATMLocator.Core.Interfaces;
using ATMLocator.Application.DTOs;

namespace ATMLocator.Application.Services;

public interface IUserService
{
    Task<UserDto?> GetUserByIdAsync(string id);
    Task<UserDto?> GetUserByPhoneNumberAsync(string phoneNumber);
    Task<UserDto> CreateUserAsync(CreateUserDto dto);
    Task<UserDto> UpdateUserAsync(string id, UpdateUserDto dto);
    Task<UserDto> AssignRoleAsync(string id, string role);
    Task<bool> DeleteUserAsync(string id);
}

public class UserService : IUserService
{
    private readonly IUserRepository _userRepository;

    public UserService(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public async Task<UserDto?> GetUserByIdAsync(string id)
    {
        var user = await _userRepository.GetByIdAsync(id);
        return user == null ? null : MapToDto(user);
    }

    public async Task<UserDto?> GetUserByPhoneNumberAsync(string phoneNumber)
    {
        var user = await _userRepository.GetByPhoneNumberAsync(phoneNumber);
        return user == null ? null : MapToDto(user);
    }

    public async Task<UserDto> CreateUserAsync(CreateUserDto dto)
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

        var created = await _userRepository.CreateAsync(user);
        return MapToDto(created);
    }

    public async Task<UserDto> UpdateUserAsync(string id, UpdateUserDto dto)
    {
        var user = await _userRepository.GetByIdAsync(id);
        if (user == null)
        {
            throw new ArgumentException("Utilizador nao encontrado");
        }

        if (!string.IsNullOrEmpty(dto.Name))
        {
            user.Name = dto.Name;
        }

        var updated = await _userRepository.UpdateAsync(user);
        return MapToDto(updated);
    }

    public async Task<UserDto> AssignRoleAsync(string id, string role)
    {
        var allowed = new[] { "user", "Admin" };
        if (!allowed.Contains(role))
            throw new ArgumentException($"Role inválido. Valores permitidos: {string.Join(", ", allowed)}");

        var user = await _userRepository.GetByIdAsync(id);
        if (user == null)
            throw new ArgumentException("Utilizador não encontrado");

        user.Role = role;
        var updated = await _userRepository.UpdateAsync(user);
        return MapToDto(updated);
    }

    public async Task<bool> DeleteUserAsync(string id)
    {
        return await _userRepository.DeleteAsync(id);
    }

    private static UserDto MapToDto(User user)
    {
        return new UserDto(
            user.Id,
            user.Name,
            user.ReputationScore,
            user.TotalReports,
            user.AccurateReports,
            user.Role,
            user.CreatedAt
        );
    }
}

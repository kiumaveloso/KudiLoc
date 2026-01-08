using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using ATMLocator.Core.Interfaces;
using ATMLocator.Core.Settings;
using ATMLocator.Application.DTOs;

namespace ATMLocator.Application.Services;

public interface IAuthService
{
    Task<AuthResponseDto> LoginAsync(string phoneNumber);
    Task<AuthResponseDto> RegisterAsync(string phoneNumber, string? name);
    string GenerateToken(string userId, string role);
}

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly JwtSettings _jwtSettings;

    public AuthService(IUserRepository userRepository, JwtSettings jwtSettings)
    {
        _userRepository = userRepository;
        _jwtSettings = jwtSettings;
    }

    public async Task<AuthResponseDto> LoginAsync(string phoneNumber)
    {
        var user = await _userRepository.GetByPhoneNumberAsync(phoneNumber);
        
        if (user == null)
        {
            throw new UnauthorizedAccessException("Utilizador não encontrado");
        }

        var token = GenerateToken(user.Id, "User");
        
        return new AuthResponseDto(
            token,
            user.Id,
            user.PhoneNumber,
            user.Name,
            user.ReputationScore
        );
    }

    public async Task<AuthResponseDto> RegisterAsync(string phoneNumber, string? name)
    {
        var existingUser = await _userRepository.GetByPhoneNumberAsync(phoneNumber);
        
        if (existingUser != null)
        {
            throw new InvalidOperationException("Utilizador já existe");
        }

        var user = await _userRepository.CreateAsync(new Core.Entities.User
        {
            PhoneNumber = phoneNumber,
            Name = name,
            ReputationScore = 50,
            TotalReports = 0,
            AccurateReports = 0
        });

        var token = GenerateToken(user.Id, "User");

        return new AuthResponseDto(
            token,
            user.Id,
            user.PhoneNumber,
            user.Name,
            user.ReputationScore
        );
    }

    public string GenerateToken(string userId, string role)
    {
        if (string.IsNullOrEmpty(_jwtSettings.Key))
        {
            throw new InvalidOperationException("JWT Key not configured");
        }

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.Key));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId),
            new Claim(ClaimTypes.Role, role),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: _jwtSettings.Issuer,
            audience: _jwtSettings.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddDays(_jwtSettings.ExpirationDays),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
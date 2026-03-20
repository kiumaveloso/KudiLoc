using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using ATMLocator.Core.Entities;
using ATMLocator.Core.Interfaces;
using ATMLocator.Core.Settings;
using ATMLocator.Application.DTOs;

namespace ATMLocator.Application.Services;

public interface IAuthService
{
    Task<AuthResponseDto> LoginAsync(string phoneNumber);
    Task<AuthResponseDto> RegisterAsync(string phoneNumber, string? name);
    string GenerateToken(string userId, string role);
    Task<string> GenerateRefreshTokenAsync(string userId);
    Task<AuthResponseDto> RefreshAccessTokenAsync(string refreshToken);
    Task RevokeRefreshTokenAsync(string refreshToken);
}

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IRefreshTokenRepository _refreshTokenRepository;
    private readonly JwtSettings _jwtSettings;

    public AuthService(IUserRepository userRepository, IRefreshTokenRepository refreshTokenRepository, JwtSettings jwtSettings)
    {
        _userRepository = userRepository;
        _refreshTokenRepository = refreshTokenRepository;
        _jwtSettings = jwtSettings;
    }

    public async Task<AuthResponseDto> LoginAsync(string phoneNumber)
    {
        var user = await _userRepository.GetByPhoneNumberAsync(phoneNumber);

        if (user == null)
        {
            throw new UnauthorizedAccessException("Utilizador não encontrado");
        }

        var token = GenerateToken(user.Id, user.Role ?? "user");

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

        var user = await _userRepository.CreateAsync(new User
        {
            PhoneNumber = phoneNumber,
            Name = name,
            ReputationScore = 50,
            TotalReports = 0,
            AccurateReports = 0
        });

        var token = GenerateToken(user.Id, user.Role ?? "user");

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
            expires: DateTime.UtcNow.AddMinutes(_jwtSettings.AccessTokenMinutes),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public async Task<string> GenerateRefreshTokenAsync(string userId)
    {
        var tokenBytes = RandomNumberGenerator.GetBytes(64);
        var tokenString = Convert.ToBase64String(tokenBytes);

        var refreshToken = new RefreshToken
        {
            UserId = userId,
            Token = tokenString,
            ExpiresAt = DateTime.UtcNow.AddDays(30),
            IsRevoked = false
        };

        await _refreshTokenRepository.CreateAsync(refreshToken);
        return tokenString;
    }

    public async Task<AuthResponseDto> RefreshAccessTokenAsync(string refreshToken)
    {
        var storedToken = await _refreshTokenRepository.GetByTokenAsync(refreshToken);

        if (storedToken == null || storedToken.IsRevoked || storedToken.ExpiresAt < DateTime.UtcNow)
        {
            throw new UnauthorizedAccessException("Token de atualização inválido ou expirado");
        }

        var user = await _userRepository.GetByIdAsync(storedToken.UserId);
        if (user == null)
        {
            throw new UnauthorizedAccessException("Utilizador não encontrado");
        }

        var accessToken = GenerateToken(user.Id, user.Role ?? "user");

        return new AuthResponseDto(
            accessToken,
            user.Id,
            user.PhoneNumber,
            user.Name,
            user.ReputationScore
        );
    }

    public async Task RevokeRefreshTokenAsync(string refreshToken)
    {
        await _refreshTokenRepository.RevokeAsync(refreshToken);
    }
}

using Xunit;
using Moq;
using FluentAssertions;
using ATMLocator.Application.Services;
using ATMLocator.Core.Interfaces;
using ATMLocator.Core.Entities;
using ATMLocator.Core.Settings;

namespace ATMLocator.Tests;

public class AuthServiceTests
{
    private readonly Mock<IUserRepository> _mockRepo;
    private readonly Mock<IRefreshTokenRepository> _mockRefreshTokenRepo;
    private readonly JwtSettings _jwtSettings;
    private readonly AuthService _service;

    public AuthServiceTests()
    {
        _mockRepo = new Mock<IUserRepository>();
        _mockRefreshTokenRepo = new Mock<IRefreshTokenRepository>();
        _jwtSettings = new JwtSettings
        {
            Key = "ThisIsAVerySecretKeyThatIs32CharsLong!",
            Issuer = "KudividaAPI",
            Audience = "KudividaApp",
            ExpirationDays = 30,
            AccessTokenMinutes = 15
        };
        _service = new AuthService(_mockRepo.Object, _mockRefreshTokenRepo.Object, _jwtSettings);
    }

    [Fact]
    public async Task RegisterAsync_WithNewUser_CreatesUserAndReturnsToken()
    {
        // Arrange
        _mockRepo.Setup(r => r.GetByPhoneNumberAsync(It.IsAny<string>()))
            .ReturnsAsync((User?)null);
        
        _mockRepo.Setup(r => r.CreateAsync(It.IsAny<User>()))
            .ReturnsAsync((User u) => 
            {
                u.Id = "user123";
                return u;
            });

        // Act
        var result = await _service.RegisterAsync("+244923456789", "João Silva");

        // Assert
        result.Should().NotBeNull();
        result.Token.Should().NotBeNullOrEmpty();
        result.UserId.Should().Be("user123");
        result.PhoneNumber.Should().Be("+244923456789");
        result.ReputationScore.Should().Be(50);
        _mockRepo.Verify(r => r.CreateAsync(It.IsAny<User>()), Times.Once);
    }

    [Fact]
    public async Task RegisterAsync_WithExistingUser_ThrowsInvalidOperationException()
    {
        // Arrange
        var existingUser = new User
        {
            Id = "existing",
            PhoneNumber = "+244923456789",
            ReputationScore = 75,
            TotalReports = 5,
            AccurateReports = 4,
            CreatedAt = DateTime.UtcNow
        };

        _mockRepo.Setup(r => r.GetByPhoneNumberAsync("+244923456789"))
            .ReturnsAsync(existingUser);

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            async () => await _service.RegisterAsync("+244923456789", "João Silva")
        );
    }

    [Fact]
    public async Task LoginAsync_WithValidUser_ReturnsToken()
    {
        // Arrange
        var user = new User
        {
            Id = "user123",
            PhoneNumber = "+244923456789",
            Name = "João Silva",
            ReputationScore = 85,
            TotalReports = 20,
            AccurateReports = 18,
            CreatedAt = DateTime.UtcNow
        };

        _mockRepo.Setup(r => r.GetByPhoneNumberAsync("+244923456789"))
            .ReturnsAsync(user);

        // Act
        var result = await _service.LoginAsync("+244923456789");

        // Assert
        result.Should().NotBeNull();
        result.Token.Should().NotBeNullOrEmpty();
        result.UserId.Should().Be("user123");
        result.ReputationScore.Should().Be(85);
    }

    [Fact]
    public async Task LoginAsync_WithInvalidUser_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        _mockRepo.Setup(r => r.GetByPhoneNumberAsync(It.IsAny<string>()))
            .ReturnsAsync((User?)null);

        // Act & Assert
        await Assert.ThrowsAsync<UnauthorizedAccessException>(
            async () => await _service.LoginAsync("+244999999999")
        );
    }

    [Fact]
    public void GenerateToken_CreatesValidJWT()
    {
        // Act
        var token = _service.GenerateToken("user123", "User");

        // Assert
        token.Should().NotBeNullOrEmpty();
        token.Split('.').Should().HaveCount(3); // JWT has 3 parts: header.payload.signature
    }
} 
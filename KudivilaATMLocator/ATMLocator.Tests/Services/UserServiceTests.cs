using Xunit;
using Moq;
using FluentAssertions;
using ATMLocator.Application.Services;
using ATMLocator.Core.Interfaces;
using ATMLocator.Core.Entities;
using CreateUserDto = ATMLocator.Application.DTOs.CreateUserDto;

namespace ATMLocator.Tests;

public class UserServiceTests
{
    private readonly Mock<IUserRepository> _mockRepo;
    private readonly UserService _service;

    public UserServiceTests()
    {
        _mockRepo = new Mock<IUserRepository>();
        _service = new UserService(_mockRepo.Object);
    }

    [Fact]
    public async Task CreateUser_WithValidData_CreatesUser()
    {
        _mockRepo.Setup(r => r.GetByPhoneNumberAsync(It.IsAny<string>()))
            .ReturnsAsync((User?)null);
        
        _mockRepo.Setup(r => r.CreateAsync(It.IsAny<User>()))
            .ReturnsAsync((User u) => 
            {
                u.Id = "user123";
                return u;
            });

        var dto = new CreateUserDto("+244923456789", "João Silva");

        var result = await _service.CreateUserAsync(dto);

        result.Should().NotBeNull();
        result.PhoneNumber.Should().Be("+244923456789");
        result.Name.Should().Be("João Silva");
        result.ReputationScore.Should().Be(50);
        _mockRepo.Verify(r => r.CreateAsync(It.IsAny<User>()), Times.Once);
    }

    [Fact]
    public async Task CreateUser_WhenUserExists_ThrowsInvalidOperationException()
    {
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

        var dto = new CreateUserDto("+244923456789", "João Silva");

        await Assert.ThrowsAsync<InvalidOperationException>(
            async () => await _service.CreateUserAsync(dto)
        );
    }

    [Fact]
    public async Task GetUserByPhoneNumber_WhenExists_ReturnsUser()
    {
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

        var result = await _service.GetUserByPhoneNumberAsync("+244923456789");

        result.Should().NotBeNull();
        result!.PhoneNumber.Should().Be("+244923456789");
        result.ReputationScore.Should().Be(85);
    }

    [Fact]
    public async Task GetUserByPhoneNumber_WhenNotExists_ReturnsNull()
    {
        _mockRepo.Setup(r => r.GetByPhoneNumberAsync(It.IsAny<string>()))
            .ReturnsAsync((User?)null);

        var result = await _service.GetUserByPhoneNumberAsync("+244999999999");

        result.Should().BeNull();
    }

    [Fact]
    public async Task GetUserById_WhenExists_ReturnsUser()
    {
        var user = new User
        {
            Id = "user123",
            PhoneNumber = "+244923456789",
            Name = "João Silva",
            ReputationScore = 75,
            TotalReports = 10,
            AccurateReports = 8,
            CreatedAt = DateTime.UtcNow
        };

        _mockRepo.Setup(r => r.GetByIdAsync("user123")).ReturnsAsync(user);

        var result = await _service.GetUserByIdAsync("user123");

        result.Should().NotBeNull();
        result!.Id.Should().Be("user123");
    }
}
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using ATMLocator.Application.DTOs;
using ATMLocator.Core.Entities;
using FluentAssertions;
using Moq;
using Xunit;

namespace ATMLocator.Tests.Integration;

public class AuthControllerTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly CustomWebApplicationFactory _factory;

    public AuthControllerTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Register_WithValidData_ReturnsOkWithToken()
    {
        // Arrange
        _factory.MockUserRepository
            .Setup(r => r.GetByPhoneNumberAsync(It.IsAny<string>()))
            .ReturnsAsync((User?)null);

        _factory.MockUserRepository
            .Setup(r => r.CreateAsync(It.IsAny<User>()))
            .ReturnsAsync((User u) => { u.Id = "new-user-id"; return u; });

        var dto = new CreateUserDto("+244923000001", "Test User");

        // Act
        var response = await _client.PostAsSnakeCaseJsonAsync("/api/Auth/register", dto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadFromJsonAsync<AuthResponseDto>(TestHelpers.SnakeCaseJson);
        content.Should().NotBeNull();
        content!.Token.Should().NotBeNullOrEmpty();
        content.PhoneNumber.Should().Be("+244923000001");
    }

    [Fact]
    public async Task Register_WithExistingPhone_ReturnsBadRequest()
    {
        // Arrange
        _factory.MockUserRepository
            .Setup(r => r.GetByPhoneNumberAsync("+244923000002"))
            .ReturnsAsync(new User
            {
                Id = "existing-id",
                PhoneNumber = "+244923000002",
                Name = "Existing",
                ReputationScore = 50,
                CreatedAt = DateTime.UtcNow
            });

        var dto = new CreateUserDto("+244923000002", "Duplicate User");

        // Act
        var response = await _client.PostAsSnakeCaseJsonAsync("/api/Auth/register", dto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Login_WithExistingUser_ReturnsToken()
    {
        // Arrange
        _factory.MockUserRepository
            .Setup(r => r.GetByPhoneNumberAsync("+244923000003"))
            .ReturnsAsync(new User
            {
                Id = "user-123",
                PhoneNumber = "+244923000003",
                Name = "Login User",
                ReputationScore = 75,
                CreatedAt = DateTime.UtcNow
            });

        var dto = new LoginDto("+244923000003");

        // Act
        var response = await _client.PostAsSnakeCaseJsonAsync("/api/Auth/login", dto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadFromJsonAsync<AuthResponseDto>(TestHelpers.SnakeCaseJson);
        content.Should().NotBeNull();
        content!.Token.Should().NotBeNullOrEmpty();
        content.UserId.Should().Be("user-123");
    }

    [Fact]
    public async Task Login_WithNonExistentUser_ReturnsUnauthorized()
    {
        // Arrange
        _factory.MockUserRepository
            .Setup(r => r.GetByPhoneNumberAsync("+244923000004"))
            .ReturnsAsync((User?)null);

        var dto = new LoginDto("+244923000004");

        // Act
        var response = await _client.PostAsSnakeCaseJsonAsync("/api/Auth/login", dto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}

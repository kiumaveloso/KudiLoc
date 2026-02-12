using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using ATMLocator.Application.DTOs;
using ATMLocator.Core.Entities;
using FluentAssertions;
using Moq;
using Xunit;

namespace ATMLocator.Tests.Integration;

public class UserControllerTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly CustomWebApplicationFactory _factory;

    public UserControllerTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    private async Task<string> GetAuthToken()
    {
        _factory.MockUserRepository
            .Setup(r => r.GetByPhoneNumberAsync("+244923111111"))
            .ReturnsAsync(new User
            {
                Id = "auth-user",
                PhoneNumber = "+244923111111",
                Name = "Auth User",
                ReputationScore = 80,
                CreatedAt = DateTime.UtcNow
            });

        var response = await _client.PostAsJsonAsync("/api/Auth/login", new LoginDto("+244923111111"));
        var auth = await response.Content.ReadFromJsonAsync<AuthResponseDto>();
        return auth!.Token;
    }

    [Fact]
    public async Task GetUserById_WithoutAuth_ReturnsUnauthorized()
    {
        var response = await _client.GetAsync("/api/User/user1");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetUserById_WhenExists_ReturnsOk()
    {
        var token = await GetAuthToken();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        _factory.MockUserRepository
            .Setup(r => r.GetByIdAsync("user1"))
            .ReturnsAsync(new User
            {
                Id = "user1", PhoneNumber = "+244923000001",
                Name = "Test User", ReputationScore = 75, CreatedAt = DateTime.UtcNow
            });

        var response = await _client.GetAsync("/api/User/user1");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        _client.DefaultRequestHeaders.Authorization = null;
    }

    [Fact]
    public async Task GetUserById_WhenNotFound_ReturnsNotFound()
    {
        var token = await GetAuthToken();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        _factory.MockUserRepository
            .Setup(r => r.GetByIdAsync("nonexistent"))
            .ReturnsAsync((User?)null);

        var response = await _client.GetAsync("/api/User/nonexistent");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);

        _client.DefaultRequestHeaders.Authorization = null;
    }

    [Fact]
    public async Task UpdateUser_WithAuth_ReturnsOk()
    {
        var token = await GetAuthToken();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var user = new User
        {
            Id = "user1", PhoneNumber = "+244923000001",
            Name = "Old Name", ReputationScore = 50, CreatedAt = DateTime.UtcNow
        };

        _factory.MockUserRepository.Setup(r => r.GetByIdAsync("user1")).ReturnsAsync(user);
        _factory.MockUserRepository.Setup(r => r.UpdateAsync(It.IsAny<User>()))
            .ReturnsAsync((User u) => u);

        var response = await _client.PutAsJsonAsync("/api/User/user1", new UpdateUserDto("New Name"));

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        _client.DefaultRequestHeaders.Authorization = null;
    }

    [Fact]
    public async Task DeleteUser_WithAuth_WhenExists_ReturnsNoContent()
    {
        var token = await GetAuthToken();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        _factory.MockUserRepository.Setup(r => r.DeleteAsync("user1")).ReturnsAsync(true);

        var response = await _client.DeleteAsync("/api/User/user1");

        response.StatusCode.Should().Be(HttpStatusCode.NoContent);

        _client.DefaultRequestHeaders.Authorization = null;
    }

    [Fact]
    public async Task DeleteUser_WithAuth_WhenNotFound_ReturnsNotFound()
    {
        var token = await GetAuthToken();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        _factory.MockUserRepository.Setup(r => r.DeleteAsync("nonexistent")).ReturnsAsync(false);

        var response = await _client.DeleteAsync("/api/User/nonexistent");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);

        _client.DefaultRequestHeaders.Authorization = null;
    }
}

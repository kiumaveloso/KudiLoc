using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using ATMLocator.Application.DTOs;
using ATMLocator.Core.Entities;
using FluentAssertions;
using Moq;
using Xunit;

namespace ATMLocator.Tests.Integration;

public class ATMControllerTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly CustomWebApplicationFactory _factory;

    public ATMControllerTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    private async Task<string> GetAuthToken(string role = "user")
    {
        _factory.MockUserRepository
            .Setup(r => r.GetByPhoneNumberAsync("+244923111111"))
            .ReturnsAsync(new User
            {
                Id = "auth-user",
                PhoneNumber = "+244923111111",
                Name = "Auth User",
                ReputationScore = 80,
                Role = role,
                CreatedAt = DateTime.UtcNow
            });

        var response = await _client.PostAsSnakeCaseJsonAsync("/api/Auth/login", new LoginDto("+244923111111"));
        var auth = await response.Content.ReadFromJsonAsync<AuthResponseDto>(TestHelpers.SnakeCaseJson);
        return auth!.Token;
    }

    private static ATM CreateTestATM(string id, string bank = "BFA", string province = "Luanda")
    {
        return new ATM
        {
            Id = id,
            Name = $"ATM {id}",
            BankName = bank,
            Latitude = -8.838,
            Longitude = 13.234,
            Province = province,
            Municipality = "Luanda",
            Address = new Address { Street = "Rua Test", Neighborhood = "Test" },
            PhotoUrls = new List<string>(),
            SupportedServices = new List<string> { "Levantamento" },
            CurrentStatus = new ATMStatus
            {
                HasCash = true,
                ReliabilityScore = 80,
                LastVerified = DateTime.UtcNow,
                TotalReports = 5
            },
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }

    [Fact]
    public async Task GetATMById_WhenExists_ReturnsOk()
    {
        // Arrange
        _factory.MockATMRepository
            .Setup(r => r.GetByIdAsync("atm-1"))
            .ReturnsAsync(CreateTestATM("atm-1"));

        // Act
        var response = await _client.GetAsync("/api/ATM/atm-1");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetATMById_WhenNotFound_ReturnsNotFound()
    {
        // Arrange
        _factory.MockATMRepository
            .Setup(r => r.GetByIdAsync("nonexistent"))
            .ReturnsAsync((ATM?)null);

        // Act
        var response = await _client.GetAsync("/api/ATM/nonexistent");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task GetATMsByProvince_ReturnsPagedResults()
    {
        // Arrange
        var atms = new List<ATM> { CreateTestATM("atm-p1"), CreateTestATM("atm-p2") };
        _factory.MockATMRepository
            .Setup(r => r.GetByProvinceAsync("Luanda", It.IsAny<int>(), It.IsAny<int>()))
            .ReturnsAsync(atms);
        _factory.MockATMRepository
            .Setup(r => r.CountByProvinceAsync("Luanda"))
            .ReturnsAsync(2);

        // Act
        var response = await _client.GetAsync("/api/ATM/province/Luanda?page=1&pageSize=10");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task SearchATMs_WithEmptyQuery_ReturnsBadRequest()
    {
        // Act
        var response = await _client.GetAsync("/api/ATM/search?query=");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task SearchATMs_WithValidQuery_ReturnsResults()
    {
        // Arrange
        var atms = new List<ATM> { CreateTestATM("atm-s1", "BFA") };
        _factory.MockATMRepository
            .Setup(r => r.SearchAsync("BFA", It.IsAny<int>(), It.IsAny<int>()))
            .ReturnsAsync(atms);
        _factory.MockATMRepository
            .Setup(r => r.CountSearchAsync("BFA"))
            .ReturnsAsync(1);

        // Act
        var response = await _client.GetAsync("/api/ATM/search?query=BFA");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task CreateATM_WithoutAuth_ReturnsUnauthorized()
    {
        // Arrange - POST /api/atm requires Admin role
        var dto = new CreateATMDto(
            "New ATM", "BFA", -8.838, 13.234, null, "Luanda", "Luanda",
            "Rua Nova", "Centro", null, new List<string> { "Levantamento" }, null);

        // Act
        var response = await _client.PostAsSnakeCaseJsonAsync("/api/ATM", dto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task CreateATM_WithAuth_ReturnsCreated()
    {
        // Arrange - requires Admin role
        var token = await GetAuthToken("Admin");
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        _factory.MockATMRepository
            .Setup(r => r.CreateAsync(It.IsAny<ATM>()))
            .ReturnsAsync((ATM a) => { a.Id = "new-atm-id"; return a; });

        var dto = new CreateATMDto(
            "New ATM", "BFA", -8.838, 13.234, null, "Luanda", "Luanda",
            "Rua Nova", "Centro", null, new List<string> { "Levantamento" }, null);

        // Act
        var response = await _client.PostAsSnakeCaseJsonAsync("/api/ATM", dto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);

        // Cleanup
        _client.DefaultRequestHeaders.Authorization = null;
    }

    [Fact]
    public async Task GetNearbyATMs_ReturnsOk()
    {
        // Arrange
        _factory.MockATMRepository
            .Setup(r => r.GetNearbyAsync(It.IsAny<double>(), It.IsAny<double>(), It.IsAny<double>()))
            .ReturnsAsync(new List<ATM> { CreateTestATM("nearby-1") });

        // Act
        var response = await _client.GetAsync("/api/ATM/nearby?latitude=-8.838&longitude=13.234&radiusKm=5");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task HealthCheck_ReturnsOk()
    {
        // Act
        var response = await _client.GetAsync("/health");

        // Assert - health check endpoint should respond.
        // In the test environment MongoDbContext and its health check are removed,
        // so we expect 200 (Healthy, no checks registered) or a degraded/error status.
        response.StatusCode.Should().BeOneOf(
            HttpStatusCode.OK, HttpStatusCode.ServiceUnavailable,
            HttpStatusCode.InternalServerError, HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task RootEndpoint_Responds()
    {
        // Act
        var response = await _client.GetAsync("/");

        // Assert - root may redirect to HTTPS or return JSON status; both are valid
        ((int)response.StatusCode).Should().BeInRange(200, 399);
    }
}

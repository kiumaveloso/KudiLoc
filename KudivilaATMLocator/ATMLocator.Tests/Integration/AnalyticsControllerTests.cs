using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using ATMLocator.Application.DTOs;
using ATMLocator.Core.Entities;
using FluentAssertions;
using Moq;
using Xunit;

namespace ATMLocator.Tests.Integration;

public class AnalyticsControllerTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly CustomWebApplicationFactory _factory;

    public AnalyticsControllerTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    private async Task<string> GetAdminAuthToken()
    {
        _factory.MockUserRepository
            .Setup(r => r.GetByPhoneNumberAsync("+244923111111"))
            .ReturnsAsync(new User
            {
                Id = "admin-user",
                PhoneNumber = "+244923111111",
                Name = "Admin User",
                ReputationScore = 100,
                Role = "admin",
                CreatedAt = DateTime.UtcNow
            });

        var response = await _client.PostAsSnakeCaseJsonAsync("/api/Auth/login", new LoginDto("+244923111111"));
        var auth = await response.Content.ReadFromJsonAsync<AuthResponseDto>(TestHelpers.SnakeCaseJson);
        return auth!.Token;
    }

    [Fact]
    public async Task GetSystemStats_WithoutAuth_ReturnsUnauthorized()
    {
        // Act — stats endpoint requires Admin role
        var response = await _client.GetAsync("/api/Analytics/stats");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetSystemStats_WithAdminAuth_ReturnsOk()
    {
        // Arrange
        var token = await GetAdminAuthToken();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        _factory.MockATMRepository
            .Setup(r => r.CountAllAsync())
            .ReturnsAsync(10);
        _factory.MockATMRepository
            .Setup(r => r.GetAllAsync())
            .ReturnsAsync(new List<ATM>
            {
                new ATM
                {
                    Id = "1", Name = "ATM 1", BankName = "BFA",
                    Latitude = -8.8, Longitude = 13.2,
                    Province = "Luanda", Municipality = "Luanda",
                    Address = new Address { Street = "Test", Neighborhood = "Test" },
                    PhotoUrls = new List<string>(),
                    SupportedServices = new List<string>(),
                    CurrentStatus = new ATMStatus { HasCash = true, ReliabilityScore = 80, TotalReports = 5 },
                    CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow
                }
            });
        _factory.MockStatusReportRepository
            .Setup(r => r.CountAllAsync())
            .ReturnsAsync(50);
        _factory.MockUserRepository
            .Setup(r => r.CountAllAsync())
            .ReturnsAsync(20);

        // Act
        var response = await _client.GetAsync("/api/Analytics/stats");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        _client.DefaultRequestHeaders.Authorization = null;
    }

    [Fact]
    public async Task GetATMActivity_WhenATMExists_ReturnsOk()
    {
        // Arrange
        var atm = new ATM
        {
            Id = "atm-activity",
            Name = "Activity ATM",
            BankName = "BAI",
            Latitude = -8.8,
            Longitude = 13.2,
            Province = "Luanda",
            Municipality = "Luanda",
            Address = new Address { Street = "Test", Neighborhood = "Test" },
            PhotoUrls = new List<string>(),
            SupportedServices = new List<string>(),
            CurrentStatus = new ATMStatus { HasCash = true, ReliabilityScore = 80, TotalReports = 5 },
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _factory.MockATMRepository
            .Setup(r => r.GetByIdAsync("atm-activity"))
            .ReturnsAsync(atm);
        _factory.MockStatusReportRepository
            .Setup(r => r.GetByATMIdAsync("atm-activity", It.IsAny<int>(), It.IsAny<int>()))
            .ReturnsAsync(new List<StatusReport>());
        _factory.MockStatusReportRepository
            .Setup(r => r.GetRecentReportsAsync("atm-activity", It.IsAny<TimeSpan>()))
            .ReturnsAsync(new List<StatusReport>());
        _factory.MockStatusReportRepository
            .Setup(r => r.CountByATMIdAsync("atm-activity"))
            .ReturnsAsync(0);

        // Act
        var response = await _client.GetAsync("/api/Analytics/atm/atm-activity/activity");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetATMActivity_WhenATMNotFound_ReturnsNotFound()
    {
        // Arrange
        _factory.MockATMRepository
            .Setup(r => r.GetByIdAsync("nonexistent"))
            .ReturnsAsync((ATM?)null);

        // Act
        var response = await _client.GetAsync("/api/Analytics/atm/nonexistent/activity");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}

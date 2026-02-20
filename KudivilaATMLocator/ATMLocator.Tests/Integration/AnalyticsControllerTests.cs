using System.Net;
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

    [Fact]
    public async Task GetSystemStats_ReturnsOk()
    {
        // Arrange
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
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("totalATMs");
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

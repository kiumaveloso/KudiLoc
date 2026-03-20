using Xunit;
using Moq;
using FluentAssertions;
using ATMLocator.Application.Services;
using ATMLocator.Core.Interfaces;
using ATMLocator.Core.Entities;
using ATMLocator.Core.Settings;
using ATMLocator.Application.DTOs;
using Microsoft.Extensions.Options;

namespace ATMLocator.Tests;

public class ATMServiceTests
{
    private readonly Mock<IATMRepository> _mockRepo;
    private readonly ATMService _service;

    public ATMServiceTests()
    {
        _mockRepo = new Mock<IATMRepository>();
        var settings = Options.Create(new ATMSettings());
        _service = new ATMService(_mockRepo.Object, settings);
    }

    private ATM CreateTestATM(string id, string name, bool hasCash, int reliabilityScore)
    {
        return new ATM
        {
            Id = id,
            Name = name,
            BankName = "BFA",
            Latitude = -8.8,
            Longitude = 13.2,
            Province = "Luanda",
            Municipality = "Luanda",
            Address = new Address { Street = "Test St", Neighborhood = "Test" },
            PhotoUrls = new List<string>(),
            SupportedServices = new List<string> { "Levantamento" },
            CurrentStatus = new ATMStatus
            {
                HasCash = hasCash,
                ReliabilityScore = reliabilityScore,
                LastVerified = DateTime.UtcNow,
                TotalReports = 5
            },
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }

    [Fact]
    public async Task GetNearbyATMsWithCash_OnlyReturnsATMsWithCash()
    {
        // Arrange
        var testATMs = new List<ATM>
        {
            CreateTestATM("1", "ATM With Cash", hasCash: true, reliabilityScore: 80),
            CreateTestATM("2", "ATM Without Cash", hasCash: false, reliabilityScore: 50)
        };

        _mockRepo.Setup(r => r.GetNearbyAsync(
            It.IsAny<double>(), It.IsAny<double>(), It.IsAny<double>()))
            .ReturnsAsync(testATMs);

        // Act
        var result = await _service.GetNearbyATMsWithCashAsync(-8.8, 13.2, 10);

        // Assert
        result.Should().HaveCount(1);
        result[0].Name.Should().Be("ATM With Cash");
        result[0].Status.HasCash.Should().BeTrue();
    }

    [Fact]
    public async Task GetNearbyATMsWithCash_FiltersLowReliabilityATMs()
    {
        // Arrange
        var testATMs = new List<ATM>
        {
            CreateTestATM("1", "High Reliability", hasCash: true, reliabilityScore: 80),
            CreateTestATM("2", "Low Reliability", hasCash: true, reliabilityScore: 25)
        };

        _mockRepo.Setup(r => r.GetNearbyAsync(
            It.IsAny<double>(), It.IsAny<double>(), It.IsAny<double>()))
            .ReturnsAsync(testATMs);

        // Act
        var result = await _service.GetNearbyATMsWithCashAsync(-8.8, 13.2, 10);

        // Assert
        result.Should().HaveCount(1);
        result[0].Name.Should().Be("High Reliability");
        result[0].Status.ReliabilityScore.Should().BeGreaterThanOrEqualTo(30);
    }

    [Fact]
    public async Task GetNearbyATMsWithCash_SortsByReliabilityScore()
    {
        // Arrange
        var testATMs = new List<ATM>
        {
            CreateTestATM("1", "Medium", hasCash: true, reliabilityScore: 50),
            CreateTestATM("2", "High", hasCash: true, reliabilityScore: 90),
            CreateTestATM("3", "Low", hasCash: true, reliabilityScore: 40)
        };

        _mockRepo.Setup(r => r.GetNearbyAsync(
            It.IsAny<double>(), It.IsAny<double>(), It.IsAny<double>()))
            .ReturnsAsync(testATMs);

        // Act
        var result = await _service.GetNearbyATMsWithCashAsync(-8.8, 13.2, 10);

        // Assert
        result.Should().HaveCount(3);
        result[0].Status.ReliabilityScore.Should().Be(90);
        result[1].Status.ReliabilityScore.Should().Be(50);
        result[2].Status.ReliabilityScore.Should().Be(40);
    }

    [Fact]
    public async Task GetATMById_WhenExists_ReturnsATM()
    {
        // Arrange
        var expectedATM = CreateTestATM("atm123", "Test ATM", true, 75);
        _mockRepo.Setup(r => r.GetByIdAsync("atm123")).ReturnsAsync(expectedATM);

        // Act
        var result = await _service.GetATMByIdAsync("atm123");

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be("atm123");
        result.Name.Should().Be("Test ATM");
    }

    [Fact]
    public async Task GetATMById_WhenNotExists_ReturnsNull()
    {
        // Arrange
        _mockRepo.Setup(r => r.GetByIdAsync(It.IsAny<string>())).ReturnsAsync((ATM?)null);

        // Act
        var result = await _service.GetATMByIdAsync("nonexistent");

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task CreateATM_CreatesWithDefaultValues()
    {
        // Arrange
        var dto = new CreateATMDto(
            "New ATM",
            "BFA",
            -8.8383,
            13.2344,
            null,
            "Luanda",
            "Talatona",
            "Rua Principal",
            "Talatona",
            "Shopping Xyami",
            new List<string> { "Levantamento", "Depósito" },
            null
        );

        _mockRepo.Setup(r => r.CreateAsync(It.IsAny<ATM>()))
            .ReturnsAsync((ATM atm) => atm);

        // Act
        var result = await _service.CreateATMAsync(dto);

        // Assert
        result.Should().NotBeNull();
        result.Name.Should().Be("New ATM");
        result.Status.HasCash.Should().BeFalse(); // Default is false
        result.Status.ReliabilityScore.Should().Be(50); // Default is 50
        _mockRepo.Verify(r => r.CreateAsync(It.IsAny<ATM>()), Times.Once);
    }

    [Fact]
    public async Task SearchATMs_ReturnsMatchingATMs()
    {
        // Arrange
        var testATMs = new List<ATM>
        {
            CreateTestATM("1", "BFA Talatona", true, 80),
            CreateTestATM("2", "BAI Kilamba", true, 75)
        };

        _mockRepo.Setup(r => r.SearchAsync("BFA", It.IsAny<int>(), It.IsAny<int>()))
            .ReturnsAsync(new List<ATM> { testATMs[0] });
        _mockRepo.Setup(r => r.CountSearchAsync("BFA")).ReturnsAsync(1);

        // Act
        var result = await _service.SearchATMsAsync("BFA");

        // Assert
        result.Items.Should().HaveCount(1);
        result.Items[0].Name.Should().Contain("BFA");
    }

    [Fact]
    public async Task GetATMsByProvince_ReturnsOnlyFromThatProvince()
    {
        // Arrange
        var testATMs = new List<ATM>
        {
            CreateTestATM("1", "ATM Luanda", true, 80),
            CreateTestATM("2", "ATM Luanda 2", true, 75)
        };

        _mockRepo.Setup(r => r.GetByProvinceAsync("Luanda", It.IsAny<int>(), It.IsAny<int>()))
            .ReturnsAsync(testATMs);
        _mockRepo.Setup(r => r.CountByProvinceAsync("Luanda")).ReturnsAsync(2);

        // Act
        var result = await _service.GetATMsByProvinceAsync("Luanda");

        // Assert
        result.Items.Should().HaveCount(2);
        result.Items.Should().AllSatisfy(atm => atm.Location.Province.Should().Be("Luanda"));
    }
}
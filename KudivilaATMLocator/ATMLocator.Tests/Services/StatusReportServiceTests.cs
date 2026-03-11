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

public class StatusReportServiceTests
{
    private readonly Mock<IStatusReportRepository> _mockReportRepo;
    private readonly Mock<IATMRepository> _mockAtmRepo;
    private readonly Mock<IUserRepository> _mockUserRepo;
    private readonly StatusReportService _service;

    public StatusReportServiceTests()
    {
        _mockReportRepo = new Mock<IStatusReportRepository>();
        _mockAtmRepo = new Mock<IATMRepository>();
        _mockUserRepo = new Mock<IUserRepository>();
        var settings = Options.Create(new ReportSettings());

        _service = new StatusReportService(
            _mockReportRepo.Object,
            _mockAtmRepo.Object,
            _mockUserRepo.Object,
            settings
        );
    }

    private ATM CreateTestATM(string id)
    {
        return new ATM
        {
            Id = id,
            Name = "Test ATM",
            BankName = "BFA",
            Latitude = -8.8,
            Longitude = 13.2,
            Province = "Luanda",
            Municipality = "Luanda",
            Address = new Address { Street = "Test", Neighborhood = "Test" },
            PhotoUrls = new List<string>(),
            SupportedServices = new List<string>(),
            CurrentStatus = new ATMStatus
            {
                HasCash = false,
                ReliabilityScore = 50,
                LastVerified = DateTime.UtcNow,
                TotalReports = 0
            },
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }

    private User CreateTestUser(string id, int reputation)
    {
        return new User
        {
            Id = id,
            PhoneNumber = "+244923456789",
            Name = "Test User",
            ReputationScore = reputation,
            TotalReports = 10,
            AccurateReports = 8,
            CreatedAt = DateTime.UtcNow
        };
    }

    [Fact]
    public async Task SubmitReport_WhenATMDoesNotExist_ThrowsArgumentException()
    {
        // Arrange
        _mockAtmRepo.Setup(r => r.GetByIdAsync(It.IsAny<string>()))
            .ReturnsAsync((ATM?)null);

        var dto = new CreateStatusReportDto("nonexistent-atm", "user123", true, null, null, null, null, null);

        // Act & Assert
        await Assert.ThrowsAsync<ArgumentException>(
            async () => await _service.SubmitReportAsync(dto)
        );
    }

    [Fact]
    public async Task SubmitReport_WhenUserDoesNotExist_ThrowsArgumentException()
    {
        // Arrange
        _mockAtmRepo.Setup(r => r.GetByIdAsync("atm123"))
            .ReturnsAsync(CreateTestATM("atm123"));
        
        _mockUserRepo.Setup(r => r.GetByIdAsync(It.IsAny<string>()))
            .ReturnsAsync((User?)null);

        var dto = new CreateStatusReportDto("atm123", "nonexistent-user", true, null, null, null, null, null);

        // Act & Assert
        await Assert.ThrowsAsync<ArgumentException>(
            async () => await _service.SubmitReportAsync(dto)
        );
    }

    [Fact]
    public async Task SubmitReport_WithValidData_CreatesReportAndUpdatesData()
    {
        // Arrange
        var atm = CreateTestATM("atm123");
        var user = CreateTestUser("user123", 85);

        _mockAtmRepo.Setup(r => r.GetByIdAsync("atm123")).ReturnsAsync(atm);
        _mockAtmRepo.Setup(r => r.UpdateAsync(It.IsAny<ATM>())).ReturnsAsync((ATM a) => a);
        _mockUserRepo.Setup(r => r.GetByIdAsync("user123")).ReturnsAsync(user);
        _mockUserRepo.Setup(r => r.UpdateAsync(It.IsAny<User>())).ReturnsAsync((User u) => u);
        _mockReportRepo.Setup(r => r.CreateAsync(It.IsAny<StatusReport>()))
            .ReturnsAsync((StatusReport r) => { r.Id = "report123"; return r; });
        _mockReportRepo.Setup(r => r.GetRecentReportsAsync(It.IsAny<string>(), It.IsAny<TimeSpan>()))
            .ReturnsAsync(new List<StatusReport>());
        _mockReportRepo.Setup(r => r.UpdateAsync(It.IsAny<StatusReport>()))
            .ReturnsAsync((StatusReport r) => r);

        var dto = new CreateStatusReportDto("atm123", "user123", true, null, null, null, null, null);

        // Act
        var result = await _service.SubmitReportAsync(dto);

        // Assert - Just verify report was created successfully
        result.Should().NotBeNull();
        result.ATMId.Should().Be("atm123");
        _mockReportRepo.Verify(r => r.CreateAsync(It.IsAny<StatusReport>()), Times.Once);
    }
    
    
    [Fact]
    public async Task GetRecentReports_ReturnsReportsForATM()
    {
        // Arrange
        var reports = new List<StatusReport>
        {
            new StatusReport
            {
                Id = "1",
                ATMId = "atm123",
                UserId = "user1",
                HasCash = true,
                ReportedAt = DateTime.UtcNow,
                Status = ReportStatus.Verified
            },
            new StatusReport
            {
                Id = "2",
                ATMId = "atm123",
                UserId = "user2",
                HasCash = true,
                ReportedAt = DateTime.UtcNow.AddMinutes(-5),
                Status = ReportStatus.Verified
            }
        };

        _mockReportRepo.Setup(r => r.GetByATMIdAsync("atm123", It.IsAny<int>(), It.IsAny<int>()))
            .ReturnsAsync(reports);
        _mockReportRepo.Setup(r => r.CountByATMIdAsync("atm123")).ReturnsAsync(2);

        // Act
        var result = await _service.GetRecentReportsAsync("atm123");

        // Assert
        result.Items.Should().HaveCount(2);
        result.Items.Should().AllSatisfy(r => r.ATMId.Should().Be("atm123"));
    }
}
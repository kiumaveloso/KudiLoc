using Xunit;
using Moq;
using FluentAssertions;
using ATMLocator.Application.Services;
using ATMLocator.Core.Interfaces;
using ATMLocator.Core.Entities;

namespace ATMLocator.Tests;

public class AnalyticsServiceTests
{
    private readonly Mock<IATMRepository> _mockAtmRepo;
    private readonly Mock<IStatusReportRepository> _mockReportRepo;
    private readonly Mock<IUserRepository> _mockUserRepo;
    private readonly AnalyticsService _service;

    public AnalyticsServiceTests()
    {
        _mockAtmRepo = new Mock<IATMRepository>();
        _mockReportRepo = new Mock<IStatusReportRepository>();
        _mockUserRepo = new Mock<IUserRepository>();
        _service = new AnalyticsService(_mockAtmRepo.Object, _mockReportRepo.Object, _mockUserRepo.Object);
    }

    private static ATM CreateATM(string id, string bank, string province, bool hasCash, int reliability)
    {
        return new ATM
        {
            Id = id, Name = $"ATM {id}", BankName = bank,
            Latitude = -8.8, Longitude = 13.2,
            Province = province, Municipality = province,
            Address = new Address { Street = "Test", Neighborhood = "Test" },
            PhotoUrls = [], SupportedServices = [],
            CurrentStatus = new ATMStatus
            {
                HasCash = hasCash, ReliabilityScore = reliability,
                LastVerified = DateTime.UtcNow, TotalReports = 5
            },
            CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow
        };
    }

    [Fact]
    public async Task GetSystemStats_ReturnsCorrectCounts()
    {
        var atms = new List<ATM>
        {
            CreateATM("1", "BAI", "Luanda", true, 80),
            CreateATM("2", "BFA", "Luanda", false, 50),
            CreateATM("3", "BAI", "Benguela", true, 90),
        };

        _mockAtmRepo.Setup(r => r.CountAllAsync()).ReturnsAsync(3);
        _mockAtmRepo.Setup(r => r.GetAllAsync()).ReturnsAsync(atms);
        _mockReportRepo.Setup(r => r.CountAllAsync()).ReturnsAsync(100);
        _mockUserRepo.Setup(r => r.CountAllAsync()).ReturnsAsync(25);

        var result = await _service.GetSystemStatsAsync();

        result.TotalATMs.Should().Be(3);
        result.TotalReports.Should().Be(100);
        result.TotalUsers.Should().Be(25);
        result.ATMsWithCash.Should().Be(2);
        result.ATMsWithoutCash.Should().Be(1);
        result.HighReliabilityATMs.Should().Be(2);
    }

    [Fact]
    public async Task GetSystemStats_GroupsByProvinceAndBank()
    {
        var atms = new List<ATM>
        {
            CreateATM("1", "BAI", "Luanda", true, 80),
            CreateATM("2", "BAI", "Luanda", false, 50),
            CreateATM("3", "BFA", "Benguela", true, 90),
        };

        _mockAtmRepo.Setup(r => r.CountAllAsync()).ReturnsAsync(3);
        _mockAtmRepo.Setup(r => r.GetAllAsync()).ReturnsAsync(atms);
        _mockReportRepo.Setup(r => r.CountAllAsync()).ReturnsAsync(0);
        _mockUserRepo.Setup(r => r.CountAllAsync()).ReturnsAsync(0);

        var result = await _service.GetSystemStatsAsync();

        result.ByProvince.Should().HaveCount(2);
        result.ByProvince.First(p => p.Province == "Luanda").TotalATMs.Should().Be(2);
        result.ByBank.Should().HaveCount(2);
        result.ByBank.First(b => b.BankName == "BAI").TotalATMs.Should().Be(2);
    }

    [Fact]
    public async Task GetATMActivity_WhenATMNotFound_ThrowsArgumentException()
    {
        _mockAtmRepo.Setup(r => r.GetByIdAsync("missing")).ReturnsAsync((ATM?)null);

        await Assert.ThrowsAsync<ArgumentException>(
            () => _service.GetATMActivityAsync("missing"));
    }

    [Fact]
    public async Task GetATMActivity_ReturnsActivityData()
    {
        var atm = CreateATM("atm1", "BAI", "Luanda", true, 85);
        var reports = new List<StatusReport>
        {
            new() { Id = "r1", ATMId = "atm1", UserId = "u1", HasCash = true,
                     ReportedAt = DateTime.UtcNow, Status = ReportStatus.Verified }
        };

        _mockAtmRepo.Setup(r => r.GetByIdAsync("atm1")).ReturnsAsync(atm);
        _mockReportRepo.Setup(r => r.GetRecentReportsAsync("atm1", It.IsAny<TimeSpan>())).ReturnsAsync(reports);
        _mockReportRepo.Setup(r => r.GetByATMIdAsync("atm1", It.IsAny<int>(), It.IsAny<int>())).ReturnsAsync(reports);
        _mockReportRepo.Setup(r => r.CountByATMIdAsync("atm1")).ReturnsAsync(1);

        var result = await _service.GetATMActivityAsync("atm1");

        result.ATMId.Should().Be("atm1");
        result.CurrentHasCash.Should().BeTrue();
        result.ReliabilityScore.Should().Be(85);
        result.ReportsLast24Hours.Should().Be(1);
        result.RecentReports.Should().HaveCount(1);
    }
}

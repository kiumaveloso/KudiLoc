using Xunit;
using Moq;
using FluentAssertions;
using ATMLocator.Application.Services;
using ATMLocator.Core.Interfaces;
using ATMLocator.Core.Entities;

namespace ATMLocator.Tests;

public class BadgeServiceTests
{
    private readonly Mock<IBadgeRepository> _mockBadgeRepo;
    private readonly Mock<IUserRepository> _mockUserRepo;
    private readonly Mock<IATMRepository> _mockAtmRepo;
    private readonly Mock<IVisitHistoryRepository> _mockVisitRepo;
    private readonly BadgeService _service;

    public BadgeServiceTests()
    {
        _mockBadgeRepo = new Mock<IBadgeRepository>();
        _mockUserRepo = new Mock<IUserRepository>();
        _mockAtmRepo = new Mock<IATMRepository>();
        _mockVisitRepo = new Mock<IVisitHistoryRepository>();

        _service = new BadgeService(
            _mockBadgeRepo.Object,
            _mockUserRepo.Object,
            _mockAtmRepo.Object,
            _mockVisitRepo.Object
        );
    }

    private User CreateUser(string id, int totalReports, int accurateReports)
    {
        return new User
        {
            Id = id,
            PhoneNumber = "+244923456789",
            Name = "Test User",
            ReputationScore = 50,
            TotalReports = totalReports,
            AccurateReports = accurateReports,
            CreatedAt = DateTime.UtcNow
        };
    }

    [Fact]
    public async Task CheckAndAwardBadges_WhenUserHas10Reports_AwardsBronzeContributor()
    {
        // Arrange
        var user = CreateUser("user1", 10, 8);
        _mockUserRepo.Setup(r => r.GetByIdAsync("user1")).ReturnsAsync(user);
        _mockBadgeRepo.Setup(r => r.ExistsAsync(It.IsAny<string>(), It.IsAny<BadgeType>()))
            .ReturnsAsync(false);
        _mockBadgeRepo.Setup(r => r.CreateAsync(It.IsAny<Badge>()))
            .ReturnsAsync((Badge b) => b);
        _mockAtmRepo.Setup(r => r.CountByCreatedByAsync("user1")).ReturnsAsync(0);
        _mockVisitRepo.Setup(r => r.CountUniqueATMsVisitedAsync("user1")).ReturnsAsync(0);

        // Act
        await _service.CheckAndAwardBadgesAsync("user1");

        // Assert
        _mockBadgeRepo.Verify(r => r.CreateAsync(
            It.Is<Badge>(b => b.BadgeType == BadgeType.BronzeContributor && b.UserId == "user1")
        ), Times.Once);
    }

    [Fact]
    public async Task CheckAndAwardBadges_WhenBadgeAlreadyExists_DoesNotAwardAgain()
    {
        // Arrange
        var user = CreateUser("user1", 10, 8);
        _mockUserRepo.Setup(r => r.GetByIdAsync("user1")).ReturnsAsync(user);
        // ExistsAsync returns true for BronzeContributor — already awarded
        _mockBadgeRepo.Setup(r => r.ExistsAsync("user1", BadgeType.BronzeContributor))
            .ReturnsAsync(true);
        _mockBadgeRepo.Setup(r => r.ExistsAsync("user1", It.Is<BadgeType>(bt => bt != BadgeType.BronzeContributor)))
            .ReturnsAsync(false);
        _mockBadgeRepo.Setup(r => r.CreateAsync(It.IsAny<Badge>()))
            .ReturnsAsync((Badge b) => b);
        _mockAtmRepo.Setup(r => r.CountByCreatedByAsync("user1")).ReturnsAsync(0);
        _mockVisitRepo.Setup(r => r.CountUniqueATMsVisitedAsync("user1")).ReturnsAsync(0);

        // Act
        await _service.CheckAndAwardBadgesAsync("user1");

        // Assert — BronzeContributor must NOT be created again
        _mockBadgeRepo.Verify(r => r.CreateAsync(
            It.Is<Badge>(b => b.BadgeType == BadgeType.BronzeContributor)
        ), Times.Never);
    }

    [Fact]
    public async Task CheckAndAwardBadges_WhenAccuracyAbove90PercentWith20Reports_AwardsReliable()
    {
        // Arrange — 20 total, 19 accurate = 95% accuracy
        var user = CreateUser("user2", 20, 19);
        _mockUserRepo.Setup(r => r.GetByIdAsync("user2")).ReturnsAsync(user);
        _mockBadgeRepo.Setup(r => r.ExistsAsync(It.IsAny<string>(), It.IsAny<BadgeType>()))
            .ReturnsAsync(false);
        _mockBadgeRepo.Setup(r => r.CreateAsync(It.IsAny<Badge>()))
            .ReturnsAsync((Badge b) => b);
        _mockAtmRepo.Setup(r => r.CountByCreatedByAsync("user2")).ReturnsAsync(0);
        _mockVisitRepo.Setup(r => r.CountUniqueATMsVisitedAsync("user2")).ReturnsAsync(0);

        // Act
        await _service.CheckAndAwardBadgesAsync("user2");

        // Assert
        _mockBadgeRepo.Verify(r => r.CreateAsync(
            It.Is<Badge>(b => b.BadgeType == BadgeType.Reliable && b.UserId == "user2")
        ), Times.Once);
    }

    [Fact]
    public async Task CheckAndAwardBadges_WhenAccuracyBelow90Percent_DoesNotAwardReliable()
    {
        // Arrange — 20 total, 15 accurate = 75% accuracy
        var user = CreateUser("user3", 20, 15);
        _mockUserRepo.Setup(r => r.GetByIdAsync("user3")).ReturnsAsync(user);
        _mockBadgeRepo.Setup(r => r.ExistsAsync(It.IsAny<string>(), It.IsAny<BadgeType>()))
            .ReturnsAsync(false);
        _mockBadgeRepo.Setup(r => r.CreateAsync(It.IsAny<Badge>()))
            .ReturnsAsync((Badge b) => b);
        _mockAtmRepo.Setup(r => r.CountByCreatedByAsync("user3")).ReturnsAsync(0);
        _mockVisitRepo.Setup(r => r.CountUniqueATMsVisitedAsync("user3")).ReturnsAsync(0);

        // Act
        await _service.CheckAndAwardBadgesAsync("user3");

        // Assert
        _mockBadgeRepo.Verify(r => r.CreateAsync(
            It.Is<Badge>(b => b.BadgeType == BadgeType.Reliable)
        ), Times.Never);
    }
}

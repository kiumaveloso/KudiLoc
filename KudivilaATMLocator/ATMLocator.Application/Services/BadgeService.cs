using ATMLocator.Core.Entities;
using ATMLocator.Core.Interfaces;
using ATMLocator.Application.DTOs;

namespace ATMLocator.Application.Services;

public interface IBadgeService
{
    Task<List<BadgeDto>> GetUserBadgesAsync(string userId);
    Task CheckAndAwardBadgesAsync(string userId);
    Task<List<LeaderboardEntryDto>> GetLeaderboardAsync(int limit = 20);
}

public class BadgeService : IBadgeService
{
    private readonly IBadgeRepository _badgeRepository;
    private readonly IUserRepository _userRepository;
    private readonly IATMRepository _atmRepository;
    private readonly IVisitHistoryRepository _visitHistoryRepository;

    public BadgeService(
        IBadgeRepository badgeRepository,
        IUserRepository userRepository,
        IATMRepository atmRepository,
        IVisitHistoryRepository visitHistoryRepository)
    {
        _badgeRepository = badgeRepository;
        _userRepository = userRepository;
        _atmRepository = atmRepository;
        _visitHistoryRepository = visitHistoryRepository;
    }

    public async Task<List<BadgeDto>> GetUserBadgesAsync(string userId)
    {
        var badges = await _badgeRepository.GetByUserIdAsync(userId);
        return badges.Select(MapToDto).ToList();
    }

    /// <summary>
    /// Evaluates user activity and awards badges based on report count, accuracy, etc.
    /// Called after each status report submission for authenticated users.
    /// </summary>
    public async Task CheckAndAwardBadgesAsync(string userId)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null) return;

        // BronzeContributor: 10+ total_reports
        if (user.TotalReports >= 10)
            await TryAwardBadgeAsync(userId, BadgeType.BronzeContributor);

        // SilverContributor: 50+ total_reports
        if (user.TotalReports >= 50)
            await TryAwardBadgeAsync(userId, BadgeType.SilverContributor);

        // GoldContributor: 100+ total_reports
        if (user.TotalReports >= 100)
            await TryAwardBadgeAsync(userId, BadgeType.GoldContributor);

        // Reliable: 90%+ accuracy with 20+ reports
        if (user.TotalReports >= 20 && user.AccurateReports > 0)
        {
            double accuracy = (double)user.AccurateReports / user.TotalReports;
            if (accuracy >= 0.9)
                await TryAwardBadgeAsync(userId, BadgeType.Reliable);
        }

        // Pioneer: added 5+ ATMs
        var atmsAdded = await _atmRepository.CountByCreatedByAsync(userId);
        if (atmsAdded >= 5) await TryAwardBadgeAsync(userId, BadgeType.Pioneer);

        // Explorer: visited 5+ unique ATMs
        var uniqueAtmsVisited = await _visitHistoryRepository.CountUniqueATMsVisitedAsync(userId);
        if (uniqueAtmsVisited >= 5) await TryAwardBadgeAsync(userId, BadgeType.Explorer);
    }

    /// <summary>
    /// Returns top users by total_reports with their earned badges.
    /// </summary>
    public async Task<List<LeaderboardEntryDto>> GetLeaderboardAsync(int limit = 20)
    {
        var topUsers = await _userRepository.GetTopByReportsAsync(limit);

        var entries = new List<LeaderboardEntryDto>();
        foreach (var user in topUsers)
        {
            var badges = await _badgeRepository.GetByUserIdAsync(user.Id);
            entries.Add(new LeaderboardEntryDto(
                user.Id,
                user.Name,
                user.TotalReports,
                user.AccurateReports,
                user.ReputationScore,
                badges.Select(MapToDto).ToList()
            ));
        }

        return entries;
    }

    private async Task TryAwardBadgeAsync(string userId, BadgeType badgeType)
    {
        if (await _badgeRepository.ExistsAsync(userId, badgeType))
            return;

        await _badgeRepository.CreateAsync(new Badge
        {
            UserId = userId,
            BadgeType = badgeType
        });
    }

    private static BadgeDto MapToDto(Badge badge)
    {
        return new BadgeDto(
            badge.Id,
            badge.UserId,
            badge.BadgeType.ToString(),
            badge.EarnedAt
        );
    }
}

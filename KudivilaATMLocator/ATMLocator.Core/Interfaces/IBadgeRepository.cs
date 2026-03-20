using ATMLocator.Core.Entities;

namespace ATMLocator.Core.Interfaces;

public interface IBadgeRepository
{
    Task<List<Badge>> GetByUserIdAsync(string userId);
    Task<Badge> CreateAsync(Badge badge);
    Task<bool> ExistsAsync(string userId, BadgeType badgeType);
}

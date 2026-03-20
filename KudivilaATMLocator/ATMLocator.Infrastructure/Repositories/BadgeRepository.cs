using ATMLocator.Core.Entities;
using ATMLocator.Core.Interfaces;
using ATMLocator.Infrastructure.Data;
using MongoDB.Driver;

namespace ATMLocator.Infrastructure.Repositories;

public class BadgeRepository : IBadgeRepository
{
    private readonly MongoDbContext _context;

    public BadgeRepository(MongoDbContext context)
    {
        _context = context;
    }

    public async Task<List<Badge>> GetByUserIdAsync(string userId)
    {
        return await _context.Badges
            .Find(b => b.UserId == userId)
            .SortByDescending(b => b.EarnedAt)
            .ToListAsync();
    }

    public async Task<Badge> CreateAsync(Badge badge)
    {
        badge.Id = Guid.NewGuid().ToString();
        badge.EarnedAt = DateTime.UtcNow;

        await _context.Badges.InsertOneAsync(badge);
        return badge;
    }

    public async Task<bool> ExistsAsync(string userId, BadgeType badgeType)
    {
        var count = await _context.Badges.CountDocumentsAsync(
            b => b.UserId == userId && b.BadgeType == badgeType
        );
        return count > 0;
    }
}

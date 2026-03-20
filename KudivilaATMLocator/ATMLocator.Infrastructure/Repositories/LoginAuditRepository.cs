using ATMLocator.Core.Entities;
using ATMLocator.Core.Interfaces;
using ATMLocator.Infrastructure.Data;
using MongoDB.Driver;

namespace ATMLocator.Infrastructure.Repositories;

public class LoginAuditRepository : ILoginAuditRepository
{
    private readonly MongoDbContext _context;

    public LoginAuditRepository(MongoDbContext context)
    {
        _context = context;
    }

    public async Task CreateAsync(LoginAudit audit)
    {
        audit.Id = Guid.NewGuid().ToString();
        await _context.LoginAudits.InsertOneAsync(audit);
    }

    public async Task<int> CountRecentFailuresAsync(string phoneNumberHash, TimeSpan window)
    {
        var since = DateTime.UtcNow - window;
        var count = await _context.LoginAudits.CountDocumentsAsync(a =>
            a.PhoneNumberHash == phoneNumberHash &&
            !a.Success &&
            a.EventType == AuditEventType.LoginFailed &&
            a.CreatedAt >= since);
        return (int)count;
    }

    public async Task<List<LoginAudit>> GetRecentByUserAsync(string userId, int limit = 20)
    {
        return await _context.LoginAudits
            .Find(a => a.UserId == userId)
            .SortByDescending(a => a.CreatedAt)
            .Limit(limit)
            .ToListAsync();
    }
}

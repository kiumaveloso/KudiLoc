using ATMLocator.Core.Entities;
using ATMLocator.Core.Interfaces;
using ATMLocator.Infrastructure.Data;
using MongoDB.Driver;

namespace ATMLocator.Infrastructure.Repositories;

public class VisitHistoryRepository : IVisitHistoryRepository
{
    private readonly MongoDbContext _context;

    public VisitHistoryRepository(MongoDbContext context)
    {
        _context = context;
    }

    public async Task<VisitHistory> RecordVisitAsync(VisitHistory visit)
    {
        visit.Id = Guid.NewGuid().ToString();
        visit.VisitedAt = DateTime.UtcNow;

        await _context.VisitHistory.InsertOneAsync(visit);
        return visit;
    }

    public async Task<List<VisitHistory>> GetByUserIdAsync(string userId, int limit = 50)
    {
        return await _context.VisitHistory
            .Find(v => v.UserId == userId)
            .SortByDescending(v => v.VisitedAt)
            .Limit(limit)
            .ToListAsync();
    }

    public async Task<long> CountUniqueATMsVisitedAsync(string userId)
    {
        var pipeline = new[]
        {
            new MongoDB.Bson.BsonDocument("$match",
                new MongoDB.Bson.BsonDocument("UserId", userId)),
            new MongoDB.Bson.BsonDocument("$group",
                new MongoDB.Bson.BsonDocument("_id", "$ATMId")),
            new MongoDB.Bson.BsonDocument("$count", "count")
        };

        var result = await _context.VisitHistory
            .Aggregate<MongoDB.Bson.BsonDocument>(pipeline)
            .FirstOrDefaultAsync();

        return result?["count"].AsInt64 ?? 0;
    }
}

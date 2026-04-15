using ATMLocator.Core.Entities;
using ATMLocator.Core.Interfaces;
using ATMLocator.Infrastructure.Data;
using MongoDB.Driver;

namespace ATMLocator.Infrastructure.Repositories;

public class OtpRepository : IOtpRepository
{
    private readonly MongoDbContext _context;

    public OtpRepository(MongoDbContext context)
    {
        _context = context;
    }

    public async Task SaveAsync(string phoneNumber, string code, DateTime expiresAt)
    {
        var filter = Builders<OtpEntry>.Filter.Eq(o => o.PhoneNumber, phoneNumber);
        var update = Builders<OtpEntry>.Update
            .Set(o => o.Code, code)
            .Set(o => o.ExpiresAt, expiresAt)
            .SetOnInsert(o => o.Id, Guid.NewGuid().ToString())
            .SetOnInsert(o => o.PhoneNumber, phoneNumber);

        await _context.OtpEntries.UpdateOneAsync(filter, update, new UpdateOptions { IsUpsert = true });
    }

    public async Task<OtpEntry?> GetAsync(string phoneNumber)
    {
        return await _context.OtpEntries
            .Find(o => o.PhoneNumber == phoneNumber)
            .FirstOrDefaultAsync();
    }

    public async Task DeleteAsync(string phoneNumber)
    {
        await _context.OtpEntries.DeleteOneAsync(o => o.PhoneNumber == phoneNumber);
    }
}

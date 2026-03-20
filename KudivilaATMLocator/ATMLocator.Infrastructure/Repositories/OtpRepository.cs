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
        var entry = new OtpEntry
        {
            Id = Guid.NewGuid().ToString(),
            PhoneNumber = phoneNumber,
            Code = code,
            ExpiresAt = expiresAt
        };

        var filter = Builders<OtpEntry>.Filter.Eq(o => o.PhoneNumber, phoneNumber);
        await _context.OtpEntries.ReplaceOneAsync(filter, entry, new ReplaceOptions { IsUpsert = true });
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

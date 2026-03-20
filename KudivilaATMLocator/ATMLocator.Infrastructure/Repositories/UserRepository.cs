using ATMLocator.Core.Entities;
using ATMLocator.Core.Interfaces;
using ATMLocator.Infrastructure.Data;
using MongoDB.Driver;

namespace ATMLocator.Infrastructure.Repositories;

public class UserRepository : IUserRepository
{
    private readonly MongoDbContext _context;
    private readonly IEncryptionService _encryption;

    public UserRepository(MongoDbContext context, IEncryptionService encryption)
    {
        _context = context;
        _encryption = encryption;
    }

    public async Task<User?> GetByIdAsync(string id)
    {
        var user = await _context.Users
            .Find(u => u.Id == id)
            .FirstOrDefaultAsync();
        return Decrypt(user);
    }

    public async Task<User?> GetByPhoneNumberAsync(string phoneNumber)
    {
        var hash = _encryption.Hash(phoneNumber);

        // Try hash-based lookup first (encrypted records)
        var user = await _context.Users
            .Find(u => u.PhoneNumberHash == hash)
            .FirstOrDefaultAsync();

        // Fallback: plain-text lookup for legacy records not yet migrated
        if (user == null)
        {
            user = await _context.Users
                .Find(u => u.PhoneNumber == phoneNumber)
                .FirstOrDefaultAsync();
        }

        return Decrypt(user);
    }

    public async Task<User> CreateAsync(User user)
    {
        user.Id = Guid.NewGuid().ToString();
        user.CreatedAt = DateTime.UtcNow;
        user.ReputationScore = 50;
        Encrypt(user);

        await _context.Users.InsertOneAsync(user);
        return user;
    }

    public async Task<User> UpdateAsync(User user)
    {
        Encrypt(user);
        await _context.Users.ReplaceOneAsync(u => u.Id == user.Id, user);
        return user;
    }

    public async Task<long> CountAllAsync()
    {
        return await _context.Users.CountDocumentsAsync(_ => true);
    }

    public async Task<bool> DeleteAsync(string id)
    {
        var result = await _context.Users.DeleteOneAsync(u => u.Id == id);
        return result.DeletedCount > 0;
    }

    public async Task<List<User>> GetTopByReportsAsync(int limit = 20)
    {
        var users = await _context.Users
            .Find(_ => true)
            .SortByDescending(u => u.TotalReports)
            .ThenByDescending(u => u.ReputationScore)
            .Limit(limit)
            .ToListAsync();
        return users.Select(Decrypt).Where(u => u != null).ToList()!;
    }

    public async Task<List<User>> GetByIdsAsync(IEnumerable<string> ids)
    {
        var idList = ids.ToList();
        var filter = Builders<User>.Filter.In(u => u.Id, idList);
        var users = await _context.Users.Find(filter).ToListAsync();
        return users.Select(Decrypt).Where(u => u != null).ToList()!;
    }

    public async Task<List<User>> GetUnmigratedAsync()
    {
        var filter = Builders<User>.Filter.Or(
            Builders<User>.Filter.Eq(u => u.PhoneNumberHash, null),
            Builders<User>.Filter.Eq(u => u.PhoneNumberHash, "")
        );
        // Return raw documents (don't decrypt — they have plain text in PhoneNumber)
        return await _context.Users.Find(filter).ToListAsync();
    }

    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------

    private void Encrypt(User user)
    {
        if (string.IsNullOrEmpty(user.PhoneNumber)) return;
        user.PhoneNumberEncrypted = _encryption.Encrypt(user.PhoneNumber);
        user.PhoneNumberHash = _encryption.Hash(user.PhoneNumber);
        // Do not persist plain-text phone number
        user.PhoneNumber = string.Empty;
    }

    private User? Decrypt(User? user)
    {
        if (user == null) return null;
        if (!string.IsNullOrEmpty(user.PhoneNumberEncrypted))
        {
            try { user.PhoneNumber = _encryption.Decrypt(user.PhoneNumberEncrypted); }
            catch { /* corrupted record — leave PhoneNumber empty */ }
        }
        return user;
    }
}

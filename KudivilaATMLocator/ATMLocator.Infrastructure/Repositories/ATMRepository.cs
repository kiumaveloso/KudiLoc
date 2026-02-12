using ATMLocator.Core.Entities;
using ATMLocator.Core.Interfaces;
using ATMLocator.Infrastructure.Data;
using MongoDB.Driver;

namespace ATMLocator.Infrastructure.Repositories;

public class ATMRepository : IATMRepository
{
    private readonly MongoDbContext _context;

    public ATMRepository(MongoDbContext context)
    {
        _context = context;
    }

    public async Task<ATM?> GetByIdAsync(string id)
    {
        return await _context.ATMs
            .Find(atm => atm.Id == id)
            .FirstOrDefaultAsync();
    }

    public async Task<List<ATM>> GetAllAsync()
    {
        return await _context.ATMs
            .Find(_ => true)
            .ToListAsync();
    }

    public async Task<List<ATM>> GetNearbyAsync(double latitude, double longitude, double radiusKm)
    {
        // Use MongoDB $nearSphere with 2dsphere index instead of loading all ATMs into memory.
        // MongoDB uses meters for $maxDistance with GeoJSON.
        var radiusMeters = radiusKm * 1000;

        var filter = Builders<ATM>.Filter.NearSphere(
            atm => atm.Location,
            longitude, // GeoJSON order: longitude first
            latitude,
            maxDistance: radiusMeters
        );

        return await _context.ATMs
            .Find(filter)
            .ToListAsync();
    }

    public async Task<List<ATM>> GetByProvinceAsync(string province, int skip = 0, int limit = 20)
    {
        return await _context.ATMs
            .Find(atm => atm.Province == province)
            .Skip(skip)
            .Limit(limit)
            .ToListAsync();
    }

    public async Task<long> CountByProvinceAsync(string province)
    {
        return await _context.ATMs.CountDocumentsAsync(atm => atm.Province == province);
    }

    public async Task<List<ATM>> SearchAsync(string searchTerm, int skip = 0, int limit = 20)
    {
        var filter = BuildSearchFilter(searchTerm);
        return await _context.ATMs
            .Find(filter)
            .Skip(skip)
            .Limit(limit)
            .ToListAsync();
    }

    public async Task<long> CountSearchAsync(string searchTerm)
    {
        var filter = BuildSearchFilter(searchTerm);
        return await _context.ATMs.CountDocumentsAsync(filter);
    }

    public async Task<List<ATM>> GetByBankNameAsync(string bankName, int skip = 0, int limit = 20)
    {
        return await _context.ATMs
            .Find(atm => atm.BankName == bankName)
            .Skip(skip)
            .Limit(limit)
            .ToListAsync();
    }

    public async Task<long> CountByBankNameAsync(string bankName)
    {
        return await _context.ATMs.CountDocumentsAsync(atm => atm.BankName == bankName);
    }

    public async Task<long> CountAllAsync()
    {
        return await _context.ATMs.CountDocumentsAsync(_ => true);
    }

    private static FilterDefinition<ATM> BuildSearchFilter(string searchTerm)
    {
        return Builders<ATM>.Filter.Or(
            Builders<ATM>.Filter.Regex(atm => atm.Name, new MongoDB.Bson.BsonRegularExpression(searchTerm, "i")),
            Builders<ATM>.Filter.Regex(atm => atm.BankName, new MongoDB.Bson.BsonRegularExpression(searchTerm, "i")),
            Builders<ATM>.Filter.Regex(atm => atm.Address.Neighborhood, new MongoDB.Bson.BsonRegularExpression(searchTerm, "i")),
            Builders<ATM>.Filter.Regex(atm => atm.Address.Landmark, new MongoDB.Bson.BsonRegularExpression(searchTerm, "i"))
        );
    }

    public async Task<ATM> CreateAsync(ATM atm)
    {
        atm.Id = Guid.NewGuid().ToString();
        atm.CreatedAt = DateTime.UtcNow;
        atm.UpdatedAt = DateTime.UtcNow;
        atm.SyncLocation();

        await _context.ATMs.InsertOneAsync(atm);
        return atm;
    }

    public async Task<ATM> UpdateAsync(ATM atm)
    {
        atm.UpdatedAt = DateTime.UtcNow;
        atm.SyncLocation();

        await _context.ATMs.ReplaceOneAsync(
            a => a.Id == atm.Id,
            atm
        );
        
        return atm;
    }

    public async Task<bool> DeleteAsync(string id)
    {
        var result = await _context.ATMs.DeleteOneAsync(atm => atm.Id == id);
        return result.DeletedCount > 0;
    }

    // NEW: Add photo to ATM
    public async Task<bool> AddPhotoAsync(string atmId, string photoUrl)
    {
        var filter = Builders<ATM>.Filter.Eq(atm => atm.Id, atmId);
        var update = Builders<ATM>.Update
            .Push(atm => atm.PhotoUrls, photoUrl)
            .Set(atm => atm.UpdatedAt, DateTime.UtcNow);

        var result = await _context.ATMs.UpdateOneAsync(filter, update);
        return result.ModifiedCount > 0;
    }

}
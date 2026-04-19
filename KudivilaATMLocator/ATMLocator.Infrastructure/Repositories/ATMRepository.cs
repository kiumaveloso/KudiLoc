using System.Text.RegularExpressions;
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
        // Use a lat/lon bounding box (standard field index) instead of $nearSphere
        // to avoid dependency on the 2dsphere index which may not exist in all deployments.
        var latDelta = radiusKm / 110.574;
        var lonDelta = radiusKm / (111.32 * Math.Cos(latitude * Math.PI / 180.0));

        var filter = Builders<ATM>.Filter.And(
            Builders<ATM>.Filter.Gte(a => a.Latitude,  latitude  - latDelta),
            Builders<ATM>.Filter.Lte(a => a.Latitude,  latitude  + latDelta),
            Builders<ATM>.Filter.Gte(a => a.Longitude, longitude - lonDelta),
            Builders<ATM>.Filter.Lte(a => a.Longitude, longitude + lonDelta)
        );

        var candidates = await _context.ATMs.Find(filter).ToListAsync();

        // Refine with exact Haversine distance to remove bounding-box corners
        return candidates
            .Where(atm => HaversineKm(latitude, longitude, atm.Latitude, atm.Longitude) <= radiusKm)
            .ToList();
    }

    private static double HaversineKm(double lat1, double lon1, double lat2, double lon2)
    {
        const double R = 6371.0;
        var dLat = (lat2 - lat1) * Math.PI / 180.0;
        var dLon = (lon2 - lon1) * Math.PI / 180.0;
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2)
              + Math.Cos(lat1 * Math.PI / 180.0) * Math.Cos(lat2 * Math.PI / 180.0)
              * Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        return R * 2.0 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1.0 - a));
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
        var escaped = Regex.Escape(searchTerm);
        var regex = new MongoDB.Bson.BsonRegularExpression(escaped, "i");
        return Builders<ATM>.Filter.Or(
            Builders<ATM>.Filter.Regex(atm => atm.Name, regex),
            Builders<ATM>.Filter.Regex(atm => atm.BankName, regex),
            Builders<ATM>.Filter.Regex(atm => atm.Province, regex),
            Builders<ATM>.Filter.Regex(atm => atm.Municipality, regex),
            Builders<ATM>.Filter.Regex(atm => atm.Address.Street, regex),
            Builders<ATM>.Filter.Regex(atm => atm.Address.Neighborhood, regex),
            Builders<ATM>.Filter.Regex(atm => atm.Address.Landmark, regex)
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

    public async Task<List<ATM>> GetAllSortedByUpdatedAsync(int limit = 200)
    {
        return await _context.ATMs
            .Find(_ => true)
            .SortByDescending(atm => atm.UpdatedAt)
            .Limit(limit)
            .ToListAsync();
    }

    public async Task<List<ATM>> GetAllSortedByUpdatedPagedAsync(int skip, int limit)
    {
        return await _context.ATMs
            .Find(_ => true)
            .SortByDescending(atm => atm.UpdatedAt)
            .Skip(skip)
            .Limit(limit)
            .ToListAsync();
    }

    public async Task<long> CountByCreatedByAsync(string userId)
    {
        return await _context.ATMs.CountDocumentsAsync(atm => atm.CreatedBy == userId);
    }

    // Add photo to ATM
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
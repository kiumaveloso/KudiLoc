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
        var allAtms = await GetAllAsync();
        
        return allAtms
            .Where(atm => CalculateDistance(latitude, longitude, atm.Latitude, atm.Longitude) <= radiusKm)
            .OrderBy(atm => CalculateDistance(latitude, longitude, atm.Latitude, atm.Longitude))
            .ToList();
    }

    public async Task<List<ATM>> GetByProvinceAsync(string province)
    {
        return await _context.ATMs
            .Find(atm => atm.Province == province)
            .ToListAsync();
    }

    // NEW: Search functionality
    public async Task<List<ATM>> SearchAsync(string searchTerm)
    {
        var filter = Builders<ATM>.Filter.Or(
            Builders<ATM>.Filter.Regex(atm => atm.Name, new MongoDB.Bson.BsonRegularExpression(searchTerm, "i")),
            Builders<ATM>.Filter.Regex(atm => atm.BankName, new MongoDB.Bson.BsonRegularExpression(searchTerm, "i")),
            Builders<ATM>.Filter.Regex(atm => atm.Address.Neighborhood, new MongoDB.Bson.BsonRegularExpression(searchTerm, "i")),
            Builders<ATM>.Filter.Regex(atm => atm.Address.Landmark, new MongoDB.Bson.BsonRegularExpression(searchTerm, "i"))
        );

        return await _context.ATMs
            .Find(filter)
            .ToListAsync();
    }

    // NEW: Get by bank name
    public async Task<List<ATM>> GetByBankNameAsync(string bankName)
    {
        return await _context.ATMs
            .Find(atm => atm.BankName == bankName)
            .ToListAsync();
    }

    public async Task<ATM> CreateAsync(ATM atm)
    {
        atm.Id = Guid.NewGuid().ToString();
        atm.CreatedAt = DateTime.UtcNow;
        atm.UpdatedAt = DateTime.UtcNow;
        
        await _context.ATMs.InsertOneAsync(atm);
        return atm;
    }

    public async Task<ATM> UpdateAsync(ATM atm)
    {
        atm.UpdatedAt = DateTime.UtcNow;
        
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

    private double CalculateDistance(double lat1, double lon1, double lat2, double lon2)
    {
        const double earthRadiusKm = 6371;

        var dLat = DegreesToRadians(lat2 - lat1);
        var dLon = DegreesToRadians(lon2 - lon1);

        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(DegreesToRadians(lat1)) * Math.Cos(DegreesToRadians(lat2)) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

        return earthRadiusKm * c;
    }

    private double DegreesToRadians(double degrees)
    {
        return degrees * Math.PI / 180;
    }
}
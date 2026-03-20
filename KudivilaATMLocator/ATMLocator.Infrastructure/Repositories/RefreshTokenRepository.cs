using ATMLocator.Core.Entities;
using ATMLocator.Core.Interfaces;
using ATMLocator.Infrastructure.Data;
using MongoDB.Driver;

namespace ATMLocator.Infrastructure.Repositories;

public class RefreshTokenRepository : IRefreshTokenRepository
{
    private readonly MongoDbContext _context;

    public RefreshTokenRepository(MongoDbContext context)
    {
        _context = context;
    }

    public async Task<RefreshToken> CreateAsync(RefreshToken token)
    {
        token.Id = Guid.NewGuid().ToString();
        token.CreatedAt = DateTime.UtcNow;
        await _context.RefreshTokens.InsertOneAsync(token);
        return token;
    }

    public async Task<RefreshToken?> GetByTokenAsync(string token)
    {
        return await _context.RefreshTokens
            .Find(rt => rt.Token == token && !rt.IsRevoked)
            .FirstOrDefaultAsync();
    }

    public async Task RevokeAsync(string token)
    {
        var update = Builders<RefreshToken>.Update.Set(rt => rt.IsRevoked, true);
        await _context.RefreshTokens.UpdateOneAsync(rt => rt.Token == token, update);
    }

    public async Task RevokeAllForUserAsync(string userId)
    {
        var update = Builders<RefreshToken>.Update.Set(rt => rt.IsRevoked, true);
        await _context.RefreshTokens.UpdateManyAsync(rt => rt.UserId == userId && !rt.IsRevoked, update);
    }
}

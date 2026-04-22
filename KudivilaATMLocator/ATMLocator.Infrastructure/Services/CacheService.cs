using System.Text.Json;
using ATMLocator.Core.Interfaces;
using Microsoft.Extensions.Caching.Distributed;
using StackExchange.Redis;

namespace ATMLocator.Infrastructure.Services;

public class CacheService : ICacheService
{
    private readonly IDistributedCache _cache;
    private readonly IConnectionMultiplexer? _redis;

    public CacheService(IDistributedCache cache, IConnectionMultiplexer? redis = null)
    {
        _cache = cache;
        _redis = redis;
    }

    public async Task<T?> GetAsync<T>(string key)
    {
        var value = await _cache.GetStringAsync(key);
        if (value == null) return default;
        return JsonSerializer.Deserialize<T>(value);
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan expiry)
    {
        var serialized = JsonSerializer.Serialize(value);
        await _cache.SetStringAsync(key, serialized, new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = expiry
        });
    }

    public async Task RemoveAsync(string key)
    {
        await _cache.RemoveAsync(key);
    }

    public async Task RemoveByPrefixAsync(string prefix)
    {
        if (_redis == null) return;

        var db = _redis.GetDatabase();
        var server = _redis.GetServers().FirstOrDefault();
        if (server == null) return;

        // SCAN is non-blocking — safe for production unlike KEYS
        var pattern = $"{prefix}*";
        await foreach (var key in server.KeysAsync(pattern: pattern, pageSize: 100))
        {
            await db.KeyDeleteAsync(key);
        }
    }
}

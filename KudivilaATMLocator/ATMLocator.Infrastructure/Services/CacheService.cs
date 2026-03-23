using System.Text.Json;
using ATMLocator.Core.Interfaces;
using Microsoft.Extensions.Caching.Distributed;

namespace ATMLocator.Infrastructure.Services;

public class CacheService : ICacheService
{
    private readonly IDistributedCache _cache;

    public CacheService(IDistributedCache cache)
    {
        _cache = cache;
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
        // StackExchange.Redis does not support pattern delete via IDistributedCache.
        // For the ATM use case, we know the specific keys to invalidate.
        // This method is intentionally a no-op here; callers should use RemoveAsync with specific keys.
        await Task.CompletedTask;
    }
}

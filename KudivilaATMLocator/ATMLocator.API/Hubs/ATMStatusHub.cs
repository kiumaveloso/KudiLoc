using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Caching.Memory;

namespace ATMLocator.API.Hubs;

/// <summary>
/// SignalR hub for real-time ATM status updates.
/// Clients join a group per ATM ID and receive status broadcasts when reports are submitted.
/// Rate-limited to 10 connections per IP per minute.
/// </summary>
public class ATMStatusHub : Hub
{
    private readonly IMemoryCache _cache;

    public ATMStatusHub(IMemoryCache cache)
    {
        _cache = cache;
    }

    public override async Task OnConnectedAsync()
    {
        var ip = Context.GetHttpContext()?.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var key = $"signalr_{ip}";
        var count = _cache.GetOrCreate(key, e =>
        {
            e.SlidingExpiration = TimeSpan.FromMinutes(1);
            return 0;
        });
        if (count >= 10)
        {
            Context.Abort();
            return;
        }
        _cache.Set(key, count + 1, new MemoryCacheEntryOptions { SlidingExpiration = TimeSpan.FromMinutes(1) });
        await base.OnConnectedAsync();
    }

    /// <summary>
    /// Subscribe to real-time updates for a specific ATM.
    /// Call this from the client after connecting: connection.invoke("SubscribeToATM", atmId)
    /// </summary>
    public async Task SubscribeToATM(string atmId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"atm-{atmId}");
    }

    /// <summary>
    /// Unsubscribe from a specific ATM's updates.
    /// </summary>
    public async Task UnsubscribeFromATM(string atmId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"atm-{atmId}");
    }
}

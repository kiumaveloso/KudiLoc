using ATMLocator.Core.Entities;

namespace ATMLocator.Core.Interfaces;

public interface IRefreshTokenRepository
{
    Task<RefreshToken> CreateAsync(RefreshToken token);
    Task<RefreshToken?> GetByTokenAsync(string token);
    Task RevokeAsync(string token);
    Task RevokeAllForUserAsync(string userId);
}

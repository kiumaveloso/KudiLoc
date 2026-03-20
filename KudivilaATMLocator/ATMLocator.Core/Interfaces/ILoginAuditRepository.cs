using ATMLocator.Core.Entities;

namespace ATMLocator.Core.Interfaces;

public interface ILoginAuditRepository
{
    Task CreateAsync(LoginAudit audit);
    Task<int> CountRecentFailuresAsync(string phoneNumberHash, TimeSpan window);
    Task<List<LoginAudit>> GetRecentByUserAsync(string userId, int limit = 20);
}

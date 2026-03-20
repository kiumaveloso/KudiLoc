using ATMLocator.Core.Entities;

namespace ATMLocator.Core.Interfaces;

public interface IVisitHistoryRepository
{
    Task<VisitHistory> RecordVisitAsync(VisitHistory visit);
    Task<List<VisitHistory>> GetByUserIdAsync(string userId, int limit = 50);
    Task<long> CountUniqueATMsVisitedAsync(string userId);
}

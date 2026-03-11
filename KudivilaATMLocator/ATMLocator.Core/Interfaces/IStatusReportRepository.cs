using ATMLocator.Core.Entities;

namespace ATMLocator.Core.Interfaces;

public interface IStatusReportRepository
{
    Task<StatusReport> CreateAsync(StatusReport report);
    Task<List<StatusReport>> GetByATMIdAsync(string atmId, int limit = 10, int skip = 0);
    Task<List<StatusReport>> GetRecentReportsAsync(string atmId, TimeSpan timeWindow);
    Task<StatusReport> UpdateAsync(StatusReport report);
    Task<StatusReport?> GetLastReportByUserForATM(string userId, string atmId);
    Task<long> CountByATMIdAsync(string atmId);
    Task<long> CountAllAsync();
    Task<List<StatusReport>> GetByCreatedByAsync(string createdBy, int limit = 100);
}
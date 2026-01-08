using ATMLocator.Core.Entities;

namespace ATMLocator.Core.Interfaces;

public interface IStatusReportRepository
{
    Task<StatusReport> CreateAsync(StatusReport report);
    Task<List<StatusReport>> GetByATMIdAsync(string atmId, int limit = 10);
    Task<List<StatusReport>> GetRecentReportsAsync(string atmId, TimeSpan timeWindow);
    Task<StatusReport> UpdateAsync(StatusReport report);
}
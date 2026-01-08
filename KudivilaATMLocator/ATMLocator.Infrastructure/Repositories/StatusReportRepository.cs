using ATMLocator.Core.Entities;
using ATMLocator.Core.Interfaces;
using ATMLocator.Infrastructure.Data;
using MongoDB.Driver;

namespace ATMLocator.Infrastructure.Repositories;

public class StatusReportRepository : IStatusReportRepository
{
    private readonly MongoDbContext _context;

    public StatusReportRepository(MongoDbContext context)
    {
        _context = context;
    }

    public async Task<StatusReport> CreateAsync(StatusReport report)
    {
        report.Id = Guid.NewGuid().ToString();
        report.ReportedAt = DateTime.UtcNow;
        report.Status = ReportStatus.Pending;
        report.ConfirmationCount = 1; // Self-confirmation
        
        await _context.StatusReports.InsertOneAsync(report);
        return report;
    }

    public async Task<List<StatusReport>> GetByATMIdAsync(string atmId, int limit = 10)
    {
        return await _context.StatusReports
            .Find(report => report.ATMId == atmId)
            .SortByDescending(report => report.ReportedAt)
            .Limit(limit)
            .ToListAsync();
    }

    public async Task<List<StatusReport>> GetRecentReportsAsync(string atmId, TimeSpan timeWindow)
    {
        var cutoffTime = DateTime.UtcNow.Subtract(timeWindow);
        
        var filter = Builders<StatusReport>.Filter.And(
            Builders<StatusReport>.Filter.Eq(report => report.ATMId, atmId),
            Builders<StatusReport>.Filter.Gte(report => report.ReportedAt, cutoffTime)
        );

        return await _context.StatusReports
            .Find(filter)
            .SortByDescending(report => report.ReportedAt)
            .ToListAsync();
    }

    public async Task<StatusReport> UpdateAsync(StatusReport report)
    {
        await _context.StatusReports.ReplaceOneAsync(
            r => r.Id == report.Id,
            report
        );
        
        return report;
    }
}
using ATMLocator.Core.Interfaces;
using ATMLocator.Application.DTOs;

namespace ATMLocator.Application.Services;

public interface IAnalyticsService
{
    Task<SystemStatsDto> GetSystemStatsAsync();
    Task<ATMActivityDto> GetATMActivityAsync(string atmId);
}

public class AnalyticsService : IAnalyticsService
{
    private readonly IATMRepository _atmRepository;
    private readonly IStatusReportRepository _reportRepository;
    private readonly IUserRepository _userRepository;

    public AnalyticsService(
        IATMRepository atmRepository,
        IStatusReportRepository reportRepository,
        IUserRepository userRepository)
    {
        _atmRepository = atmRepository;
        _reportRepository = reportRepository;
        _userRepository = userRepository;
    }

    public async Task<SystemStatsDto> GetSystemStatsAsync()
    {
        var totalATMs = await _atmRepository.CountAllAsync();
        var totalReports = await _reportRepository.CountAllAsync();
        var totalUsers = await _userRepository.CountAllAsync();

        // Get all ATMs to compute status breakdown
        var allATMs = await _atmRepository.GetAllAsync();
        var withCash = allATMs.Count(a => a.CurrentStatus.HasCash);
        var highReliability = allATMs.Count(a => a.CurrentStatus.ReliabilityScore >= 70);

        // Province breakdown
        var byProvince = allATMs
            .GroupBy(a => a.Province)
            .Select(g => new ProvinceStatsDto(g.Key, g.Count(), g.Count(a => a.CurrentStatus.HasCash)))
            .OrderByDescending(p => p.TotalATMs)
            .ToList();

        // Bank breakdown
        var byBank = allATMs
            .GroupBy(a => a.BankName)
            .Select(g => new BankStatsDto(g.Key, g.Count(), g.Count(a => a.CurrentStatus.HasCash)))
            .OrderByDescending(b => b.TotalATMs)
            .ToList();

        return new SystemStatsDto(
            (int)totalATMs,
            (int)totalReports,
            (int)totalUsers,
            withCash,
            (int)totalATMs - withCash,
            highReliability,
            byProvince,
            byBank
        );
    }

    public async Task<ATMActivityDto> GetATMActivityAsync(string atmId)
    {
        var atm = await _atmRepository.GetByIdAsync(atmId);
        if (atm == null)
            throw new ArgumentException("ATM não encontrado", nameof(atmId));

        // Get last 24h of reports
        var recentReports = await _reportRepository.GetRecentReportsAsync(atmId, TimeSpan.FromHours(24));
        var allReports = await _reportRepository.GetByATMIdAsync(atmId, 50);

        var totalReportsAllTime = await _reportRepository.CountByATMIdAsync(atmId);

        var reportSummaries = allReports.Select(r => new ReportSummaryDto(
            r.Id,
            r.UserId,
            r.HasCash,
            r.ReportedAt,
            r.Status.ToString(),
            r.Notes
        )).ToList();

        return new ATMActivityDto(
            atmId,
            atm.Name,
            atm.BankName,
            atm.CurrentStatus.HasCash,
            atm.CurrentStatus.ReliabilityScore,
            atm.CurrentStatus.LastVerified,
            (int)totalReportsAllTime,
            recentReports.Count,
            reportSummaries
        );
    }
}

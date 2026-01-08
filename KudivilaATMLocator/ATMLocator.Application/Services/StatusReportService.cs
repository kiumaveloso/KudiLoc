using ATMLocator.Core.Entities;
using ATMLocator.Core.Interfaces;
using ATMLocator.Application.DTOs;

namespace ATMLocator.Application.Services;

public interface IStatusReportService
{
    Task<StatusReportResponseDto> SubmitReportAsync(CreateStatusReportDto dto);
    Task<List<StatusReportResponseDto>> GetRecentReportsAsync(string atmId);
}

public class StatusReportService : IStatusReportService
{
    private readonly IStatusReportRepository _reportRepository;
    private readonly IATMRepository _atmRepository;
    private readonly IUserRepository _userRepository;
    
    // Time window for considering reports "recent" (30 minutes)
    private readonly TimeSpan _reportTimeWindow = TimeSpan.FromMinutes(30);
    
    // Minimum confirmations needed to trust a report
    private const int MinConfirmationsForTrust = 3;

    public StatusReportService(
        IStatusReportRepository reportRepository,
        IATMRepository atmRepository,
        IUserRepository userRepository)
    {
        _reportRepository = reportRepository;
        _atmRepository = atmRepository;
        _userRepository = userRepository;
    }

    public async Task<StatusReportResponseDto> SubmitReportAsync(CreateStatusReportDto dto)
    {
        // 1. Verify ATM exists
        var atm = await _atmRepository.GetByIdAsync(dto.ATMId);
        if (atm == null)
        {
            throw new ArgumentException("ATM não encontrado", nameof(dto.ATMId));
        }

        // 2. Verify user exists
        var user = await _userRepository.GetByIdAsync(dto.UserId);
        if (user == null)
        {
            throw new ArgumentException("Utilizador não encontrado", nameof(dto.UserId));
        }

        // 3. Create the report
        var report = new StatusReport
        {
            ATMId = dto.ATMId,
            UserId = dto.UserId,
            HasCash = dto.HasCash,
            Notes = dto.Notes,
            Status = ReportStatus.Pending
        };

        var createdReport = await _reportRepository.CreateAsync(report);

        // 4. Update ATM status based on crowd-sourced data
        await UpdateATMStatusAsync(atm);

        // 5. Update user reputation
        await UpdateUserReputationAsync(user, createdReport);

        return MapToDto(createdReport);
    }

    public async Task<List<StatusReportResponseDto>> GetRecentReportsAsync(string atmId)
    {
        var reports = await _reportRepository.GetByATMIdAsync(atmId, 20);
        return reports.Select(MapToDto).ToList();
    }

    private async Task UpdateATMStatusAsync(ATM atm)
    {
        // Get recent reports (last 30 minutes)
        var recentReports = await _reportRepository.GetRecentReportsAsync(
            atm.Id, 
            _reportTimeWindow
        );

        if (!recentReports.Any())
        {
            return;
        }

        // Separate reports by status claim
        var hasCashReports = recentReports.Where(r => r.HasCash).ToList();
        var noCashReports = recentReports.Where(r => !r.HasCash).ToList();

        // Weight reports by user reputation
        var hasCashWeight = await CalculateReportWeight(hasCashReports);
        var noCashWeight = await CalculateReportWeight(noCashReports);

        // Determine ATM status based on weighted reports
        bool hasMoneyNow = hasCashWeight > noCashWeight;
        
        // Calculate reliability score (0-100)
        int reliabilityScore = CalculateReliabilityScore(
            recentReports.Count,
            Math.Max(hasCashWeight, noCashWeight),
            hasMoneyNow ? hasCashReports.Count : noCashReports.Count
        );

        // Update ATM status
        atm.CurrentStatus.HasCash = hasMoneyNow;
        atm.CurrentStatus.ReliabilityScore = reliabilityScore;
        atm.CurrentStatus.LastVerified = DateTime.UtcNow;
        atm.CurrentStatus.TotalReports = recentReports.Count;

        await _atmRepository.UpdateAsync(atm);

        // Mark reports as verified or rejected
        await UpdateReportStatuses(recentReports, hasMoneyNow);
    }

    private async Task<double> CalculateReportWeight(List<StatusReport> reports)
    {
        double totalWeight = 0;

        foreach (var report in reports)
        {
            var user = await _userRepository.GetByIdAsync(report.UserId);
            if (user != null)
            {
                // Users with higher reputation have more weight
                // Reputation is 0-100, normalize to 0.5-1.5 weight multiplier
                double userWeight = 0.5 + (user.ReputationScore / 100.0);
                totalWeight += userWeight;
            }
            else
            {
                // Default weight for unknown users
                totalWeight += 1.0;
            }
        }

        return totalWeight;
    }

    private int CalculateReliabilityScore(int totalReports, double winningWeight, int winningCount)
    {
        // Base score on number of reports
        int baseScore = Math.Min(totalReports * 10, 50); // Max 50 points from volume

        // Bonus for consensus (when most reports agree)
        double consensusRatio = winningCount / (double)totalReports;
        int consensusBonus = (int)(consensusRatio * 30); // Max 30 points

        // Bonus for trusted reporters (high reputation users)
        int trustBonus = (int)Math.Min(winningWeight * 5, 20); // Max 20 points

        return Math.Min(baseScore + consensusBonus + trustBonus, 100);
    }

    private async Task UpdateReportStatuses(List<StatusReport> reports, bool actualStatus)
    {
        foreach (var report in reports)
        {
            report.Status = report.HasCash == actualStatus 
                ? ReportStatus.Verified 
                : ReportStatus.Rejected;

            await _reportRepository.UpdateAsync(report);
        }
    }

    private async Task UpdateUserReputationAsync(User user, StatusReport report)
    {
        user.TotalReports++;

        // Check if this report matches recent consensus
        var recentReports = await _reportRepository.GetRecentReportsAsync(
            report.ATMId,
            TimeSpan.FromMinutes(5)
        );

        if (recentReports.Count >= 2)
        {
            // See if user's report matches the majority
            var matchingReports = recentReports
                .Where(r => r.HasCash == report.HasCash)
                .Count();

            if (matchingReports > recentReports.Count / 2.0)
            {
                // User's report matches consensus - increase reputation
                user.AccurateReports++;
                user.ReputationScore = Math.Min(user.ReputationScore + 2, 100);
            }
            else
            {
                // User's report contradicts consensus - decrease reputation
                user.ReputationScore = Math.Max(user.ReputationScore - 3, 0);
            }
        }

        await _userRepository.UpdateAsync(user);
    }

    private StatusReportResponseDto MapToDto(StatusReport report)
    {
        return new StatusReportResponseDto(
            report.Id,
            report.ATMId,
            report.UserId,
            report.HasCash,
            report.ReportedAt,
            report.Status.ToString(),
            report.ConfirmationCount
        );
    }
}
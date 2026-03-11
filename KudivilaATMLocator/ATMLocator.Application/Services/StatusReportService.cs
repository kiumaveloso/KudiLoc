using ATMLocator.Core.Entities;
using ATMLocator.Core.Interfaces;
using ATMLocator.Core.Settings;
using ATMLocator.Application.DTOs;
using Microsoft.Extensions.Options;

namespace ATMLocator.Application.Services;

public interface IStatusReportService
{
    Task<StatusReportResponseDto> SubmitReportAsync(CreateStatusReportDto dto);
    Task<PagedResultDto<StatusReportResponseDto>> GetRecentReportsAsync(string atmId, int page = 1, int pageSize = 20);
    Task<List<StatusReportResponseDto>> GetReportsByATMIdFlatAsync(string atmId, int limit = 20);
    Task<List<StatusReportResponseDto>> GetReportsByCreatorAsync(string createdBy, int limit = 100);
}

public class StatusReportService : IStatusReportService
{
    private const int MaxPageSize = 100;
    private readonly IStatusReportRepository _reportRepository;
    private readonly IATMRepository _atmRepository;
    private readonly IUserRepository _userRepository;
    private readonly ReportSettings _settings;

    public StatusReportService(
        IStatusReportRepository reportRepository,
        IATMRepository atmRepository,
        IUserRepository userRepository,
        IOptions<ReportSettings> settings)
    {
        _reportRepository = reportRepository;
        _atmRepository = atmRepository;
        _userRepository = userRepository;
        _settings = settings.Value;
    }

    public async Task<StatusReportResponseDto> SubmitReportAsync(CreateStatusReportDto dto)
    {
        // 1. Verify ATM exists
        var atm = await _atmRepository.GetByIdAsync(dto.ATMId);
        if (atm == null)
        {
            throw new ArgumentException("ATM não encontrado", nameof(dto.ATMId));
        }

        // 2. Resolve HasCash from either the bool field or the StatusReported string
        bool hasCash = dto.HasCash;
        if (!string.IsNullOrEmpty(dto.StatusReported))
        {
            hasCash = dto.StatusReported.Equals("has_money", StringComparison.OrdinalIgnoreCase);
        }

        // 3. Optionally verify user exists (skip for anonymous kudi-cash-find reports)
        User? user = null;
        if (!string.IsNullOrEmpty(dto.UserId))
        {
            user = await _userRepository.GetByIdAsync(dto.UserId);
            if (user == null)
            {
                throw new ArgumentException("Utilizador não encontrado", nameof(dto.UserId));
            }

            // Check per-user per-ATM report cooldown
            var cooldown = TimeSpan.FromMinutes(_settings.CooldownMinutes);
            var lastReport = await _reportRepository.GetLastReportByUserForATM(dto.UserId, dto.ATMId);
            if (lastReport != null)
            {
                var timeSinceLastReport = DateTime.UtcNow - lastReport.ReportedAt;
                if (timeSinceLastReport < cooldown)
                {
                    var remainingSeconds = (int)(cooldown - timeSinceLastReport).TotalSeconds;
                    throw new InvalidOperationException(
                        $"Aguarde {remainingSeconds} segundos antes de submeter outro relatório para este ATM.");
                }
            }
        }

        // 4. Create the report
        var operationalStatus = Enum.TryParse<OperationalStatus>(dto.OperationalStatus, true, out var parsed)
            ? parsed
            : OperationalStatus.Operational;

        var report = new StatusReport
        {
            ATMId = dto.ATMId,
            UserId = dto.UserId ?? string.Empty,
            HasCash = hasCash,
            OperationalStatus = operationalStatus,
            Notes = dto.Notes,
            Status = ReportStatus.Pending,
            ReporterReputation = dto.ReporterReputation ?? (user?.ReputationScore ?? 50),
            CreatedBy = dto.CreatedBy
        };

        var createdReport = await _reportRepository.CreateAsync(report);

        // 5. Update ATM status based on crowd-sourced data
        await UpdateATMStatusAsync(atm);

        // 6. Update the ATM's kudi-cash-find tracking fields
        atm.LastReportTime = createdReport.ReportedAt;
        atm.RecentReportsCount = atm.CurrentStatus.TotalReports;
        await _atmRepository.UpdateAsync(atm);

        // 7. Update user reputation (only for authenticated users)
        if (user != null)
        {
            await UpdateUserReputationAsync(user, createdReport);
        }

        return MapToDto(createdReport);
    }

    public async Task<PagedResultDto<StatusReportResponseDto>> GetRecentReportsAsync(string atmId, int page = 1, int pageSize = 20)
    {
        pageSize = Math.Clamp(pageSize, 1, MaxPageSize);
        page = Math.Max(1, page);
        var skip = (page - 1) * pageSize;
        var reports = await _reportRepository.GetByATMIdAsync(atmId, pageSize, skip);
        var totalCount = await _reportRepository.CountByATMIdAsync(atmId);
        return new PagedResultDto<StatusReportResponseDto>(
            reports.Select(MapToDto).ToList(),
            page, pageSize, (int)totalCount,
            (int)Math.Ceiling(totalCount / (double)pageSize)
        );
    }

    public async Task<List<StatusReportResponseDto>> GetReportsByATMIdFlatAsync(string atmId, int limit = 20)
    {
        var reports = await _reportRepository.GetByATMIdAsync(atmId, limit, 0);
        return reports.Select(MapToDto).ToList();
    }

    public async Task<List<StatusReportResponseDto>> GetReportsByCreatorAsync(string createdBy, int limit = 100)
    {
        var reports = await _reportRepository.GetByCreatedByAsync(createdBy, limit);
        return reports.Select(MapToDto).ToList();
    }

    private async Task UpdateATMStatusAsync(ATM atm)
    {
        var reportTimeWindow = TimeSpan.FromMinutes(_settings.ReportTimeWindowMinutes);
        var recentReports = await _reportRepository.GetRecentReportsAsync(atm.Id, reportTimeWindow);

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

        // Determine operational status from most recent reports (majority vote)
        var operationalVotes = recentReports
            .GroupBy(r => r.OperationalStatus)
            .OrderByDescending(g => g.Count())
            .First().Key;

        // Update ATM status
        atm.CurrentStatus.HasCash = hasMoneyNow;
        atm.CurrentStatus.OperationalStatus = operationalVotes;
        atm.CurrentStatus.ReliabilityScore = reliabilityScore;
        atm.CurrentStatus.LastVerified = DateTime.UtcNow;
        atm.CurrentStatus.TotalReports = recentReports.Count;

        // Sync the IsOnline field for kudi-cash-find compatibility
        atm.IsOnline = operationalVotes switch
        {
            OperationalStatus.Operational => "online",
            OperationalStatus.Offline => "offline",
            OperationalStatus.Maintenance => "maintenance",
            _ => "online"
        };

        await _atmRepository.UpdateAsync(atm);

        // Mark reports as verified or rejected
        await UpdateReportStatuses(recentReports, hasMoneyNow);
    }

    private async Task<double> CalculateReportWeight(List<StatusReport> reports)
    {
        double totalWeight = 0;

        foreach (var report in reports)
        {
            if (!string.IsNullOrEmpty(report.UserId))
            {
                var user = await _userRepository.GetByIdAsync(report.UserId);
                if (user != null)
                {
                    double userWeight = 0.5 + (user.ReputationScore / 100.0);
                    totalWeight += userWeight;
                    continue;
                }
            }

            // For anonymous reports, use the reporter_reputation from the frontend
            // or default weight of 1.0
            double anonWeight = 0.5 + (report.ReporterReputation / 100.0);
            totalWeight += anonWeight;
        }

        return totalWeight;
    }

    private int CalculateReliabilityScore(int totalReports, double winningWeight, int winningCount)
    {
        int baseScore = Math.Min(totalReports * 10, 50);
        double consensusRatio = winningCount / (double)totalReports;
        int consensusBonus = (int)(consensusRatio * 30);
        int trustBonus = (int)Math.Min(winningWeight * 5, 20);
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

        var consensusWindow = TimeSpan.FromMinutes(_settings.ConsensusCheckWindowMinutes);
        var recentReports = await _reportRepository.GetRecentReportsAsync(report.ATMId, consensusWindow);

        if (recentReports.Count >= 2)
        {
            var matchingReports = recentReports
                .Where(r => r.HasCash == report.HasCash)
                .Count();

            if (matchingReports > recentReports.Count / 2.0)
            {
                user.AccurateReports++;
                user.ReputationScore = Math.Min(
                    user.ReputationScore + _settings.ReputationGainOnConsensus, 100);
            }
            else
            {
                user.ReputationScore = Math.Max(
                    user.ReputationScore - _settings.ReputationLossOnDisagreement, 0);
            }
        }

        await _userRepository.UpdateAsync(user);
    }

    private StatusReportResponseDto MapToDto(StatusReport report)
    {
        // Derive the flat status_reported string from HasCash
        string statusReported = report.HasCash ? "has_money" : "no_money";

        return new StatusReportResponseDto(
            report.Id,
            report.ATMId,
            string.IsNullOrEmpty(report.UserId) ? null : report.UserId,
            report.HasCash,
            report.Notes,
            report.ReportedAt,
            report.Status.ToString(),
            statusReported,
            report.ReporterReputation,
            report.CreatedBy
        );
    }
}

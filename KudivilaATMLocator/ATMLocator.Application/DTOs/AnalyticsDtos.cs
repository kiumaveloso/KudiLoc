namespace ATMLocator.Application.DTOs;

public record SystemStatsDto(
    int TotalATMs,
    int TotalReports,
    int TotalUsers,
    int ATMsWithCash,
    int ATMsWithoutCash,
    int HighReliabilityATMs,
    List<ProvinceStatsDto> ByProvince,
    List<BankStatsDto> ByBank
);

public record ProvinceStatsDto(string Province, int TotalATMs, int WithCash);

public record BankStatsDto(string BankName, int TotalATMs, int WithCash);

public record ATMActivityDto(
    string ATMId,
    string Name,
    string BankName,
    bool CurrentHasCash,
    int ReliabilityScore,
    DateTime LastVerified,
    int TotalReportsAllTime,
    int ReportsLast24Hours,
    List<ReportSummaryDto> RecentReports
);

public record ReportSummaryDto(
    string Id,
    string UserId,
    bool HasCash,
    DateTime ReportedAt,
    string Status,
    string? Notes
);

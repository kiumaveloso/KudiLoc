namespace ATMLocator.Application.DTOs;

public record StatusReportResponseDto(
    string Id,
    string ATMId,
    string? UserId,
    bool HasCash,
    bool HasPaper,
    string OperationalStatus,
    string? Notes,
    DateTime ReportedAt,
    string Status,
    string StatusReported,
    int ReporterReputation,
    string? CreatedBy
);

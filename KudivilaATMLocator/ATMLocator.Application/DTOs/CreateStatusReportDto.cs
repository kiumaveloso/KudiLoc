namespace ATMLocator.Application.DTOs;

public record CreateStatusReportDto(
    string ATMId,
    string? UserId,
    bool HasCash,
    string? StatusReported,
    string? OperationalStatus,
    string? Notes,
    int? ReporterReputation,
    string? CreatedBy
);

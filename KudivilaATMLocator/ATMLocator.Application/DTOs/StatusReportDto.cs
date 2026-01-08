namespace ATMLocator.Application.DTOs;

public record CreateStatusReportDto(
    string ATMId,
    string UserId,
    bool HasCash,
    string? Notes
);

public record StatusReportResponseDto(
    string Id,
    string ATMId,
    string UserId,
    bool HasCash,
    DateTime ReportedAt,
    string Status,
    int ConfirmationCount
);
namespace ATMLocator.Application.DTOs;

public record StatusReportResponseDto(
    string Id,
    string ATMId,
    string UserId,
    bool HasCash,
    string? Notes,
    DateTime ReportedAt,
    string Status
);

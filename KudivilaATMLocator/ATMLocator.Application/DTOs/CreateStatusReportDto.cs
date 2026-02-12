namespace ATMLocator.Application.DTOs;

public record CreateStatusReportDto(
    string ATMId,
    string UserId,
    bool HasCash,
    string? OperationalStatus,
    string? Notes
);
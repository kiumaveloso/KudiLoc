namespace ATMLocator.Application.DTOs;

public record CreateStatusReportDto(
    string ATMId,
    string? UserId,
    bool HasCash,
    bool HasPaper = true,
    string? StatusReported = null,
    string? OperationalStatus = null,
    string? Notes = null,
    int? ReporterReputation = null,
    string? CreatedBy = null,
    double? Latitude = null,
    double? Longitude = null
);

using ATMLocator.Core.Entities;

namespace ATMLocator.Application.DTOs;

public record AdminSetStatusDto(bool HasCash, string? OperationalStatus = "Operational");

public record UpdateATMDto(
    string? Name,
    string? BankName,
    double? Latitude,
    double? Longitude,
    string? LocationName,
    string? Province,
    string? Municipality,
    string? Street,
    string? Neighborhood,
    string? Landmark,
    List<string>? SupportedServices,
    string? Status,
    string? IsOnline,
    bool? HasPaper,
    DateTime? LastReportTime,
    int? RecentReportsCount,
    WorkingHours? WorkingHours
);

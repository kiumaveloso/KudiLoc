namespace ATMLocator.Application.DTOs;

public record LocationDto(double Latitude, double Longitude, string Province, string Municipality);

public record ATMStatusDto(bool HasCash, string OperationalStatus, int ReliabilityScore, DateTime LastVerified, string StatusDescription, int TotalReports);

public record AddressDto(string Street, string Neighborhood, string? Landmark);

public record ATMDto(
    string Id,
    string Name,
    string BankName,
    LocationDto Location,
    ATMStatusDto Status,
    AddressDto Address,
    List<string> SupportedServices,
    List<string> PhotoUrls
);

/// <summary>
/// Flat DTO for kudi-cash-find frontend compatibility.
/// Uses snake_case field names via JSON serializer configuration.
/// </summary>
public record FlatATMDto(
    string Id,
    string BankName,
    string LocationName,
    double Latitude,
    double Longitude,
    string Status,
    string IsOnline,
    bool HasPaper,
    int ReliabilityScore,
    int RecentReportsCount,
    DateTime? LastReportTime,
    DateTime UpdatedDate
);

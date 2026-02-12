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

namespace ATMLocator.Application.DTOs;

public record UserLocationDto(
    double Latitude,
    double Longitude,
    double? RadiusKm = 5.0,
    string? PreferredBank = null,
    int? MinReliabilityScore = 30
);

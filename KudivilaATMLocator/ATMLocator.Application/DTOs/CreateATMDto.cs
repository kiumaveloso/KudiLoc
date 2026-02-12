namespace ATMLocator.Application.DTOs;

public record CreateATMDto(
    string Name,
    string BankName,
    double Latitude,
    double Longitude,
    string Province,
    string Municipality,
    string Street,
    string Neighborhood,
    string? Landmark,
    List<string> SupportedServices
);
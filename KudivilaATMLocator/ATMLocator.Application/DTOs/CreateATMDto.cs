namespace ATMLocator.Application.DTOs;

// Request DTOs
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

// Response DTOs
public record ATMDto(
    string Id,
    string Name,
    string BankName,
    LocationDto Location,
    AddressDto Address,
    ATMStatusDto Status,
    List<string> PhotoUrls, // NEW
    WorkingHoursDto? WorkingHours // NEW
);

public record LocationDto(
    double Latitude,
    double Longitude,
    string Province,
    string Municipality
);

public record AddressDto(
    string Street,
    string Neighborhood,
    string? Landmark
);

public record ATMStatusDto(
    bool HasCash,
    int ReliabilityScore,
    DateTime LastVerified,
    string StatusDescription
);

// NEW: Working hours DTO
public record WorkingHoursDto(
    bool Is24Hours,
    string? OpenTime,
    string? CloseTime,
    List<string> ClosedDays
);

// NEW: Photo upload DTO
public record UploadPhotoDto(
    string ATMId,
    string Base64Photo
);

public record AuthResponseDto(
    string Token,
    string UserId,
    string PhoneNumber,
    string? Name,
    int ReputationScore
);

public record LoginDto(
    string PhoneNumber
);
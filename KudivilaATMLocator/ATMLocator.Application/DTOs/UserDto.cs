namespace ATMLocator.Application.DTOs;

public record CreateUserDto(
    string PhoneNumber,
    string? Name
);

public record UserDto(
    string Id,
    string PhoneNumber,
    string? Name,
    int ReputationScore,
    int TotalReports,
    int AccurateReports
);
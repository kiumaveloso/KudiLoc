namespace ATMLocator.Application.DTOs;

public record UserDto(
    string Id,
    string? Name,
    int ReputationScore,
    int TotalReports,
    int AccurateReports,
    string Role,
    DateTime CreatedAt
);

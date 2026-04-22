namespace ATMLocator.Application.DTOs;

public record AuthResponseDto(
    string Token,
    string UserId,
    string PhoneNumber,
    string? Name,
    int ReputationScore,
    string? RefreshToken = null
);
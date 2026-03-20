namespace ATMLocator.Application.DTOs;

public record BadgeDto(
    string Id,
    string UserId,
    string BadgeType,
    DateTime EarnedAt
);

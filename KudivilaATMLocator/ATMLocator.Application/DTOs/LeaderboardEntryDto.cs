namespace ATMLocator.Application.DTOs;

public record LeaderboardEntryDto(
    string UserId,
    string? Name,
    int TotalReports,
    int AccurateReports,
    int ReputationScore,
    List<BadgeDto> Badges
);

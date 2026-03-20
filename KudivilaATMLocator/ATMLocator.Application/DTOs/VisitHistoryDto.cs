namespace ATMLocator.Application.DTOs;

public record VisitHistoryDto(
    string Id,
    string UserId,
    string ATMId,
    DateTime VisitedAt
);

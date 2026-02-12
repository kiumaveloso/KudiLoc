namespace ATMLocator.Application.DTOs;

public record PagedResultDto<T>(
    List<T> Items,
    int Page,
    int PageSize,
    int TotalCount,
    int TotalPages
);

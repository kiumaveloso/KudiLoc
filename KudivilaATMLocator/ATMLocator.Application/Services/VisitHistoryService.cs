using ATMLocator.Core.Entities;
using ATMLocator.Core.Interfaces;
using ATMLocator.Application.DTOs;

namespace ATMLocator.Application.Services;

public interface IVisitHistoryService
{
    Task RecordVisitAsync(string userId, string atmId);
    Task<List<VisitHistoryDto>> GetUserVisitsAsync(string userId, int limit = 50);
    Task<long> GetUniqueATMsVisitedAsync(string userId);
}

public class VisitHistoryService : IVisitHistoryService
{
    private readonly IVisitHistoryRepository _visitHistoryRepository;

    public VisitHistoryService(IVisitHistoryRepository visitHistoryRepository)
    {
        _visitHistoryRepository = visitHistoryRepository;
    }

    public async Task RecordVisitAsync(string userId, string atmId)
    {
        if (string.IsNullOrWhiteSpace(userId))
            throw new ArgumentException("ID do utilizador é obrigatório.", nameof(userId));

        if (string.IsNullOrWhiteSpace(atmId))
            throw new ArgumentException("ID do ATM é obrigatório.", nameof(atmId));

        await _visitHistoryRepository.RecordVisitAsync(new VisitHistory
        {
            UserId = userId,
            ATMId = atmId
        });
    }

    public async Task<List<VisitHistoryDto>> GetUserVisitsAsync(string userId, int limit = 50)
    {
        var visits = await _visitHistoryRepository.GetByUserIdAsync(userId, limit);
        return visits.Select(MapToDto).ToList();
    }

    public async Task<long> GetUniqueATMsVisitedAsync(string userId)
    {
        return await _visitHistoryRepository.CountUniqueATMsVisitedAsync(userId);
    }

    private static VisitHistoryDto MapToDto(VisitHistory visit)
    {
        return new VisitHistoryDto(
            visit.Id,
            visit.UserId,
            visit.ATMId,
            visit.VisitedAt
        );
    }
}

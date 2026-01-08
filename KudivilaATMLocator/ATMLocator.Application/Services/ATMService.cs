using ATMLocator.Core.Entities;
using ATMLocator.Core.Interfaces;
using ATMLocator.Application.DTOs;

namespace ATMLocator.Application.Services;

public interface IATMService
{
    Task<ATMDto> CreateATMAsync(CreateATMDto dto);
    Task<List<ATMDto>> GetNearbyATMsWithCashAsync(double latitude, double longitude, double radiusKm);
    Task<ATMDto?> GetATMByIdAsync(string id);
    Task<List<ATMDto>> GetATMsByProvinceAsync(string province);
    Task<List<ATMDto>> SearchATMsAsync(string searchTerm);
    Task<List<ATMDto>> GetATMsByBankAsync(string bankName);
    Task<bool> AddPhotoToATMAsync(string atmId, string photoUrl);
}

public class ATMService : IATMService
{
    private readonly IATMRepository _atmRepository;

    public ATMService(IATMRepository atmRepository)
    {
        _atmRepository = atmRepository;
    }

    public async Task<ATMDto> CreateATMAsync(CreateATMDto dto)
    {
        var atm = new ATM
        {
            Id = Guid.NewGuid().ToString(),
            Name = dto.Name,
            BankName = dto.BankName,
            Latitude = dto.Latitude,
            Longitude = dto.Longitude,
            Province = dto.Province,
            Municipality = dto.Municipality,
            Address = new Address
            {
                Street = dto.Street,
                Neighborhood = dto.Neighborhood,
                Landmark = dto.Landmark ?? string.Empty
            },
            SupportedServices = dto.SupportedServices,
            PhotoUrls = new List<string>(),
            CurrentStatus = new ATMStatus
            {
                HasCash = false,
                ReliabilityScore = 50,
                LastVerified = DateTime.UtcNow,
                TotalReports = 0
            },
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var created = await _atmRepository.CreateAsync(atm);
        return MapToDto(created);
    }

    public async Task<List<ATMDto>> GetNearbyATMsWithCashAsync(double latitude, double longitude, double radiusKm)
    {
        var atms = await _atmRepository.GetNearbyAsync(latitude, longitude, radiusKm);

        return atms
            .Where(a => a.CurrentStatus.HasCash && a.CurrentStatus.ReliabilityScore >= 30)
            .OrderByDescending(a => a.CurrentStatus.ReliabilityScore)
            .Select(MapToDto)
            .ToList();
    }

    public async Task<ATMDto?> GetATMByIdAsync(string id)
    {
        var atm = await _atmRepository.GetByIdAsync(id);
        return atm == null ? null : MapToDto(atm);
    }

    public async Task<List<ATMDto>> GetATMsByProvinceAsync(string province)
    {
        var atms = await _atmRepository.GetByProvinceAsync(province);
        return atms.Select(MapToDto).ToList();
    }

    public async Task<List<ATMDto>> SearchATMsAsync(string searchTerm)
    {
        var atms = await _atmRepository.SearchAsync(searchTerm);
        return atms.Select(MapToDto).ToList();
    }

    public async Task<List<ATMDto>> GetATMsByBankAsync(string bankName)
    {
        var atms = await _atmRepository.GetByBankNameAsync(bankName);
        return atms.Select(MapToDto).ToList();
    }

    public async Task<bool> AddPhotoToATMAsync(string atmId, string photoUrl)
    {
        return await _atmRepository.AddPhotoAsync(atmId, photoUrl);
    }

    private ATMDto MapToDto(ATM atm)
    {
        return new ATMDto(
            atm.Id,
            atm.Name,
            atm.BankName,
            new LocationDto(
                atm.Latitude,
                atm.Longitude,
                atm.Province,
                atm.Municipality
            ),
            new AddressDto(
                atm.Address.Street,
                atm.Address.Neighborhood,
                atm.Address.Landmark
            ),
            new ATMStatusDto(
                atm.CurrentStatus.HasCash,
                atm.CurrentStatus.ReliabilityScore,
                atm.CurrentStatus.LastVerified,
                GetStatusDescription(atm.CurrentStatus)
            ),
            atm.PhotoUrls,
            atm.WorkingHours != null
                ? new WorkingHoursDto(
                    atm.WorkingHours.Is24Hours,
                    atm.WorkingHours.OpenTime,
                    atm.WorkingHours.CloseTime,
                    atm.WorkingHours.ClosedDays
                )
                : null
        );
    }

    private string GetStatusDescription(ATMStatus status)
    {
        if (!status.HasCash) return "Sem dinheiro";
        if (status.ReliabilityScore >= 70) return "Confirmado com dinheiro";
        if (status.ReliabilityScore >= 40) return "Provavelmente tem dinheiro";
        return "Não verificado recentemente";
    }

}
using ATMLocator.Core.Entities;
using ATMLocator.Core.Interfaces;
using ATMLocator.Core.Settings;
using ATMLocator.Application.DTOs;
using Microsoft.Extensions.Options;

namespace ATMLocator.Application.Services;

public interface IATMService
{
    Task<ATMDto> CreateATMAsync(CreateATMDto dto);
    Task<List<ATMDto>> GetNearbyATMsWithCashAsync(double latitude, double longitude, double radiusKm);
    Task<ATMDto?> GetATMByIdAsync(string id);
    Task<PagedResultDto<ATMDto>> GetATMsByProvinceAsync(string province, int page = 1, int pageSize = 20);
    Task<PagedResultDto<ATMDto>> SearchATMsAsync(string searchTerm, int page = 1, int pageSize = 20);
    Task<PagedResultDto<ATMDto>> GetATMsByBankAsync(string bankName, int page = 1, int pageSize = 20);
    Task<bool> AddPhotoToATMAsync(string atmId, string photoUrl);
    Task<ATMDto?> UpdateATMAsync(string id, UpdateATMDto dto);
    Task<bool> DeleteATMAsync(string id);
}

public class ATMService : IATMService
{
    private const int MaxPageSize = 100;
    private readonly IATMRepository _atmRepository;
    private readonly ATMSettings _settings;

    public ATMService(IATMRepository atmRepository, IOptions<ATMSettings> settings)
    {
        _atmRepository = atmRepository;
        _settings = settings.Value;
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
                ReliabilityScore = _settings.InitialReliabilityScore,
                LastVerified = DateTime.UtcNow,
                TotalReports = 0
            },
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Populate the GeoJSON Location field from lat/lng for 2dsphere indexing
        atm.SyncLocation();

        var created = await _atmRepository.CreateAsync(atm);
        return MapToDto(created);
    }

    public async Task<List<ATMDto>> GetNearbyATMsWithCashAsync(double latitude, double longitude, double radiusKm)
    {
        var atms = await _atmRepository.GetNearbyAsync(latitude, longitude, radiusKm);

        return atms
            .Where(a => a.CurrentStatus.HasCash && a.CurrentStatus.ReliabilityScore >= _settings.MinReliabilityScore)
            .OrderByDescending(a => a.CurrentStatus.ReliabilityScore)
            .Select(MapToDto)
            .ToList();
    }

    public async Task<ATMDto?> GetATMByIdAsync(string id)
    {
        var atm = await _atmRepository.GetByIdAsync(id);
        return atm == null ? null : MapToDto(atm);
    }

    public async Task<PagedResultDto<ATMDto>> GetATMsByProvinceAsync(string province, int page = 1, int pageSize = 20)
    {
        pageSize = Math.Clamp(pageSize, 1, MaxPageSize);
        page = Math.Max(1, page);
        var skip = (page - 1) * pageSize;
        var atms = await _atmRepository.GetByProvinceAsync(province, skip, pageSize);
        var totalCount = await _atmRepository.CountByProvinceAsync(province);
        return new PagedResultDto<ATMDto>(
            atms.Select(MapToDto).ToList(),
            page, pageSize, (int)totalCount,
            (int)Math.Ceiling(totalCount / (double)pageSize)
        );
    }

    public async Task<PagedResultDto<ATMDto>> SearchATMsAsync(string searchTerm, int page = 1, int pageSize = 20)
    {
        pageSize = Math.Clamp(pageSize, 1, MaxPageSize);
        page = Math.Max(1, page);
        var skip = (page - 1) * pageSize;
        var atms = await _atmRepository.SearchAsync(searchTerm, skip, pageSize);
        var totalCount = await _atmRepository.CountSearchAsync(searchTerm);
        return new PagedResultDto<ATMDto>(
            atms.Select(MapToDto).ToList(),
            page, pageSize, (int)totalCount,
            (int)Math.Ceiling(totalCount / (double)pageSize)
        );
    }

    public async Task<PagedResultDto<ATMDto>> GetATMsByBankAsync(string bankName, int page = 1, int pageSize = 20)
    {
        pageSize = Math.Clamp(pageSize, 1, MaxPageSize);
        page = Math.Max(1, page);
        var skip = (page - 1) * pageSize;
        var atms = await _atmRepository.GetByBankNameAsync(bankName, skip, pageSize);
        var totalCount = await _atmRepository.CountByBankNameAsync(bankName);
        return new PagedResultDto<ATMDto>(
            atms.Select(MapToDto).ToList(),
            page, pageSize, (int)totalCount,
            (int)Math.Ceiling(totalCount / (double)pageSize)
        );
    }

    public async Task<bool> AddPhotoToATMAsync(string atmId, string photoUrl)
    {
        return await _atmRepository.AddPhotoAsync(atmId, photoUrl);
    }

    public async Task<ATMDto?> UpdateATMAsync(string id, UpdateATMDto dto)
    {
        var atm = await _atmRepository.GetByIdAsync(id);
        if (atm == null) return null;

        if (dto.Name != null) atm.Name = dto.Name;
        if (dto.BankName != null) atm.BankName = dto.BankName;
        if (dto.Latitude.HasValue) atm.Latitude = dto.Latitude.Value;
        if (dto.Longitude.HasValue) atm.Longitude = dto.Longitude.Value;
        if (dto.Province != null) atm.Province = dto.Province;
        if (dto.Municipality != null) atm.Municipality = dto.Municipality;
        if (dto.Street != null) atm.Address.Street = dto.Street;
        if (dto.Neighborhood != null) atm.Address.Neighborhood = dto.Neighborhood;
        if (dto.Landmark != null) atm.Address.Landmark = dto.Landmark;
        if (dto.SupportedServices != null) atm.SupportedServices = dto.SupportedServices;

        var updated = await _atmRepository.UpdateAsync(atm);
        return MapToDto(updated);
    }

    public async Task<bool> DeleteATMAsync(string id)
    {
        return await _atmRepository.DeleteAsync(id);
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
            new ATMStatusDto(
                atm.CurrentStatus.HasCash,
                atm.CurrentStatus.OperationalStatus.ToString(),
                atm.CurrentStatus.ReliabilityScore,
                atm.CurrentStatus.LastVerified,
                GetStatusDescription(atm.CurrentStatus),
                atm.CurrentStatus.TotalReports
            ),
            new AddressDto(
                atm.Address.Street,
                atm.Address.Neighborhood,
                atm.Address.Landmark
            ),
            atm.SupportedServices,
            atm.PhotoUrls
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

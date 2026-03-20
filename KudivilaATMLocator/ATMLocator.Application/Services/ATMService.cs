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

    // kudi-cash-find methods
    Task<List<FlatATMDto>> GetAllATMsFlatAsync(int limit = 200);
    Task<FlatATMDto?> GetFlatATMByIdAsync(string id);
    Task<FlatATMDto?> PatchATMAsync(string id, UpdateATMDto dto);
    Task<PagedResultDto<FlatATMDto>> GetAllATMsFlatPagedAsync(int skip, int limit);
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
            LocationName = dto.LocationName ?? string.Empty,
            Province = dto.Province ?? string.Empty,
            Municipality = dto.Municipality ?? string.Empty,
            Address = new Address
            {
                Street = dto.Street ?? string.Empty,
                Neighborhood = dto.Neighborhood ?? string.Empty,
                Landmark = dto.Landmark ?? string.Empty
            },
            WorkingHours = dto.WorkingHours,
            SupportedServices = dto.SupportedServices ?? new List<string>(),
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

        ApplyUpdateFields(atm, dto);

        var updated = await _atmRepository.UpdateAsync(atm);
        return MapToDto(updated);
    }

    public async Task<bool> DeleteATMAsync(string id)
    {
        return await _atmRepository.DeleteAsync(id);
    }

    // --- kudi-cash-find methods ---

    public async Task<List<FlatATMDto>> GetAllATMsFlatAsync(int limit = 200)
    {
        var atms = await _atmRepository.GetAllSortedByUpdatedAsync(limit);
        return atms.Select(MapToFlatDto).ToList();
    }

    public async Task<FlatATMDto?> GetFlatATMByIdAsync(string id)
    {
        var atm = await _atmRepository.GetByIdAsync(id);
        return atm == null ? null : MapToFlatDto(atm);
    }

    public async Task<FlatATMDto?> PatchATMAsync(string id, UpdateATMDto dto)
    {
        var atm = await _atmRepository.GetByIdAsync(id);
        if (atm == null) return null;

        ApplyUpdateFields(atm, dto);

        var updated = await _atmRepository.UpdateAsync(atm);
        return MapToFlatDto(updated);
    }

    public async Task<PagedResultDto<FlatATMDto>> GetAllATMsFlatPagedAsync(int skip, int limit)
    {
        var atms = await _atmRepository.GetAllSortedByUpdatedPagedAsync(skip, limit);
        var totalCount = await _atmRepository.CountAllAsync();
        var items = atms.Select(MapToFlatDto).ToList();
        return new PagedResultDto<FlatATMDto>(
            items,
            (skip / limit) + 1,
            limit,
            (int)totalCount,
            (int)Math.Ceiling(totalCount / (double)limit)
        );
    }

    // --- Shared update logic ---

    private void ApplyUpdateFields(ATM atm, UpdateATMDto dto)
    {
        if (dto.Name != null) atm.Name = dto.Name;
        if (dto.BankName != null) atm.BankName = dto.BankName;
        if (dto.Latitude.HasValue) atm.Latitude = dto.Latitude.Value;
        if (dto.Longitude.HasValue) atm.Longitude = dto.Longitude.Value;
        if (dto.LocationName != null) atm.LocationName = dto.LocationName;
        if (dto.Province != null) atm.Province = dto.Province;
        if (dto.Municipality != null) atm.Municipality = dto.Municipality;
        if (dto.Street != null) atm.Address.Street = dto.Street;
        if (dto.Neighborhood != null) atm.Address.Neighborhood = dto.Neighborhood;
        if (dto.Landmark != null) atm.Address.Landmark = dto.Landmark;
        if (dto.SupportedServices != null) atm.SupportedServices = dto.SupportedServices;

        // kudi-cash-find status fields
        if (dto.Status != null)
        {
            // Map flat status string to internal HasCash + ReliabilityScore
            switch (dto.Status.ToLowerInvariant())
            {
                case "has_money":
                    atm.CurrentStatus.HasCash = true;
                    break;
                case "no_money":
                    atm.CurrentStatus.HasCash = false;
                    break;
                case "uncertain":
                    atm.CurrentStatus.HasCash = false;
                    atm.CurrentStatus.ReliabilityScore = 0;
                    break;
            }
        }

        if (dto.IsOnline != null)
        {
            atm.IsOnline = dto.IsOnline;
            // Also sync to the enum-based OperationalStatus
            atm.CurrentStatus.OperationalStatus = dto.IsOnline.ToLowerInvariant() switch
            {
                "online" => OperationalStatus.Operational,
                "offline" => OperationalStatus.Offline,
                "maintenance" => OperationalStatus.Maintenance,
                _ => atm.CurrentStatus.OperationalStatus
            };
        }

        if (dto.HasPaper.HasValue) atm.HasPaper = dto.HasPaper.Value;
        if (dto.LastReportTime.HasValue) atm.LastReportTime = dto.LastReportTime.Value;
        if (dto.RecentReportsCount.HasValue) atm.RecentReportsCount = dto.RecentReportsCount.Value;
        if (dto.WorkingHours != null) atm.WorkingHours = dto.WorkingHours;
    }

    // --- Mapping ---

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

    /// <summary>
    /// Maps an ATM entity to the flat DTO format expected by kudi-cash-find frontend.
    /// </summary>
    private FlatATMDto MapToFlatDto(ATM atm)
    {
        // Derive the flat "status" string from internal HasCash + ReliabilityScore
        string status;
        if (atm.CurrentStatus.HasCash)
            status = "has_money";
        else if (atm.CurrentStatus.ReliabilityScore == 0 && atm.CurrentStatus.TotalReports == 0)
            status = "uncertain";
        else
            status = "no_money";

        // Derive "is_online" from the OperationalStatus enum, preferring the stored IsOnline
        // string if it was explicitly set by the frontend
        string isOnline = !string.IsNullOrEmpty(atm.IsOnline) && atm.IsOnline != "online"
            ? atm.IsOnline
            : atm.CurrentStatus.OperationalStatus switch
            {
                OperationalStatus.Operational => "online",
                OperationalStatus.Offline => "offline",
                OperationalStatus.Maintenance => "maintenance",
                _ => "online"
            };

        return new FlatATMDto(
            atm.Id,
            atm.BankName,
            !string.IsNullOrEmpty(atm.LocationName) ? atm.LocationName : atm.Name,
            atm.Latitude,
            atm.Longitude,
            status,
            isOnline,
            atm.HasPaper,
            atm.CurrentStatus.ReliabilityScore,
            atm.RecentReportsCount,
            atm.LastReportTime,
            atm.UpdatedAt
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

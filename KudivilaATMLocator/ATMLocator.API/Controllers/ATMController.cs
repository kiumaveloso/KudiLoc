using ATMLocator.Application.DTOs;
using ATMLocator.Application.Services;
using ATMLocator.API.Services;
using ATMLocator.Core.Helpers;
using ATMLocator.Core.Settings;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Asp.Versioning;

namespace ATMLocator.API.Controllers;

[ApiVersion("1.0")]
[ApiController]
[Route("api/v{version:apiVersion}/[controller]")]
[Route("api/[controller]")]
public class ATMController : ControllerBase
{
    private readonly IATMService _atmService;
    private readonly IPhotoService _photoService;
    private readonly ILogger<ATMController> _logger;
    private readonly ATMSettings _atmSettings;

    public ATMController(
        IATMService atmService,
        IPhotoService photoService,
        ILogger<ATMController> logger,
        IOptions<ATMSettings> atmSettings)
    {
        _atmService = atmService;
        _photoService = photoService;
        _logger = logger;
        _atmSettings = atmSettings.Value;
    }

    /// <summary>
    /// List all ATMs in flat format for kudi-cash-find frontend.
    /// Supports ?id= filter, ?sort=, ?limit=, ?page= and ?pageSize= query params.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<FlatATMDto>>> GetAllATMs(
        [FromQuery] string? sort = "-updated_date",
        [FromQuery] int limit = 200,
        [FromQuery] string? id = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        try
        {
            // If id query param is provided, return a single-item array with that ATM
            if (!string.IsNullOrEmpty(id))
            {
                var singleAtm = await _atmService.GetFlatATMByIdAsync(id);
                if (singleAtm == null)
                {
                    return Ok(new List<FlatATMDto>());
                }
                return Ok(new List<FlatATMDto> { singleAtm });
            }

            pageSize = Math.Clamp(pageSize, 1, 100);
            page = Math.Max(1, page);
            limit = Math.Clamp(limit, 1, 500);

            // Use the smaller of limit and pageSize for actual page size
            var effectivePageSize = Math.Min(limit, pageSize);
            var skip = (page - 1) * effectivePageSize;

            var result = await _atmService.GetAllATMsFlatPagedAsync(skip, effectivePageSize);
            Response.Headers["X-Total-Count"] = result.TotalCount.ToString();
            Response.Headers["X-Page"] = page.ToString();
            Response.Headers["X-Page-Size"] = effectivePageSize.ToString();

            return Ok(result.Items);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all ATMs");
            return StatusCode(500, new { statusCode = 500, message = "Erro ao buscar caixas automáticos" });
        }
    }

    [HttpGet("nearby")]
    public async Task<ActionResult<List<ATMDto>>> GetNearbyATMs(
        [FromQuery] double latitude,
        [FromQuery] double longitude,
        [FromQuery] double? radiusKm = null)
    {
        try
        {
            var atms = await _atmService.GetNearbyATMsWithCashAsync(
                latitude, longitude, radiusKm ?? _atmSettings.DefaultSearchRadiusKm);
            return Ok(atms);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting nearby ATMs");
            return StatusCode(500, new { statusCode = 500, message = "Erro ao buscar caixas automáticos" });
        }
    }

    [HttpPost("nearby/auto")]
    public async Task<ActionResult> GetATMsAtMyLocation([FromBody] UserLocationDto location)
    {
        try
        {
            var radiusKm = location.RadiusKm ?? _atmSettings.DefaultSearchRadiusKm;

            var atms = await _atmService.GetNearbyATMsWithCashAsync(
                location.Latitude,
                location.Longitude,
                radiusKm
            );

            if (!atms.Any())
            {
                atms = await _atmService.GetNearbyATMsWithCashAsync(
                    location.Latitude,
                    location.Longitude,
                    _atmSettings.FallbackSearchRadiusKm
                );
            }

            return Ok(new
            {
                userLocation = new
                {
                    latitude = location.Latitude,
                    longitude = location.Longitude
                },
                searchRadius = radiusKm,
                totalATMsFound = atms.Count,
                atms = atms
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting ATMs at user location: {Lat}, {Lon}",
                location.Latitude, location.Longitude);
            return StatusCode(500, new { statusCode = 500, message = "Erro ao buscar caixas automáticos próximos" });
        }
    }

    [HttpPost("nearby/auto/sorted")]
    public async Task<ActionResult> GetATMsAtMyLocationSorted([FromBody] UserLocationDto location)
    {
        try
        {
            var atms = await _atmService.GetNearbyATMsWithCashAsync(
                location.Latitude,
                location.Longitude,
                location.RadiusKm ?? _atmSettings.DefaultSearchRadiusKm
            );

            var atmsWithDistance = atms.Select(atm => new
            {
                atm.Id,
                atm.Name,
                atm.BankName,
                atm.Location,
                atm.Status,
                atm.Address,
                distanceKm = Math.Round(GeoUtils.HaversineDistanceKm(
                    location.Latitude, location.Longitude,
                    atm.Location.Latitude, atm.Location.Longitude
                ), 2),
                estimatedWalkingTime = (int)(GeoUtils.HaversineDistanceKm(
                    location.Latitude, location.Longitude,
                    atm.Location.Latitude, atm.Location.Longitude
                ) * _atmSettings.WalkingMinutesPerKm)
            })
            .OrderBy(x => x.distanceKm)
            .ToList();

            return Ok(new
            {
                userLocation = new
                {
                    latitude = location.Latitude,
                    longitude = location.Longitude
                },
                totalATMsFound = atmsWithDistance.Count,
                atms = atmsWithDistance
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting sorted ATMs: {Lat}, {Lon}",
                location.Latitude, location.Longitude);
            return StatusCode(500, new { statusCode = 500, message = "Erro ao buscar caixas automáticos" });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ATMDto>> GetATMById(string id)
    {
        try
        {
            var atm = await _atmService.GetATMByIdAsync(id);

            if (atm == null)
            {
                return NotFound(new { statusCode = 404, message = "Caixa automático não encontrado" });
            }

            return Ok(atm);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting ATM by ID: {Id}", id);
            return StatusCode(500, new { statusCode = 500, message = "Erro ao buscar caixa automático" });
        }
    }

    [ResponseCache(Duration = 30, VaryByQueryKeys = ["page", "pageSize"])]
    [HttpGet("province/{province}")]
    public async Task<ActionResult<PagedResultDto<ATMDto>>> GetATMsByProvince(
        string province,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var result = await _atmService.GetATMsByProvinceAsync(province, page, pageSize);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting ATMs by province: {Province}", province);
            return StatusCode(500, new { statusCode = 500, message = "Erro ao buscar caixas automáticos" });
        }
    }

    [ResponseCache(Duration = 15, VaryByQueryKeys = ["query", "page", "pageSize"])]
    [HttpGet("search")]
    public async Task<ActionResult<PagedResultDto<ATMDto>>> SearchATMs(
        [FromQuery] string query,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return BadRequest(new { statusCode = 400, message = "Termo de pesquisa é obrigatório" });
            }

            var result = await _atmService.SearchATMsAsync(query, page, pageSize);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching ATMs: {Query}", query);
            return StatusCode(500, new { statusCode = 500, message = "Erro ao pesquisar caixas automáticos" });
        }
    }

    [ResponseCache(Duration = 30, VaryByQueryKeys = ["page", "pageSize"])]
    [HttpGet("bank/{bankName}")]
    public async Task<ActionResult<PagedResultDto<ATMDto>>> GetATMsByBank(
        string bankName,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var result = await _atmService.GetATMsByBankAsync(bankName, page, pageSize);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting ATMs by bank: {BankName}", bankName);
            return StatusCode(500, new { statusCode = 500, message = "Erro ao buscar caixas automáticos" });
        }
    }

    /// <summary>
    /// Create a new ATM. AllowAnonymous for kudi-cash-find frontend compatibility.
    /// </summary>
    [AllowAnonymous]
    [HttpPost]
    public async Task<ActionResult<ATMDto>> CreateATM([FromBody] CreateATMDto dto)
    {
        try
        {
            var atm = await _atmService.CreateATMAsync(dto);
            return CreatedAtAction(nameof(GetATMById), new { id = atm.Id }, atm);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating ATM");
            return StatusCode(500, new { statusCode = 500, message = "Erro ao criar caixa automático" });
        }
    }

    /// <summary>
    /// Partial update an ATM. AllowAnonymous for kudi-cash-find status updates.
    /// </summary>
    [AllowAnonymous]
    [HttpPatch("{id}")]
    public async Task<ActionResult<FlatATMDto>> PatchATM(string id, [FromBody] UpdateATMDto dto)
    {
        try
        {
            var atm = await _atmService.PatchATMAsync(id, dto);
            if (atm == null)
            {
                return NotFound(new { statusCode = 404, message = "Caixa automático não encontrado" });
            }
            return Ok(atm);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error patching ATM: {Id}", id);
            return StatusCode(500, new { statusCode = 500, message = "Erro ao atualizar caixa automático" });
        }
    }

    [Authorize]
    [HttpPut("{id}")]
    public async Task<ActionResult<ATMDto>> UpdateATM(string id, [FromBody] UpdateATMDto dto)
    {
        try
        {
            var atm = await _atmService.UpdateATMAsync(id, dto);
            if (atm == null)
            {
                return NotFound(new { statusCode = 404, message = "Caixa automático não encontrado" });
            }
            return Ok(atm);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating ATM: {Id}", id);
            return StatusCode(500, new { statusCode = 500, message = "Erro ao atualizar caixa automático" });
        }
    }

    [Authorize]
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteATM(string id)
    {
        try
        {
            var deleted = await _atmService.DeleteATMAsync(id);
            if (!deleted)
            {
                return NotFound(new { statusCode = 404, message = "Caixa automático não encontrado" });
            }
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting ATM: {Id}", id);
            return StatusCode(500, new { statusCode = 500, message = "Erro ao eliminar caixa automático" });
        }
    }

    [Authorize]
    [HttpPost("{id}/photo")]
    [RequestSizeLimit(8 * 1024 * 1024)] // 8 MB for photo uploads (Base64 inflates ~33%)
    public async Task<ActionResult> UploadPhoto(string id, [FromBody] UploadPhotoDto dto)
    {
        try
        {
            var atm = await _atmService.GetATMByIdAsync(id);
            if (atm == null)
            {
                return NotFound(new { statusCode = 404, message = "Caixa automático não encontrado" });
            }

            var photoBytes = Convert.FromBase64String(dto.Base64Photo);
            var fileName = await _photoService.SavePhotoAsync(photoBytes, id);
            var photoUrl = _photoService.GetPhotoUrl(fileName);

            await _atmService.AddPhotoToATMAsync(id, photoUrl);

            return Ok(new { photoUrl, message = "Foto carregada com sucesso" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading photo for ATM: {Id}", id);
            return StatusCode(500, new { statusCode = 500, message = "Erro ao carregar foto" });
        }
    }

}

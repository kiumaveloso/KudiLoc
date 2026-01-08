using ATMLocator.Application.DTOs;
using ATMLocator.Application.Services;
using ATMLocator.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace ATMLocator.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ATMController : ControllerBase
{
    private readonly IATMService _atmService;
    private readonly IPhotoService _photoService;
    private readonly ILogger<ATMController> _logger;

    public ATMController(
        IATMService atmService, 
        IPhotoService photoService,
        ILogger<ATMController> logger)
    {
        _atmService = atmService;
        _photoService = photoService;
        _logger = logger;
    }

    /// <summary>
    /// Get ATMs near a location with cash available
    /// </summary>
    [HttpGet("nearby")]
    public async Task<ActionResult<List<ATMDto>>> GetNearbyATMs(
        [FromQuery] double latitude, 
        [FromQuery] double longitude, 
        [FromQuery] double radiusKm = 5.0)
    {
        try
        {
            var atms = await _atmService.GetNearbyATMsWithCashAsync(latitude, longitude, radiusKm);
            return Ok(atms);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting nearby ATMs");
            return StatusCode(500, "Erro ao buscar caixas automáticos");
        }
    }

    /// <summary>
    /// Get ATM by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<ATMDto>> GetATMById(string id)
    {
        try
        {
            var atm = await _atmService.GetATMByIdAsync(id);
            
            if (atm == null)
            {
                return NotFound("Caixa automático não encontrado");
            }

            return Ok(atm);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting ATM by ID: {Id}", id);
            return StatusCode(500, "Erro ao buscar caixa automático");
        }
    }

    /// <summary>
    /// Get ATMs by province
    /// </summary>
    [HttpGet("province/{province}")]
    public async Task<ActionResult<List<ATMDto>>> GetATMsByProvince(string province)
    {
        try
        {
            var atms = await _atmService.GetATMsByProvinceAsync(province);
            return Ok(atms);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting ATMs by province: {Province}", province);
            return StatusCode(500, "Erro ao buscar caixas automáticos");
        }
    }

    /// <summary>
    /// Search ATMs by name, bank, neighborhood, or landmark
    /// </summary>
    [HttpGet("search")]
    public async Task<ActionResult<List<ATMDto>>> SearchATMs([FromQuery] string query)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return BadRequest("Termo de pesquisa é obrigatório");
            }

            var atms = await _atmService.SearchATMsAsync(query);
            return Ok(atms);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching ATMs: {Query}", query);
            return StatusCode(500, "Erro ao pesquisar caixas automáticos");
        }
    }

    /// <summary>
    /// Get ATMs by bank name
    /// </summary>
    [HttpGet("bank/{bankName}")]
    public async Task<ActionResult<List<ATMDto>>> GetATMsByBank(string bankName)
    {
        try
        {
            var atms = await _atmService.GetATMsByBankAsync(bankName);
            return Ok(atms);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting ATMs by bank: {BankName}", bankName);
            return StatusCode(500, "Erro ao buscar caixas automáticos");
        }
    }

    /// <summary>
    /// Create a new ATM
    /// </summary>
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
            return StatusCode(500, "Erro ao criar caixa automático");
        }
    }

    /// <summary>
    /// Upload photo for an ATM
    /// </summary>
    [HttpPost("{id}/photo")]
    public async Task<ActionResult> UploadPhoto(string id, [FromBody] UploadPhotoDto dto)
    {
        try
        {
            // Verify ATM exists
            var atm = await _atmService.GetATMByIdAsync(id);
            if (atm == null)
            {
                return NotFound("Caixa automático não encontrado");
            }

            // Convert base64 to bytes
            var photoBytes = Convert.FromBase64String(dto.Base64Photo);

            // Save photo
            var fileName = await _photoService.SavePhotoAsync(photoBytes, id);
            var photoUrl = _photoService.GetPhotoUrl(fileName);

            // Add to ATM
            await _atmService.AddPhotoToATMAsync(id, photoUrl);

            return Ok(new { photoUrl, message = "Foto carregada com sucesso" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading photo for ATM: {Id}", id);
            return StatusCode(500, "Erro ao carregar foto");
        }
    }
}
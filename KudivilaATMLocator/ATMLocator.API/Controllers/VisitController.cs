using ATMLocator.Application.DTOs;
using ATMLocator.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Asp.Versioning;

namespace ATMLocator.API.Controllers;

[ApiVersion("1.0")]
[ApiController]
[Route("api/v{version:apiVersion}/[controller]")]
[Route("api/[controller]")]
[Authorize]
public class VisitController : ControllerBase
{
    private readonly IVisitHistoryService _visitHistoryService;
    private readonly ILogger<VisitController> _logger;

    public VisitController(IVisitHistoryService visitHistoryService, ILogger<VisitController> logger)
    {
        _visitHistoryService = visitHistoryService;
        _logger = logger;
    }

    /// <summary>
    /// Record a visit to an ATM (requires auth)
    /// </summary>
    [HttpPost]
    public async Task<ActionResult> RecordVisit([FromBody] RecordVisitRequest request)
    {
        try
        {
            var userId = User.FindFirst("sub")?.Value
                         ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new { statusCode = 401, message = "Utilizador não autenticado" });

            await _visitHistoryService.RecordVisitAsync(userId, request.ATMId);
            return Ok(new { message = "Visita registada com sucesso" });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { statusCode = 400, message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error recording visit");
            return StatusCode(500, new { statusCode = 500, message = "Erro ao registar visita" });
        }
    }

    /// <summary>
    /// Get own visit history (requires auth)
    /// </summary>
    [HttpGet("me")]
    public async Task<ActionResult<List<VisitHistoryDto>>> GetMyVisits([FromQuery] int limit = 50)
    {
        try
        {
            var userId = User.FindFirst("sub")?.Value
                         ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new { statusCode = 401, message = "Utilizador não autenticado" });

            var visits = await _visitHistoryService.GetUserVisitsAsync(userId, limit);
            return Ok(visits);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting visit history");
            return StatusCode(500, new { statusCode = 500, message = "Erro ao buscar histórico de visitas" });
        }
    }

    /// <summary>
    /// Get count of unique ATMs visited (requires auth)
    /// </summary>
    [HttpGet("me/count")]
    public async Task<ActionResult> GetUniqueATMsVisited()
    {
        try
        {
            var userId = User.FindFirst("sub")?.Value
                         ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new { statusCode = 401, message = "Utilizador não autenticado" });

            var count = await _visitHistoryService.GetUniqueATMsVisitedAsync(userId);
            return Ok(new { unique_atms_visited = count });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting unique ATMs visited count");
            return StatusCode(500, new { statusCode = 500, message = "Erro ao contar ATMs visitados" });
        }
    }
}

/// <summary>
/// Request body for recording a visit
/// </summary>
public class RecordVisitRequest
{
    public string ATMId { get; set; } = string.Empty;
}

using ATMLocator.Application.DTOs;
using ATMLocator.Application.Services;
using Microsoft.AspNetCore.Mvc;
using Asp.Versioning;

namespace ATMLocator.API.Controllers;

[ApiVersion("1.0")]
[ApiController]
[Route("api/v{version:apiVersion}/[controller]")]
[Route("api/[controller]")]
public class AnalyticsController : ControllerBase
{
    private readonly IAnalyticsService _analyticsService;
    private readonly ILogger<AnalyticsController> _logger;

    public AnalyticsController(IAnalyticsService analyticsService, ILogger<AnalyticsController> logger)
    {
        _analyticsService = analyticsService;
        _logger = logger;
    }

    /// <summary>
    /// Get overall system statistics
    /// </summary>
    [ResponseCache(Duration = 60)]
    [HttpGet("stats")]
    public async Task<ActionResult<SystemStatsDto>> GetSystemStats()
    {
        try
        {
            var stats = await _analyticsService.GetSystemStatsAsync();
            return Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting system stats");
            return StatusCode(500, new { statusCode = 500, message = "Erro ao buscar estatísticas do sistema" });
        }
    }

    /// <summary>
    /// Get activity history for a specific ATM
    /// </summary>
    [HttpGet("atm/{atmId}/activity")]
    public async Task<ActionResult<ATMActivityDto>> GetATMActivity(string atmId)
    {
        try
        {
            var activity = await _analyticsService.GetATMActivityAsync(atmId);
            return Ok(activity);
        }
        catch (ArgumentException ex)
        {
            return NotFound(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting ATM activity: {AtmId}", atmId);
            return StatusCode(500, new { statusCode = 500, message = "Erro ao buscar atividade do ATM" });
        }
    }
}

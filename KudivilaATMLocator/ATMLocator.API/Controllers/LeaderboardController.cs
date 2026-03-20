using ATMLocator.Application.DTOs;
using ATMLocator.Application.Services;
using Microsoft.AspNetCore.Mvc;
using Asp.Versioning;

namespace ATMLocator.API.Controllers;

[ApiVersion("1.0")]
[ApiController]
[Route("api/v{version:apiVersion}/[controller]")]
[Route("api/[controller]")]
public class LeaderboardController : ControllerBase
{
    private readonly IBadgeService _badgeService;
    private readonly ILogger<LeaderboardController> _logger;

    public LeaderboardController(IBadgeService badgeService, ILogger<LeaderboardController> logger)
    {
        _badgeService = badgeService;
        _logger = logger;
    }

    /// <summary>
    /// Get the top contributors leaderboard
    /// </summary>
    [ResponseCache(Duration = 60)]
    [HttpGet]
    public async Task<ActionResult<List<LeaderboardEntryDto>>> GetLeaderboard([FromQuery] int limit = 20)
    {
        try
        {
            limit = Math.Clamp(limit, 1, 100);
            var leaderboard = await _badgeService.GetLeaderboardAsync(limit);
            return Ok(leaderboard);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting leaderboard");
            return StatusCode(500, new { statusCode = 500, message = "Erro ao buscar classificação" });
        }
    }
}

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
public class BadgeController : ControllerBase
{
    private readonly IBadgeService _badgeService;
    private readonly ILogger<BadgeController> _logger;

    public BadgeController(IBadgeService badgeService, ILogger<BadgeController> logger)
    {
        _badgeService = badgeService;
        _logger = logger;
    }

    /// <summary>
    /// Get badges for a specific user
    /// </summary>
    [HttpGet("user/{userId}")]
    public async Task<ActionResult<List<BadgeDto>>> GetUserBadges(string userId)
    {
        try
        {
            var badges = await _badgeService.GetUserBadgesAsync(userId);
            return Ok(badges);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting badges for user: {UserId}", userId);
            return StatusCode(500, new { statusCode = 500, message = "Erro ao buscar conquistas" });
        }
    }

    /// <summary>
    /// Trigger badge check for a user (requires auth)
    /// </summary>
    [Authorize]
    [HttpPost("check/{userId}")]
    public async Task<ActionResult> CheckBadges(string userId)
    {
        try
        {
            await _badgeService.CheckAndAwardBadgesAsync(userId);
            var badges = await _badgeService.GetUserBadgesAsync(userId);
            return Ok(badges);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking badges for user: {UserId}", userId);
            return StatusCode(500, new { statusCode = 500, message = "Erro ao verificar conquistas" });
        }
    }
}

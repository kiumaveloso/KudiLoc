using ATMLocator.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Asp.Versioning;

namespace ATMLocator.API.Controllers;

/// <summary>
/// Admin bootstrap and management endpoints.
/// Protected by X-API-Key header (see ApiKeyMiddleware) — no JWT required.
/// </summary>
[ApiVersion("1.0")]
[ApiController]
[Route("api/v{version:apiVersion}/[controller]")]
[Route("api/[controller]")]
[AllowAnonymous]
public class AdminController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly ILogger<AdminController> _logger;

    public AdminController(IUserService userService, ILogger<AdminController> logger)
    {
        _userService = userService;
        _logger = logger;
    }

    /// <summary>
    /// Bootstrap endpoint — promotes a user to Admin role.
    /// Requires only the X-API-Key header (no JWT needed).
    /// Use this to set up the first admin account.
    /// </summary>
    [HttpPost("promote")]
    public async Task<IActionResult> PromoteToAdmin([FromBody] PromoteAdminDto dto)
    {
        try
        {
            var user = await _userService.AssignRoleAsync(dto.UserId, "Admin");
            _logger.LogWarning("User {UserId} promoted to Admin via bootstrap endpoint", dto.UserId);
            return Ok(new
            {
                message = $"Utilizador {user.Name ?? dto.UserId} promovido a Admin com sucesso.",
                userId = user.Id,
                role = "Admin"
            });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error promoting user {UserId} to Admin", dto.UserId);
            return StatusCode(500, new { message = "Erro ao promover utilizador." });
        }
    }

    /// <summary>
    /// Returns the ID of the authenticated user (requires JWT).
    /// Use this to find your user ID before calling /promote.
    /// </summary>
    [Authorize]
    [HttpGet("me")]
    public IActionResult GetMyId()
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var role = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
        return Ok(new { userId, role });
    }
}

public record PromoteAdminDto(string UserId);

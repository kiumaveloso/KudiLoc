using ATMLocator.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Asp.Versioning;

namespace ATMLocator.API.Controllers;

[ApiVersion("1.0")]
[ApiController]
[Route("api/v{version:apiVersion}/[controller]")]
[Route("api/[controller]")]
[Authorize(Roles = "admin")]
public class AuditController : ControllerBase
{
    private readonly ILoginAuditRepository _auditRepo;

    public AuditController(ILoginAuditRepository auditRepo)
    {
        _auditRepo = auditRepo;
    }

    /// <summary>Get recent login audit events for a specific user (admin only)</summary>
    [HttpGet("user/{userId}")]
    public async Task<IActionResult> GetUserAudit(string userId, [FromQuery] int limit = 20)
    {
        var logs = await _auditRepo.GetRecentByUserAsync(userId, Math.Min(limit, 100));
        return Ok(logs);
    }
}

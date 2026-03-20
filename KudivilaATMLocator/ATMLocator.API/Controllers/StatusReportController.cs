using ATMLocator.Application.DTOs;
using ATMLocator.Application.Services;
using ATMLocator.API.Hubs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Asp.Versioning;

namespace ATMLocator.API.Controllers;

[ApiVersion("1.0")]
[ApiController]
[Route("api/v{version:apiVersion}/[controller]")]
[Route("api/[controller]")]
public class StatusReportController : ControllerBase
{
    private readonly IStatusReportService _reportService;
    private readonly IHubContext<ATMStatusHub> _hubContext;
    private readonly ILogger<StatusReportController> _logger;

    public StatusReportController(
        IStatusReportService reportService,
        IHubContext<ATMStatusHub> hubContext,
        ILogger<StatusReportController> logger)
    {
        _reportService = reportService;
        _hubContext = hubContext;
        _logger = logger;
    }

    /// <summary>
    /// Submit a status report for an ATM (crowd-sourcing).
    /// AllowAnonymous for kudi-cash-find frontend compatibility.
    /// </summary>
    [AllowAnonymous]
    [HttpPost]
    public async Task<ActionResult<StatusReportResponseDto>> SubmitReport(
        [FromBody] CreateStatusReportDto dto)
    {
        try
        {
            var report = await _reportService.SubmitReportAsync(dto, async (atmId, payload) =>
            {
                await _hubContext.Clients.Group($"atm-{atmId}").SendAsync("ATMStatusUpdated", payload);
            });
            return Ok(new
            {
                message = "Relatório submetido com sucesso! Obrigado por ajudar a comunidade.",
                report
            });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { statusCode = 400, message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(429, new { statusCode = 429, message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error submitting report");
            return StatusCode(500, new { statusCode = 500, message = "Erro ao submeter relatório" });
        }
    }

    /// <summary>
    /// Get recent reports for an ATM
    /// </summary>
    [HttpGet("atm/{atmId}")]
    public async Task<ActionResult> GetRecentReports(
        string atmId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var result = await _reportService.GetRecentReportsAsync(atmId, page, pageSize);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting reports for ATM: {AtmId}", atmId);
            return StatusCode(500, new { statusCode = 500, message = "Erro ao buscar relatórios" });
        }
    }
}

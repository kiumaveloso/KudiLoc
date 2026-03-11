using ATMLocator.Application.DTOs;
using ATMLocator.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Asp.Versioning;

namespace ATMLocator.API.Controllers;

/// <summary>
/// Alias controller at /api/reports for kudi-cash-find frontend compatibility.
/// The frontend expects POST /api/reports and GET /api/reports?atm_id=...
/// </summary>
[ApiVersion("1.0")]
[ApiController]
[Route("api/v{version:apiVersion}/reports")]
[Route("api/reports")]
public class ReportController : ControllerBase
{
    private readonly IStatusReportService _reportService;
    private readonly ILogger<ReportController> _logger;

    public ReportController(
        IStatusReportService reportService,
        ILogger<ReportController> logger)
    {
        _reportService = reportService;
        _logger = logger;
    }

    /// <summary>
    /// Create a report. Accepts the kudi-cash-find flat format:
    /// { atm_id, status_reported, reporter_reputation, created_by }
    /// </summary>
    [AllowAnonymous]
    [HttpPost]
    public async Task<ActionResult<StatusReportResponseDto>> CreateReport(
        [FromBody] CreateStatusReportDto dto)
    {
        try
        {
            var report = await _reportService.SubmitReportAsync(dto);
            return Ok(report);
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
            _logger.LogError(ex, "Error creating report");
            return StatusCode(500, new { statusCode = 500, message = "Erro ao submeter relatório" });
        }
    }

    /// <summary>
    /// Get reports filtered by atm_id or created_by query params.
    /// GET /api/reports?atm_id={id}&sort=-created_date&limit=20
    /// GET /api/reports?created_by={email}&sort=-created_date&limit=100
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<StatusReportResponseDto>>> GetReports(
        [FromQuery(Name = "atm_id")] string? atmId = null,
        [FromQuery(Name = "created_by")] string? createdBy = null,
        [FromQuery] string? sort = "-created_date",
        [FromQuery] int limit = 20)
    {
        try
        {
            limit = Math.Clamp(limit, 1, 200);

            if (!string.IsNullOrEmpty(atmId))
            {
                var reports = await _reportService.GetReportsByATMIdFlatAsync(atmId, limit);
                return Ok(reports);
            }

            if (!string.IsNullOrEmpty(createdBy))
            {
                var reports = await _reportService.GetReportsByCreatorAsync(createdBy, limit);
                return Ok(reports);
            }

            // No filter provided — return empty list rather than all reports
            return Ok(new List<StatusReportResponseDto>());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting reports");
            return StatusCode(500, new { statusCode = 500, message = "Erro ao buscar relatórios" });
        }
    }
}

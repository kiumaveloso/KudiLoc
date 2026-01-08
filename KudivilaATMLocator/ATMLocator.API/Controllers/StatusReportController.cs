using ATMLocator.Application.DTOs;
using ATMLocator.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace ATMLocator.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StatusReportController : ControllerBase
{
    private readonly IStatusReportService _reportService;
    private readonly ILogger<StatusReportController> _logger;

    public StatusReportController(
        IStatusReportService reportService, 
        ILogger<StatusReportController> logger)
    {
        _reportService = reportService;
        _logger = logger;
    }

    /// <summary>
    /// Submit a status report for an ATM (crowd-sourcing)
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<StatusReportResponseDto>> SubmitReport(
        [FromBody] CreateStatusReportDto dto)
    {
        try
        {
            var report = await _reportService.SubmitReportAsync(dto);
            return Ok(new 
            { 
                message = "Relatório submetido com sucesso! Obrigado por ajudar a comunidade.",
                report 
            });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error submitting report");
            return StatusCode(500, "Erro ao submeter relatório");
        }
    }

    /// <summary>
    /// Get recent reports for an ATM
    /// </summary>
    [HttpGet("atm/{atmId}")]
    public async Task<ActionResult<List<StatusReportResponseDto>>> GetRecentReports(string atmId)
    {
        try
        {
            var reports = await _reportService.GetRecentReportsAsync(atmId);
            return Ok(reports);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting reports for ATM: {AtmId}", atmId);
            return StatusCode(500, "Erro ao buscar relatórios");
        }
    }
}
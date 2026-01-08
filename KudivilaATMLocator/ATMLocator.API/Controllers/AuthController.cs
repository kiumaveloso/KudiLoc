using ATMLocator.Application.DTOs;
using ATMLocator.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace ATMLocator.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IAuthService authService, ILogger<AuthController> logger)
    {
        _authService = authService;
        _logger = logger;
    }

    /// <summary>
    /// Register new user and get token
    /// </summary>
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponseDto>> Register([FromBody] CreateUserDto dto)
    {
        try
        {
            var response = await _authService.RegisterAsync(dto.PhoneNumber, dto.Name);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during registration");
            return StatusCode(500, "Erro ao registar");
        }
    }

    /// <summary>
    /// Login with phone number
    /// </summary>
    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginDto dto)
    {
        try
        {
            var response = await _authService.LoginAsync(dto.PhoneNumber);
            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during login");
            return StatusCode(500, "Erro ao fazer login");
        }
    }
}
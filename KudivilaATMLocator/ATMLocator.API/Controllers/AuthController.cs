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
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IOtpService _otpService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IAuthService authService, IOtpService otpService, ILogger<AuthController> logger)
    {
        _authService = authService;
        _otpService = otpService;
        _logger = logger;
    }

    /// <summary>
    /// Register a new user account
    /// </summary>
    [AllowAnonymous]
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] CreateUserDto dto)
    {
        try
        {
            var result = await _authService.RegisterAsync(dto.PhoneNumber, dto.Name);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { statusCode = 400, message = ex.Message });
        }
    }

    /// <summary>
    /// Login with phone number (direct - for backward compatibility)
    /// </summary>
    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        try
        {
            var result = await _authService.LoginAsync(dto.PhoneNumber);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { statusCode = 401, message = ex.Message });
        }
    }

    /// <summary>
    /// Request an OTP code to be sent to the phone number
    /// </summary>
    [AllowAnonymous]
    [HttpPost("otp/request")]
    public IActionResult RequestOtp([FromBody] RequestOtpDto dto)
    {
        var otpCode = _otpService.GenerateOtp(dto.PhoneNumber);

        // In production, send OTP via SMS (Twilio, etc.)
        // For development, log the code
        _logger.LogInformation("OTP generated for {Phone}: {Code}", dto.PhoneNumber, otpCode);

        return Ok(new OtpResponseDto(
            "Código OTP enviado para o seu número de telefone",
            300 // 5 minutes
        ));
    }

    /// <summary>
    /// Verify OTP and get JWT token (login or register)
    /// </summary>
    [AllowAnonymous]
    [HttpPost("otp/verify")]
    public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpDto dto)
    {
        if (!_otpService.VerifyOtp(dto.PhoneNumber, dto.OtpCode))
        {
            return Unauthorized(new { statusCode = 401, message = "Código OTP inválido ou expirado" });
        }

        try
        {
            // Try login first (existing user)
            var result = await _authService.LoginAsync(dto.PhoneNumber);
            return Ok(result);
        }
        catch (UnauthorizedAccessException)
        {
            // User doesn't exist yet - auto-register
            var result = await _authService.RegisterAsync(dto.PhoneNumber, null);
            return Ok(result);
        }
    }
}

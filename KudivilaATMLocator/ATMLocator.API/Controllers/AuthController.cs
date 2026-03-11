using System.Security.Claims;
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
    private readonly IUserService _userService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IAuthService authService, IOtpService otpService, IUserService userService, ILogger<AuthController> logger)
    {
        _authService = authService;
        _otpService = otpService;
        _userService = userService;
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

    /// <summary>
    /// Get the current authenticated user's profile.
    /// Returns snake_case fields including full_name, email, reputation_score
    /// for kudi-cash-find frontend compatibility.
    /// </summary>
    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> GetCurrentUser()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new { statusCode = 401, message = "Token inválido" });
        }

        var user = await _userService.GetUserByIdAsync(userId);
        if (user == null)
        {
            return NotFound(new { statusCode = 404, message = "Utilizador não encontrado" });
        }

        // Return fields in a format compatible with both the original app and kudi-cash-find.
        // The JSON serializer will convert to snake_case (full_name, reputation_score, etc.)
        return Ok(new
        {
            user.Id,
            user.PhoneNumber,
            FullName = user.Name ?? string.Empty,
            Email = user.PhoneNumber, // kudi-cash-find uses email; map phone as fallback
            user.Name,
            user.ReputationScore,
            user.TotalReports,
            user.AccurateReports,
            user.CreatedAt
        });
    }
}

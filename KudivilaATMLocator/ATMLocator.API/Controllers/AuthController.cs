using System.Security.Claims;
using ATMLocator.Application.DTOs;
using ATMLocator.Application.Services;
using ATMLocator.Core.Entities;
using ATMLocator.Core.Interfaces;
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
    private readonly ISmsService _smsService;
    private readonly ILoginAuditRepository _auditRepo;
    private readonly IEncryptionService _encryption;
    private readonly ILogger<AuthController> _logger;

    // Brute-force protection: 5 failed OTP verifications in 15 minutes → 429
    private static readonly int MaxFailedAttempts = 5;
    private static readonly TimeSpan BruteForceWindow = TimeSpan.FromMinutes(15);

    public AuthController(
        IAuthService authService,
        IOtpService otpService,
        IUserService userService,
        ISmsService smsService,
        ILoginAuditRepository auditRepo,
        IEncryptionService encryption,
        ILogger<AuthController> logger)
    {
        _authService = authService;
        _otpService = otpService;
        _userService = userService;
        _smsService = smsService;
        _auditRepo = auditRepo;
        _encryption = encryption;
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
    public async Task<IActionResult> RequestOtp([FromBody] RequestOtpDto dto)
    {
        var phoneHash = _encryption.Hash(dto.PhoneNumber);

        var otpCode = await _otpService.GenerateOtpAsync(dto.PhoneNumber);

        try
        {
            await _smsService.SendAsync(dto.PhoneNumber, $"O seu código KudiLoc é: {otpCode}. Válido por 5 minutos.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send OTP SMS to {PhoneHash}", phoneHash);
            return StatusCode(500, new { statusCode = 500, message = "Erro ao enviar SMS. Tente novamente." });
        }

        await _auditRepo.CreateAsync(new LoginAudit
        {
            PhoneNumberHash = phoneHash,
            EventType = AuditEventType.OtpRequested,
            IpAddress = GetClientIp(),
            UserAgent = Request.Headers.UserAgent.ToString(),
            Success = true,
        });

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
        var phoneHash = _encryption.Hash(dto.PhoneNumber);
        var ip = GetClientIp();
        var ua = Request.Headers.UserAgent.ToString();

        // Brute-force protection
        var recentFailures = await _auditRepo.CountRecentFailuresAsync(phoneHash, BruteForceWindow);
        if (recentFailures >= MaxFailedAttempts)
        {
            _logger.LogWarning("Brute-force block on OTP verify for {PhoneHash} from {Ip}", phoneHash, ip);
            return StatusCode(429, new { statusCode = 429, message = "Demasiadas tentativas. Aguarde 15 minutos." });
        }

        if (!await _otpService.VerifyOtpAsync(dto.PhoneNumber, dto.OtpCode))
        {
            await _auditRepo.CreateAsync(new LoginAudit
            {
                PhoneNumberHash = phoneHash,
                EventType = AuditEventType.LoginFailed,
                IpAddress = ip,
                UserAgent = ua,
                Success = false,
                FailureReason = "OTP inválido ou expirado",
            });
            return Unauthorized(new { statusCode = 401, message = "Código OTP inválido ou expirado" });
        }

        try
        {
            AuthResponseDto result;
            try
            {
                result = await _authService.LoginAsync(dto.PhoneNumber);
            }
            catch (UnauthorizedAccessException)
            {
                result = await _authService.RegisterAsync(dto.PhoneNumber, null);
            }

            // Generate refresh token and set as httpOnly cookie
            var refreshToken = await _authService.GenerateRefreshTokenAsync(result.UserId);
            Response.Cookies.Append("kudiloc_refresh", refreshToken, new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.None,
                Expires = DateTimeOffset.UtcNow.AddDays(30),
                Path = "/"
            });

            await _auditRepo.CreateAsync(new LoginAudit
            {
                UserId = result.UserId,
                PhoneNumberHash = phoneHash,
                EventType = AuditEventType.LoginSuccess,
                IpAddress = ip,
                UserAgent = ua,
                Success = true,
            });

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during OTP verification for {PhoneHash}", phoneHash);
            return StatusCode(500, new { statusCode = 500, message = "Erro interno durante a verificação" });
        }
    }

    /// <summary>
    /// Refresh the JWT access token using the httpOnly refresh cookie
    /// </summary>
    [AllowAnonymous]
    [HttpPost("refresh")]
    public async Task<IActionResult> RefreshToken()
    {
        var refreshToken = Request.Cookies["kudiloc_refresh"];
        if (string.IsNullOrEmpty(refreshToken))
        {
            return Unauthorized(new { statusCode = 401, message = "Token de atualização não encontrado" });
        }

        try
        {
            var result = await _authService.RefreshAccessTokenAsync(refreshToken);

            await _auditRepo.CreateAsync(new LoginAudit
            {
                UserId = result.UserId,
                PhoneNumberHash = string.Empty,
                EventType = AuditEventType.TokenRefreshed,
                IpAddress = GetClientIp(),
                UserAgent = Request.Headers.UserAgent.ToString(),
                Success = true,
            });

            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { statusCode = 401, message = ex.Message });
        }
    }

    /// <summary>
    /// Logout - revoke refresh token and clear cookie
    /// </summary>
    [AllowAnonymous]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        var refreshToken = Request.Cookies["kudiloc_refresh"];
        if (!string.IsNullOrEmpty(refreshToken))
        {
            await _authService.RevokeRefreshTokenAsync(refreshToken);
        }

        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        await _auditRepo.CreateAsync(new LoginAudit
        {
            UserId = userId,
            PhoneNumberHash = string.Empty,
            EventType = AuditEventType.Logout,
            IpAddress = GetClientIp(),
            UserAgent = Request.Headers.UserAgent.ToString(),
            Success = true,
        });

        Response.Cookies.Delete("kudiloc_refresh", new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.None,
            Path = "/"
        });

        return Ok(new { message = "Sessão terminada com sucesso" });
    }

    /// <summary>
    /// Get the current authenticated user's profile
    /// </summary>
    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> GetCurrentUser()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new { statusCode = 401, message = "Token invalido" });
        }

        var user = await _userService.GetUserByIdAsync(userId);
        if (user == null)
        {
            return NotFound(new { statusCode = 404, message = "Utilizador nao encontrado" });
        }

        return Ok(user);
    }

    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------

    private string GetClientIp()
    {
        // Respect X-Forwarded-For set by Render's edge proxy
        var forwarded = Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrEmpty(forwarded))
            return forwarded.Split(',')[0].Trim();
        return HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    }
}

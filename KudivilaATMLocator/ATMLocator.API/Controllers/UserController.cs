using ATMLocator.Application.DTOs;
using ATMLocator.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace ATMLocator.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UserController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly ILogger<UserController> _logger;

    public UserController(IUserService userService, ILogger<UserController> logger)
    {
        _userService = userService;
        _logger = logger;
    }

    /// <summary>
    /// Register a new user
    /// </summary>
    [HttpPost("register")]
    public async Task<ActionResult<UserDto>> RegisterUser([FromBody] CreateUserDto dto)
    {
        try
        {
            var user = await _userService.CreateUserAsync(dto);
            return CreatedAtAction(nameof(GetUserById), new { id = user.Id }, user);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error registering user");
            return StatusCode(500, "Erro ao registar utilizador");
        }
    }

    /// <summary>
    /// Get user by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<UserDto>> GetUserById(string id)
    {
        try
        {
            var user = await _userService.GetUserByIdAsync(id);
            
            if (user == null)
            {
                return NotFound("Utilizador não encontrado");
            }

            return Ok(user);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user by ID: {Id}", id);
            return StatusCode(500, "Erro ao buscar utilizador");
        }
    }

    /// <summary>
    /// Get user by phone number
    /// </summary>
    [HttpGet("phone/{phoneNumber}")]
    public async Task<ActionResult<UserDto>> GetUserByPhoneNumber(string phoneNumber)
    {
        try
        {
            var user = await _userService.GetUserByPhoneNumberAsync(phoneNumber);
            
            if (user == null)
            {
                return NotFound("Utilizador não encontrado");
            }

            return Ok(user);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user by phone: {Phone}", phoneNumber);
            return StatusCode(500, "Erro ao buscar utilizador");
        }
    }
}
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
public class UserController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly ILogger<UserController> _logger;

    public UserController(IUserService userService, ILogger<UserController> logger)
    {
        _userService = userService;
        _logger = logger;
    }

    [Authorize]
    [HttpGet("{id}")]
    public async Task<ActionResult<UserDto>> GetUserById(string id)
    {
        try
        {
            var user = await _userService.GetUserByIdAsync(id);

            if (user == null)
            {
                return NotFound(new { statusCode = 404, message = "Utilizador nao encontrado" });
            }
            return Ok(user);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user by ID: {Id}", id);
            return StatusCode(500, new { statusCode = 500, message = "Erro ao buscar utilizador" });
        }
    }

    [Authorize]
    [HttpGet("phone/{phoneNumber}")]
    public async Task<ActionResult<UserDto>> GetUserByPhoneNumber(string phoneNumber)
    {
        try
        {
            var user = await _userService.GetUserByPhoneNumberAsync(phoneNumber);

            if (user == null)
            {
                return NotFound(new { statusCode = 404, message = "Utilizador nao encontrado" });
            }
            return Ok(user);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user by phone: {Phone}", phoneNumber);
            return StatusCode(500, new { statusCode = 500, message = "Erro ao buscar utilizador" });
        }
    }

    [Authorize]
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteUser(string id)
    {
        try
        {
            var deleted = await _userService.DeleteUserAsync(id);
            if (!deleted)
            {
                return NotFound(new { statusCode = 404, message = "Utilizador nao encontrado" });
            }
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting user: {Id}", id);
            return StatusCode(500, new { statusCode = 500, message = "Erro ao eliminar utilizador" });
        }
    }

    [Authorize]
    [HttpPut("{id}")]
    public async Task<ActionResult<UserDto>> UpdateUser(string id, [FromBody] UpdateUserDto dto)
    {
        try
        {
            var user = await _userService.UpdateUserAsync(id, dto);
            return Ok(user);
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { statusCode = 404, message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user: {Id}", id);
            return StatusCode(500, new { statusCode = 500, message = "Erro ao atualizar utilizador" });
        }
    }
}

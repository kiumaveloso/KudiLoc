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
public class CommentController : ControllerBase
{
    private readonly ICommentService _commentService;
    private readonly ILogger<CommentController> _logger;

    public CommentController(ICommentService commentService, ILogger<CommentController> logger)
    {
        _commentService = commentService;
        _logger = logger;
    }

    /// <summary>
    /// Get comments for an ATM
    /// </summary>
    [HttpGet("atm/{atmId}")]
    public async Task<ActionResult<List<CommentDto>>> GetCommentsForATM(string atmId, [FromQuery] int limit = 20)
    {
        try
        {
            var comments = await _commentService.GetCommentsForATMAsync(atmId, limit);
            return Ok(comments);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting comments for ATM: {AtmId}", atmId);
            return StatusCode(500, new { statusCode = 500, message = "Erro ao buscar comentários" });
        }
    }

    /// <summary>
    /// Add a comment to an ATM (requires authentication)
    /// </summary>
    [Authorize]
    [HttpPost]
    public async Task<ActionResult<CommentDto>> AddComment([FromBody] CreateCommentDto dto)
    {
        try
        {
            var comment = await _commentService.AddCommentAsync(dto.ATMId, dto.UserId, dto.UserName, dto.Text);
            return Ok(comment);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { statusCode = 400, message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding comment");
            return StatusCode(500, new { statusCode = 500, message = "Erro ao adicionar comentário" });
        }
    }

    /// <summary>
    /// Mark a comment as helpful (anonymous allowed)
    /// </summary>
    [AllowAnonymous]
    [HttpPost("{id}/helpful")]
    public async Task<ActionResult<CommentDto>> MarkHelpful(string id)
    {
        try
        {
            var comment = await _commentService.MarkHelpfulAsync(id);
            return Ok(comment);
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { statusCode = 404, message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking comment helpful: {Id}", id);
            return StatusCode(500, new { statusCode = 500, message = "Erro ao marcar comentário como útil" });
        }
    }

    /// <summary>
    /// Delete a comment (requires auth, only own comment)
    /// </summary>
    [Authorize]
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteComment(string id)
    {
        try
        {
            // Extract user ID from JWT claims
            var userId = User.FindFirst("sub")?.Value
                         ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new { statusCode = 401, message = "Utilizador não autenticado" });

            await _commentService.DeleteCommentAsync(id, userId);
            return NoContent();
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { statusCode = 404, message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { statusCode = 403, message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting comment: {Id}", id);
            return StatusCode(500, new { statusCode = 500, message = "Erro ao eliminar comentário" });
        }
    }
}

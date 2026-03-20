using ATMLocator.Core.Entities;
using ATMLocator.Core.Interfaces;
using ATMLocator.Application.DTOs;

namespace ATMLocator.Application.Services;

public interface ICommentService
{
    Task<List<CommentDto>> GetCommentsForATMAsync(string atmId, int limit = 20);
    Task<CommentDto> AddCommentAsync(string atmId, string userId, string userName, string text);
    Task<CommentDto> MarkHelpfulAsync(string commentId);
    Task DeleteCommentAsync(string commentId, string requestingUserId);
}

public class CommentService : ICommentService
{
    private readonly ICommentRepository _commentRepository;

    public CommentService(ICommentRepository commentRepository)
    {
        _commentRepository = commentRepository;
    }

    public async Task<List<CommentDto>> GetCommentsForATMAsync(string atmId, int limit = 20)
    {
        var comments = await _commentRepository.GetByATMIdAsync(atmId, limit);
        return comments.Select(MapToDto).ToList();
    }

    public async Task<CommentDto> AddCommentAsync(string atmId, string userId, string userName, string text)
    {
        if (string.IsNullOrWhiteSpace(text))
            throw new ArgumentException("O texto do comentário não pode estar vazio.", nameof(text));

        if (text.Length > 500)
            throw new ArgumentException("O comentário não pode exceder 500 caracteres.", nameof(text));

        var comment = new Comment
        {
            ATMId = atmId,
            UserId = userId,
            UserName = userName,
            Text = text.Trim(),
            HelpfulCount = 0
        };

        var created = await _commentRepository.CreateAsync(comment);
        return MapToDto(created);
    }

    public async Task<CommentDto> MarkHelpfulAsync(string commentId)
    {
        var comment = await _commentRepository.GetByIdAsync(commentId);
        if (comment == null)
            throw new ArgumentException("Comentário não encontrado.", nameof(commentId));

        comment.HelpfulCount++;
        var updated = await _commentRepository.UpdateAsync(comment);
        return MapToDto(updated);
    }

    public async Task DeleteCommentAsync(string commentId, string requestingUserId)
    {
        var comment = await _commentRepository.GetByIdAsync(commentId);
        if (comment == null)
            throw new ArgumentException("Comentário não encontrado.", nameof(commentId));

        if (comment.UserId != requestingUserId)
            throw new UnauthorizedAccessException("Apenas o autor pode eliminar este comentário.");

        await _commentRepository.DeleteAsync(commentId);
    }

    private static CommentDto MapToDto(Comment comment)
    {
        return new CommentDto(
            comment.Id,
            comment.ATMId,
            comment.UserId,
            comment.UserName,
            comment.Text,
            comment.HelpfulCount,
            comment.CreatedAt
        );
    }
}

using ATMLocator.Core.Entities;

namespace ATMLocator.Core.Interfaces;

public interface ICommentRepository
{
    Task<List<Comment>> GetByATMIdAsync(string atmId, int limit = 20);
    Task<Comment> CreateAsync(Comment comment);
    Task<Comment?> GetByIdAsync(string id);
    Task<Comment> UpdateAsync(Comment comment);
    Task DeleteAsync(string id);
}

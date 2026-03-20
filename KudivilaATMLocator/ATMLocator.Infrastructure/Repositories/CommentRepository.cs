using ATMLocator.Core.Entities;
using ATMLocator.Core.Interfaces;
using ATMLocator.Infrastructure.Data;
using MongoDB.Driver;

namespace ATMLocator.Infrastructure.Repositories;

public class CommentRepository : ICommentRepository
{
    private readonly MongoDbContext _context;

    public CommentRepository(MongoDbContext context)
    {
        _context = context;
    }

    public async Task<List<Comment>> GetByATMIdAsync(string atmId, int limit = 20)
    {
        return await _context.Comments
            .Find(c => c.ATMId == atmId)
            .SortByDescending(c => c.CreatedAt)
            .Limit(limit)
            .ToListAsync();
    }

    public async Task<Comment> CreateAsync(Comment comment)
    {
        comment.Id = Guid.NewGuid().ToString();
        comment.CreatedAt = DateTime.UtcNow;

        await _context.Comments.InsertOneAsync(comment);
        return comment;
    }

    public async Task<Comment?> GetByIdAsync(string id)
    {
        return await _context.Comments
            .Find(c => c.Id == id)
            .FirstOrDefaultAsync();
    }

    public async Task<Comment> UpdateAsync(Comment comment)
    {
        await _context.Comments.ReplaceOneAsync(
            c => c.Id == comment.Id,
            comment
        );
        return comment;
    }

    public async Task DeleteAsync(string id)
    {
        await _context.Comments.DeleteOneAsync(c => c.Id == id);
    }
}

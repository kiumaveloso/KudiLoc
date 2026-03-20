using Xunit;
using Moq;
using FluentAssertions;
using ATMLocator.Application.Services;
using ATMLocator.Core.Interfaces;
using ATMLocator.Core.Entities;

namespace ATMLocator.Tests;

public class CommentServiceTests
{
    private readonly Mock<ICommentRepository> _mockCommentRepo;
    private readonly CommentService _service;

    public CommentServiceTests()
    {
        _mockCommentRepo = new Mock<ICommentRepository>();
        _service = new CommentService(_mockCommentRepo.Object);
    }

    [Fact]
    public async Task AddComment_ReturnsCorrectDto()
    {
        // Arrange
        var createdAt = DateTime.UtcNow;
        _mockCommentRepo.Setup(r => r.CreateAsync(It.IsAny<Comment>()))
            .ReturnsAsync((Comment c) =>
            {
                c.Id = "comment123";
                c.CreatedAt = createdAt;
                return c;
            });

        // Act
        var result = await _service.AddCommentAsync("atm1", "user1", "João", "Tem dinheiro agora");

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be("comment123");
        result.ATMId.Should().Be("atm1");
        result.UserId.Should().Be("user1");
        result.UserName.Should().Be("João");
        result.Text.Should().Be("Tem dinheiro agora");
        result.HelpfulCount.Should().Be(0);
        result.CreatedAt.Should().Be(createdAt);
    }

    [Fact]
    public async Task MarkHelpful_IncrementsHelpfulCount()
    {
        // Arrange
        var comment = new Comment
        {
            Id = "comment1",
            ATMId = "atm1",
            UserId = "user1",
            UserName = "João",
            Text = "Bom ATM",
            HelpfulCount = 2,
            CreatedAt = DateTime.UtcNow
        };
        _mockCommentRepo.Setup(r => r.GetByIdAsync("comment1")).ReturnsAsync(comment);
        _mockCommentRepo.Setup(r => r.UpdateAsync(It.IsAny<Comment>()))
            .ReturnsAsync((Comment c) => c);

        // Act
        var result = await _service.MarkHelpfulAsync("comment1");

        // Assert
        result.HelpfulCount.Should().Be(3);
        _mockCommentRepo.Verify(r => r.UpdateAsync(It.Is<Comment>(c => c.HelpfulCount == 3)), Times.Once);
    }

    [Fact]
    public async Task DeleteComment_WhenUserIsNotOwner_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var comment = new Comment
        {
            Id = "comment1",
            ATMId = "atm1",
            UserId = "ownerUser",
            UserName = "Owner",
            Text = "Comentário",
            HelpfulCount = 0,
            CreatedAt = DateTime.UtcNow
        };
        _mockCommentRepo.Setup(r => r.GetByIdAsync("comment1")).ReturnsAsync(comment);

        // Act & Assert
        await Assert.ThrowsAsync<UnauthorizedAccessException>(
            async () => await _service.DeleteCommentAsync("comment1", "differentUser")
        );
        _mockCommentRepo.Verify(r => r.DeleteAsync(It.IsAny<string>()), Times.Never);
    }
}

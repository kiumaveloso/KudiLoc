namespace ATMLocator.Application.DTOs;

public record CommentDto(
    string Id,
    string ATMId,
    string UserId,
    string UserName,
    string Text,
    int HelpfulCount,
    DateTime CreatedAt
);

public record CreateCommentDto(
    string ATMId,
    string UserId,
    string UserName,
    string Text
);

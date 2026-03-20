namespace ATMLocator.Core.Entities;

public class Comment
{
    public string Id { get; set; } = string.Empty;
    public string ATMId { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string Text { get; set; } = string.Empty;
    public int HelpfulCount { get; set; } = 0;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

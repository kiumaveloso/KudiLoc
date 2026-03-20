namespace ATMLocator.Core.Entities;

public enum BadgeType
{
    Explorer,
    BronzeContributor,
    SilverContributor,
    GoldContributor,
    Pioneer,
    Reliable,
    Helpful
}

public class Badge
{
    public string Id { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public BadgeType BadgeType { get; set; }
    public DateTime EarnedAt { get; set; } = DateTime.UtcNow;
}

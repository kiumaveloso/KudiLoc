namespace ATMLocator.Core.Entities;

public class User
{
    public string Id { get; set; } = string.Empty;
    /// <summary>
    /// Plain-text phone number — only populated after decryption, never persisted.
    /// </summary>
    public string PhoneNumber { get; set; } = string.Empty;
    /// <summary>
    /// AES-256-CBC encrypted phone number stored in MongoDB.
    /// </summary>
    public string? PhoneNumberEncrypted { get; set; }
    /// <summary>
    /// HMAC-SHA256 hash of the phone number used for equality lookups without decryption.
    /// </summary>
    public string? PhoneNumberHash { get; set; }
    public string? Name { get; set; }
    public int ReputationScore { get; set; } = 50; // Starts at 50, goes 0-100
    public int TotalReports { get; set; }
    public int AccurateReports { get; set; }
    public string Role { get; set; } = "user";
    public DateTime CreatedAt { get; set; }
}
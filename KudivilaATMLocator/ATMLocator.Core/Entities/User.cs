namespace ATMLocator.Core.Entities;    

public class User
{
    public string Id { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string? Name { get; set; }
    public int ReputationScore { get; set; } = 50; // Starts at 50, goes 0-100
    public int TotalReports { get; set; }
    public int AccurateReports { get; set; }
    public DateTime CreatedAt { get; set; }
}
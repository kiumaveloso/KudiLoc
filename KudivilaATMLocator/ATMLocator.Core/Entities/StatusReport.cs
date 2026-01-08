namespace ATMLocator.Core.Entities;    

public class StatusReport
{
    public string Id { get; set; } = string.Empty;
    public string ATMId { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public bool HasCash { get; set; }
    public ReportStatus Status { get; set; } // Pending, Verified, Rejected
    public int ConfirmationCount { get; set; } // How many users confirmed this
    public DateTime ReportedAt { get; set; }
    public string? Notes { get; set; }
}

public enum ReportStatus
{
    Pending,
    Verified,
    Rejected
}
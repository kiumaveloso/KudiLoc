namespace ATMLocator.Core.Entities;    

public class StatusReport
{
    public string Id { get; set; } = string.Empty;
    public string ATMId { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public bool HasCash { get; set; }
    public OperationalStatus OperationalStatus { get; set; } = OperationalStatus.Operational;
    public ReportStatus Status { get; set; } // Pending, Verified, Rejected
    public int ConfirmationCount { get; set; } // How many users confirmed this
    public DateTime ReportedAt { get; set; }
    public string? Notes { get; set; }

    // kudi-cash-find fields
    public int ReporterReputation { get; set; } = 50;
    public string? CreatedBy { get; set; } // user email for anonymous reports
}

public enum ReportStatus
{
    Pending,
    Verified,
    Rejected
}
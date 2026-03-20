namespace ATMLocator.Core.Entities;

public enum AuditEventType
{
    OtpRequested,
    LoginSuccess,
    LoginFailed,
    TokenRefreshed,
    Logout
}

public class LoginAudit
{
    public string Id { get; set; } = string.Empty;
    public string? UserId { get; set; }
    public string PhoneNumberHash { get; set; } = string.Empty;
    public AuditEventType EventType { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public bool Success { get; set; }
    public string? FailureReason { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

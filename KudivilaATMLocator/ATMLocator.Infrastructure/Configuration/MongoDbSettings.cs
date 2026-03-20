namespace ATMLocator.Infrastructure.Configuration;

public class MongoDbSettings
{
    public string ConnectionString { get; set; } = string.Empty;
    public string DatabaseName { get; set; } = string.Empty;
    public string ATMsCollectionName { get; set; } = "atms";
    public string StatusReportsCollectionName { get; set; } = "status_reports";
    public string UsersCollectionName { get; set; } = "users";
    public string CommentsCollectionName { get; set; } = "comments";
    public string BadgesCollectionName { get; set; } = "badges";
    public string VisitHistoryCollectionName { get; set; } = "visit_history";
    public string RefreshTokensCollectionName { get; set; } = "refresh_tokens";
    public string OtpCollectionName { get; set; } = "otp_entries";
    public string LoginAuditsCollectionName { get; set; } = "login_audits";
}
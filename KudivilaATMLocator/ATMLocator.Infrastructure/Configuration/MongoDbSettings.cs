namespace ATMLocator.Infrastructure.Configuration;

public class MongoDbSettings
{
    public string ConnectionString { get; set; } = string.Empty;
    public string DatabaseName { get; set; } = string.Empty;
    public string ATMsCollectionName { get; set; } = "atms";
    public string StatusReportsCollectionName { get; set; } = "status_reports";
    public string UsersCollectionName { get; set; } = "users";
}
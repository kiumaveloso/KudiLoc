using ATMLocator.Core.Entities;
using ATMLocator.Infrastructure.Configuration;
using Microsoft.Extensions.Options;
using MongoDB.Driver;

namespace ATMLocator.Infrastructure.Data;

public class MongoDbContext
{
    private readonly IMongoDatabase _database;
    private readonly MongoDbSettings _settings;

    public MongoDbContext(IOptions<MongoDbSettings> settings)
    {
        _settings = settings.Value;
        
        var client = new MongoClient(_settings.ConnectionString);
        _database = client.GetDatabase(_settings.DatabaseName);
        
        CreateIndexes();
    }

    public IMongoCollection<ATM> ATMs => 
        _database.GetCollection<ATM>(_settings.ATMsCollectionName);

    public IMongoCollection<StatusReport> StatusReports => 
        _database.GetCollection<StatusReport>(_settings.StatusReportsCollectionName);

    public IMongoCollection<User> Users => 
        _database.GetCollection<User>(_settings.UsersCollectionName);

    private void CreateIndexes()
    {
        // Index for province filtering
        var atmProvinceIndex = Builders<ATM>.IndexKeys
            .Ascending(atm => atm.Province);
        ATMs.Indexes.CreateOne(new CreateIndexModel<ATM>(atmProvinceIndex));

        // Index for ATM status queries
        var atmStatusIndex = Builders<ATM>.IndexKeys
            .Descending(atm => atm.CurrentStatus.HasCash)
            .Descending(atm => atm.CurrentStatus.ReliabilityScore);
        ATMs.Indexes.CreateOne(new CreateIndexModel<ATM>(atmStatusIndex));

        // Index for status reports by ATM
        var reportAtmIndex = Builders<StatusReport>.IndexKeys
            .Ascending(report => report.ATMId)
            .Descending(report => report.ReportedAt);
        StatusReports.Indexes.CreateOne(new CreateIndexModel<StatusReport>(reportAtmIndex));

        // Index for user phone numbers (unique)
        var userPhoneIndex = Builders<User>.IndexKeys
            .Ascending(user => user.PhoneNumber);
        Users.Indexes.CreateOne(new CreateIndexModel<User>(
            userPhoneIndex,
            new CreateIndexOptions { Unique = true }
        ));
    }
}
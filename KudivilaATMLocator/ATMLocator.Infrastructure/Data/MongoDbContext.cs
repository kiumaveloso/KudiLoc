using ATMLocator.Core.Entities;
using ATMLocator.Infrastructure.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MongoDB.Bson.Serialization;
using MongoDB.Driver;

namespace ATMLocator.Infrastructure.Data;

public class MongoDbContext
{
    private readonly IMongoDatabase _database;
    private readonly MongoDbSettings _settings;
    private readonly ILogger<MongoDbContext>? _logger;
    private volatile bool _indexesCreated;

    static MongoDbContext()
    {
        // Register BSON class map so GeoJsonPoint serializes with lowercase
        // field names required by MongoDB 2dsphere indexes.
        if (!BsonClassMap.IsClassMapRegistered(typeof(GeoJsonPoint)))
        {
            BsonClassMap.RegisterClassMap<GeoJsonPoint>(cm =>
            {
                cm.AutoMap();
                cm.MapMember(p => p.Type).SetElementName("type");
                cm.MapMember(p => p.Coordinates).SetElementName("coordinates");
            });
        }
    }

    public MongoDbContext(IOptions<MongoDbSettings> settings, ILogger<MongoDbContext>? logger = null)
    {
        _settings = settings.Value;
        _logger = logger;

        // Parse the configured connection string and apply a shorter server
        // selection timeout so that startup does not hang for the default 30s
        // when MongoDB is unreachable.
        var mongoUrl = new MongoUrl(_settings.ConnectionString);
        var clientSettings = MongoClientSettings.FromUrl(mongoUrl);
        clientSettings.ServerSelectionTimeout = TimeSpan.FromSeconds(5);
        clientSettings.ConnectTimeout = TimeSpan.FromSeconds(5);

        var client = new MongoClient(clientSettings);
        _database = client.GetDatabase(_settings.DatabaseName);
    }

    public IMongoCollection<ATM> ATMs =>
        _database.GetCollection<ATM>(_settings.ATMsCollectionName);

    public IMongoCollection<StatusReport> StatusReports =>
        _database.GetCollection<StatusReport>(_settings.StatusReportsCollectionName);

    public IMongoCollection<User> Users =>
        _database.GetCollection<User>(_settings.UsersCollectionName);

    /// <summary>
    /// Creates required MongoDB indexes. Called during application startup
    /// rather than in the constructor to avoid blocking DI resolution when
    /// MongoDB is unreachable.
    /// </summary>
    public async Task EnsureIndexesCreatedAsync()
    {
        if (_indexesCreated) return;

        try
        {
            // Index for province filtering
            var atmProvinceIndex = Builders<ATM>.IndexKeys
                .Ascending(atm => atm.Province);
            await ATMs.Indexes.CreateOneAsync(new CreateIndexModel<ATM>(atmProvinceIndex));

            // Index for ATM status queries
            var atmStatusIndex = Builders<ATM>.IndexKeys
                .Descending(atm => atm.CurrentStatus.HasCash)
                .Descending(atm => atm.CurrentStatus.ReliabilityScore);
            await ATMs.Indexes.CreateOneAsync(new CreateIndexModel<ATM>(atmStatusIndex));

            // 2dsphere index on the GeoJSON Location field for geospatial queries
            var atmLocationIndex = Builders<ATM>.IndexKeys
                .Geo2DSphere(atm => atm.Location);
            await ATMs.Indexes.CreateOneAsync(new CreateIndexModel<ATM>(atmLocationIndex));

            // Index for status reports by ATM
            var reportAtmIndex = Builders<StatusReport>.IndexKeys
                .Ascending(report => report.ATMId)
                .Descending(report => report.ReportedAt);
            await StatusReports.Indexes.CreateOneAsync(new CreateIndexModel<StatusReport>(reportAtmIndex));

            // Index for user phone numbers (unique)
            var userPhoneIndex = Builders<User>.IndexKeys
                .Ascending(user => user.PhoneNumber);
            await Users.Indexes.CreateOneAsync(new CreateIndexModel<User>(
                userPhoneIndex,
                new CreateIndexOptions { Unique = true }
            ));

            _indexesCreated = true;
            _logger?.LogInformation("MongoDB indexes created successfully");
        }
        catch (Exception ex)
        {
            _logger?.LogWarning(ex, "Failed to create MongoDB indexes. They will be retried on next startup");
        }
    }
}
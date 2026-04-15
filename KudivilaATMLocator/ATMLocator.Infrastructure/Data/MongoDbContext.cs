using ATMLocator.Core.Entities;
using ATMLocator.Infrastructure.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MongoDB.Bson.Serialization;
using MongoDB.Bson.Serialization.Conventions;
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
        // Ignore any unknown fields in MongoDB documents (e.g. legacy fields
        // that no longer exist in the C# model like Is24Hours → IsOpen24Hours).
        var pack = new ConventionPack { new IgnoreExtraElementsConvention(true) };
        ConventionRegistry.Register("IgnoreExtraElements", pack, _ => true);

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

    public IMongoCollection<Comment> Comments =>
        _database.GetCollection<Comment>(_settings.CommentsCollectionName);

    public IMongoCollection<Badge> Badges =>
        _database.GetCollection<Badge>(_settings.BadgesCollectionName);

    public IMongoCollection<VisitHistory> VisitHistory =>
        _database.GetCollection<VisitHistory>(_settings.VisitHistoryCollectionName);

    public IMongoCollection<RefreshToken> RefreshTokens =>
        _database.GetCollection<RefreshToken>(_settings.RefreshTokensCollectionName);

    public IMongoCollection<OtpEntry> OtpEntries =>
        _database.GetCollection<OtpEntry>(_settings.OtpCollectionName);

    public IMongoCollection<LoginAudit> LoginAudits =>
        _database.GetCollection<LoginAudit>(_settings.LoginAuditsCollectionName);

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

            // NOTE: the old plain-text PhoneNumber unique index is intentionally omitted.
            // PhoneNumber is empty after encryption; uniqueness is enforced via PhoneNumberHash below.

            // Index for comments by ATM
            var commentAtmIndex = Builders<Comment>.IndexKeys
                .Ascending(c => c.ATMId);
            await Comments.Indexes.CreateOneAsync(new CreateIndexModel<Comment>(commentAtmIndex));

            // Compound unique index for badges (one badge type per user)
            var badgeUserTypeIndex = Builders<Badge>.IndexKeys
                .Ascending(b => b.UserId)
                .Ascending(b => b.BadgeType);
            await Badges.Indexes.CreateOneAsync(new CreateIndexModel<Badge>(
                badgeUserTypeIndex,
                new CreateIndexOptions { Unique = true }
            ));

            // Index for visit history by user
            var visitUserIndex = Builders<VisitHistory>.IndexKeys
                .Ascending(v => v.UserId);
            await VisitHistory.Indexes.CreateOneAsync(new CreateIndexModel<VisitHistory>(visitUserIndex));

            // TTL index on refresh tokens (auto-delete after ExpiresAt)
            var refreshTokenTtlIndex = Builders<RefreshToken>.IndexKeys
                .Ascending(rt => rt.ExpiresAt);
            await RefreshTokens.Indexes.CreateOneAsync(new CreateIndexModel<RefreshToken>(
                refreshTokenTtlIndex,
                new CreateIndexOptions { ExpireAfter = TimeSpan.Zero }
            ));

            // Index for refresh token lookup by token string
            var refreshTokenIndex = Builders<RefreshToken>.IndexKeys
                .Ascending(rt => rt.Token);
            await RefreshTokens.Indexes.CreateOneAsync(new CreateIndexModel<RefreshToken>(refreshTokenIndex));

            // TTL index on OTP entries (auto-delete after ExpiresAt)
            var otpTtlIndex = Builders<OtpEntry>.IndexKeys
                .Ascending(o => o.ExpiresAt);
            await OtpEntries.Indexes.CreateOneAsync(new CreateIndexModel<OtpEntry>(
                otpTtlIndex,
                new CreateIndexOptions { ExpireAfter = TimeSpan.Zero }
            ));

            // Unique index on OTP phone number
            var otpPhoneIndex = Builders<OtpEntry>.IndexKeys
                .Ascending(o => o.PhoneNumber);
            await OtpEntries.Indexes.CreateOneAsync(new CreateIndexModel<OtpEntry>(
                otpPhoneIndex,
                new CreateIndexOptions { Unique = true }
            ));

            // TTL index on login audits (auto-delete after 90 days)
            var auditTtlIndex = Builders<LoginAudit>.IndexKeys
                .Ascending(a => a.CreatedAt);
            await LoginAudits.Indexes.CreateOneAsync(new CreateIndexModel<LoginAudit>(
                auditTtlIndex,
                new CreateIndexOptions { ExpireAfter = TimeSpan.FromDays(90) }
            ));

            // Index for fast brute-force check: phoneNumberHash + success + createdAt
            var auditBruteForceIndex = Builders<LoginAudit>.IndexKeys
                .Ascending(a => a.PhoneNumberHash)
                .Ascending(a => a.Success)
                .Descending(a => a.CreatedAt);
            await LoginAudits.Indexes.CreateOneAsync(new CreateIndexModel<LoginAudit>(auditBruteForceIndex));

            // Index for phone number hash lookup on users
            var userPhoneHashIndex = Builders<User>.IndexKeys
                .Ascending(u => u.PhoneNumberHash);
            await Users.Indexes.CreateOneAsync(new CreateIndexModel<User>(
                userPhoneHashIndex,
                new CreateIndexOptions { Unique = true, Sparse = true }
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
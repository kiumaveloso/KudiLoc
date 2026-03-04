using System.Text;
using AspNetCoreRateLimit;
using ATMLocator.Application.Services;
using Serilog;
using ATMLocator.Application.Validators;
using ATMLocator.Core.Interfaces;
using ATMLocator.Core.Settings;
using ATMLocator.Infrastructure.Configuration;
using ATMLocator.Infrastructure.Data;
using ATMLocator.Infrastructure.Repositories;
using ATMLocator.API.Middleware;
using ATMLocator.API.Services;
using ATMLocator.API.HealthChecks;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using Microsoft.AspNetCore.ResponseCompression;
using System.IO.Compression;
using Asp.Versioning;

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft", Serilog.Events.LogEventLevel.Warning)
    .MinimumLevel.Override("Microsoft.AspNetCore", Serilog.Events.LogEventLevel.Warning)
    .Enrich.FromLogContext()
    .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj} {Properties:j}{NewLine}{Exception}")
    .WriteTo.File("logs/kudiloc-.log",
        rollingInterval: RollingInterval.Day,
        retainedFileCountLimit: 30,
        outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] {Message:lj} {Properties:j}{NewLine}{Exception}")
    .CreateLogger();

var builder = WebApplication.CreateBuilder(args);
builder.Host.UseSerilog();

// Limit request body to 10MB globally (prevents abuse)
builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = 10 * 1024 * 1024; // 10 MB
});

// Add services to the container
builder.Services.AddResponseCaching();
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<BrotliCompressionProvider>();
    options.Providers.Add<GzipCompressionProvider>();
    options.MimeTypes = ResponseCompressionDefaults.MimeTypes.Concat(
        ["application/json", "text/json"]);
});
builder.Services.Configure<BrotliCompressionProviderOptions>(options =>
    options.Level = CompressionLevel.Fastest);
builder.Services.Configure<GzipCompressionProviderOptions>(options =>
    options.Level = CompressionLevel.SmallestSize);
builder.Services.AddControllers();

// API Versioning
builder.Services.AddApiVersioning(options =>
{
    options.DefaultApiVersion = new ApiVersion(1, 0);
    options.AssumeDefaultVersionWhenUnspecified = true;
    options.ReportApiVersions = true;
    options.ApiVersionReader = new UrlSegmentApiVersionReader();
});

// Add FluentValidation
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<CreateATMDtoValidator>();

// Configure IP Rate Limiting
builder.Services.AddMemoryCache();
builder.Services.Configure<IpRateLimitOptions>(
    builder.Configuration.GetSection("IpRateLimiting"));
builder.Services.AddInMemoryRateLimiting();
builder.Services.AddSingleton<IRateLimitConfiguration, RateLimitConfiguration>();

// Configure JWT Settings
var jwtSettings = builder.Configuration.GetSection("Jwt").Get<JwtSettings>()
    ?? throw new InvalidOperationException("JWT settings are not configured in appsettings.json");
builder.Services.AddSingleton(jwtSettings);

// Register AuthService (scoped - depends on scoped IUserRepository) and OTP Service (singleton - in-memory store)
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddSingleton<IOtpService, OtpService>();

// Configure JWT Authentication
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings.Issuer,
        ValidAudience = jwtSettings.Audience,
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(jwtSettings.Key)),
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddEndpointsApiExplorer();

// Enhanced Swagger configuration with JWT support
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new()
    {
        Title = "Kudivila ATM Locator API",
        Version = "v1",
        Description = "API para localizar caixas automáticos com dinheiro disponível em Angola através de crowd-sourcing",
        Contact = new()
        {
            Name = "Kudivila Team",
            Email = "support@kudivila.ao"
        }
    });

    // Add JWT Bearer authentication to Swagger
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Insira o token JWT. Exemplo: eyJhbGciOiJIUzI1NiIs..."
    });

    c.AddSecurityRequirement(document => new OpenApiSecurityRequirement
    {
        [new OpenApiSecuritySchemeReference("Bearer", document)] = []
    });
});

// Configure ATM and Report settings
builder.Services.Configure<ATMSettings>(
    builder.Configuration.GetSection("ATMSettings"));
builder.Services.Configure<ReportSettings>(
    builder.Configuration.GetSection("ReportSettings"));

// Configure MongoDB
builder.Services.Configure<MongoDbSettings>(
    builder.Configuration.GetSection("MongoDbSettings"));

// Register MongoDB Context as Singleton (MongoDB driver is thread-safe)
builder.Services.AddSingleton<MongoDbContext>();

// Repositories and services as Scoped (one instance per request)
builder.Services.AddScoped<IATMRepository, ATMRepository>();
builder.Services.AddScoped<IStatusReportRepository, StatusReportRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IATMService, ATMService>();
builder.Services.AddScoped<IStatusReportService, StatusReportService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IAnalyticsService, AnalyticsService>();
builder.Services.AddSingleton<IPhotoService, PhotoService>();

// Add Health Checks
builder.Services.AddHealthChecks()
    .AddCheck<MongoDbHealthCheck>("mongodb");

// Configure CORS
// In Development: allow any origin so frontend devs can connect from any host.
// In Production: restrict to the configured allowed origins list.
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
var isDevelopment = builder.Environment.IsDevelopment();
builder.Services.AddCors(options =>
{
    options.AddPolicy("KudiLocPolicy", policy =>
    {
        if (isDevelopment || allowedOrigins.Length == 0)
        {
            policy.AllowAnyOrigin()
                  .AllowAnyMethod()
                  .AllowAnyHeader();
        }
        else
        {
            policy.WithOrigins(allowedOrigins)
                  .AllowAnyMethod()
                  .AllowAnyHeader();
        }
    });
});

// Serilog is configured above via builder.Host.UseSerilog()

var app = builder.Build();

// Create MongoDB indexes and seed data (skipped when MongoDbContext is not registered, e.g. in tests).
// Both operations are non-fatal: if MongoDB is unavailable the app will still start and
// serve requests. Endpoints that require the DB will return appropriate errors at call time.
{
    var dbContext = app.Services.GetService<MongoDbContext>();
    if (dbContext != null)
    {
        try
        {
            await dbContext.EnsureIndexesCreatedAsync();

            // Seed development data (only in Development, only if DB is empty)
            if (app.Environment.IsDevelopment())
            {
                var seederLogger = app.Services.GetService<ILoggerFactory>()?.CreateLogger("DevDataSeeder");
                await DevDataSeeder.SeedAsync(dbContext, seederLogger);
            }
        }
        catch (Exception ex)
        {
            Log.Warning(ex,
                "MongoDB is not available during startup. Index creation and data seeding were skipped. " +
                "The application will continue, but database-dependent endpoints will fail until MongoDB is reachable. " +
                "Start MongoDB and restart the application, or ensure the connection string in appsettings.json is correct");
        }
    }
}

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}

// HTTPS redirection is intentionally skipped — Render (and most cloud platforms) handle
// TLS termination at the edge. The app receives plain HTTP internally, so redirecting
// to HTTPS would break health checks and internal routing.

// Swagger is always available -- this is a free/open API and frontend devs need the docs
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Kudivila ATM Locator API v1");
    c.RoutePrefix = "swagger";
    c.DocumentTitle = "Kudivila API Documentation";
});

// Routing must be explicit so CORS can run after it (required in ASP.NET Core 6+)
app.UseRouting();

// CORS must come after UseRouting so endpoints are matched before CORS headers are applied
app.UseCors("KudiLocPolicy");

// Correlation ID for request tracing (reads or generates X-Correlation-Id)
app.UseMiddleware<CorrelationIdMiddleware>();

// Response compression (gzip/brotli) - must be early before anything writes the body
app.UseResponseCompression();

// Security headers on all responses
app.UseMiddleware<SecurityHeadersMiddleware>();

// IP Rate Limiting runs early in the pipeline (before auth)
app.UseIpRateLimiting();

// Serilog request logging (method, path, status code, duration)
app.UseSerilogRequestLogging();

// Add custom middleware
app.UseMiddleware<ErrorHandlingMiddleware>();
app.UseResponseCaching();

// Add health check endpoint
app.MapHealthChecks("/health");

app.UseAuthentication();
app.UseAuthorization();

// Serve static files (photos) before controllers so /photos/* is served directly
app.UseStaticFiles();

app.MapControllers();

// Root endpoint for quick status check
app.MapGet("/", () => new
{
    service = "Kudivila ATM Locator API",
    version = "1.0.0",
    status = "running",
    timestamp = DateTime.UtcNow
});

app.Run();

// Make Program accessible for integration tests via WebApplicationFactory
public partial class Program { }
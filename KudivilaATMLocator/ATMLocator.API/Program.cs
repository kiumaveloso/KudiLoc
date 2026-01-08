using ATMLocator.Application.Services;
using ATMLocator.Application.Validators;
using ATMLocator.Core.Interfaces;
using ATMLocator.Infrastructure.Configuration;
using ATMLocator.Infrastructure.Data;
using ATMLocator.Infrastructure.Repositories;
using ATMLocator.API.Middleware;
using ATMLocator.API.Services; 
using ATMLocator.API.HealthChecks;
using FluentValidation;
using FluentValidation.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();

// Add FluentValidation
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<CreateATMDtoValidator>();

builder.Services.AddEndpointsApiExplorer();

// Enhanced Swagger configuration
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
});

// Configure MongoDB
builder.Services.Configure<MongoDbSettings>(
    builder.Configuration.GetSection("MongoDbSettings"));

// Register MongoDB Context
builder.Services.AddSingleton<MongoDbContext>();

// Register Repositories
builder.Services.AddScoped<IATMRepository, ATMRepository>();
builder.Services.AddScoped<IStatusReportRepository, StatusReportRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();

// Register Services
builder.Services.AddScoped<IATMService, ATMService>();
builder.Services.AddScoped<IStatusReportService, StatusReportService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IPhotoService, PhotoService>();

// Enable static files for serving photos
builder.Services.AddDirectoryBrowser();

// Add Health Checks
builder.Services.AddHealthChecks()
    .AddCheck<MongoDbHealthCheck>("mongodb");

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Configure Logging
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Kudivila ATM Locator API v1");
        c.RoutePrefix = string.Empty; // Swagger at root
        c.DocumentTitle = "Kudivila API Documentation";
    });
}
else
{
    app.UseHsts();
}

// Add custom middleware
app.UseMiddleware<RequestLoggingMiddleware>();
app.UseMiddleware<ErrorHandlingMiddleware>();

app.UseHttpsRedirection();
app.UseCors("AllowAll");

// Add health check endpoint
app.MapHealthChecks("/health");

app.UseAuthorization();
app.MapControllers();

// Add a root endpoint for quick status check
app.MapGet("/", () => new
{
    service = "Kudivila ATM Locator API",
    version = "1.0.0",
    status = "running",
    timestamp = DateTime.UtcNow
});

// Serve static files (photos)
app.UseStaticFiles();

app.Run(); 
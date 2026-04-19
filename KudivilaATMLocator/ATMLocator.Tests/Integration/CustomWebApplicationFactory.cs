using ATMLocator.Core.Entities;
using ATMLocator.Core.Interfaces;
using ATMLocator.API.Services;
using ATMLocator.API.HealthChecks;
using ATMLocator.Infrastructure.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Moq;

namespace ATMLocator.Tests.Integration;

public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    public Mock<IATMRepository> MockATMRepository { get; } = new();
    public Mock<IUserRepository> MockUserRepository { get; } = new();
    public Mock<IStatusReportRepository> MockStatusReportRepository { get; } = new();
    public Mock<IPhotoService> MockPhotoService { get; } = new();
    public Mock<ICommentRepository> MockCommentRepository { get; } = new();
    public Mock<IBadgeRepository> MockBadgeRepository { get; } = new();
    public Mock<IVisitHistoryRepository> MockVisitHistoryRepository { get; } = new();
    public Mock<IRefreshTokenRepository> MockRefreshTokenRepository { get; } = new();
    public Mock<IOtpRepository> MockOtpRepository { get; } = new();
    public Mock<ILoginAuditRepository> MockLoginAuditRepository { get; } = new();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        // Provide test-only encryption keys so EncryptionService does not throw on startup
        builder.ConfigureAppConfiguration((_, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Encryption:Key"] = "CYqx2dXUp8ztrUBTvKsvA0rY219I7wzM5Ocwmsh/mkY=",
                ["Encryption:HmacKey"] = "HKoF3OrR118hgZQAJ4Eg2Q9fzDus0+KfCQoFw/0XBRs=",
            });
        });

        builder.ConfigureServices(services =>
        {
            // Remove MongoDbContext and MongoDbHealthCheck to avoid connecting to
            // real MongoDB during integration tests.
            RemoveService<MongoDbContext>(services);
            RemoveHealthCheck(services, "mongodb");

            // Remove ALL real repository and service registrations that depend on MongoDbContext
            RemoveService<IATMRepository>(services);
            RemoveService<IStatusReportRepository>(services);
            RemoveService<IUserRepository>(services);
            RemoveService<IPhotoService>(services);
            RemoveService<ICommentRepository>(services);
            RemoveService<IBadgeRepository>(services);
            RemoveService<IVisitHistoryRepository>(services);
            RemoveService<IRefreshTokenRepository>(services);
            RemoveService<IOtpRepository>(services);
            RemoveService<ILoginAuditRepository>(services);

            // Add mocks for all repositories
            services.AddSingleton(MockATMRepository.Object);
            services.AddSingleton(MockUserRepository.Object);
            services.AddSingleton(MockStatusReportRepository.Object);
            services.AddSingleton(MockPhotoService.Object);
            services.AddSingleton(MockCommentRepository.Object);
            services.AddSingleton(MockBadgeRepository.Object);
            services.AddSingleton(MockVisitHistoryRepository.Object);
            services.AddSingleton(MockRefreshTokenRepository.Object);
            services.AddSingleton(MockOtpRepository.Object);
            services.AddSingleton(MockLoginAuditRepository.Object);
        });
    }

    private static void RemoveService<T>(IServiceCollection services)
    {
        var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(T));
        if (descriptor != null)
        {
            services.Remove(descriptor);
        }
    }

    private static void RemoveHealthCheck(IServiceCollection services, string name)
    {
        // Health checks are registered via IConfigureOptions<HealthCheckServiceOptions>.
        // The simplest approach is to remove the MongoDbHealthCheck registration so
        // the DI container never tries to resolve MongoDbContext for health checks.
        var descriptor = services.SingleOrDefault(d =>
            d.ServiceType == typeof(IHealthCheck) &&
            d.ImplementationType == typeof(MongoDbHealthCheck));
        if (descriptor != null)
        {
            services.Remove(descriptor);
        }
    }
}

using ATMLocator.Core.Entities;
using ATMLocator.Core.Interfaces;
using ATMLocator.API.Services;
using ATMLocator.API.HealthChecks;
using ATMLocator.Infrastructure.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
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

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureServices(services =>
        {
            // Remove real repository registrations
            RemoveService<IATMRepository>(services);
            RemoveService<IStatusReportRepository>(services);
            RemoveService<IUserRepository>(services);
            RemoveService<IPhotoService>(services);

            // Remove MongoDbContext and MongoDbHealthCheck to avoid connecting to
            // real MongoDB during integration tests.
            RemoveService<MongoDbContext>(services);
            RemoveHealthCheck(services, "mongodb");

            // Add mocks
            services.AddSingleton(MockATMRepository.Object);
            services.AddSingleton(MockUserRepository.Object);
            services.AddSingleton(MockStatusReportRepository.Object);
            services.AddSingleton(MockPhotoService.Object);
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

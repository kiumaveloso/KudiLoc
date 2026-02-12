using ATMLocator.Core.Entities;
using ATMLocator.Core.Interfaces;
using ATMLocator.API.Services;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
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
}

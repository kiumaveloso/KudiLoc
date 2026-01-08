using ATMLocator.Infrastructure.Data;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using MongoDB.Driver;

namespace ATMLocator.API.HealthChecks;

public class MongoDbHealthCheck : IHealthCheck
{
    private readonly MongoDbContext _context;

    public MongoDbHealthCheck(MongoDbContext context)
    {
        _context = context;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context, 
        CancellationToken cancellationToken = default)
    {
        try
        {
            // Try to get count of ATMs (simple query to verify connection)
            await _context.ATMs.CountDocumentsAsync(
                FilterDefinition<Core.Entities.ATM>.Empty, 
                cancellationToken: cancellationToken
            );

            return HealthCheckResult.Healthy("MongoDB connection is healthy");
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy(
                "MongoDB connection failed", 
                exception: ex
            );
        }
    }
}
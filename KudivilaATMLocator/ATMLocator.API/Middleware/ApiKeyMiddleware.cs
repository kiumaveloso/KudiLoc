namespace ATMLocator.API.Middleware;

public class ApiKeyMiddleware(RequestDelegate next, IConfiguration configuration)
{
    private const string ApiKeyHeader = "X-API-Key";

    // Exact paths that bypass the API key check
    private static readonly string[] ExactPublicPaths =
    [
        "/",
        "/health",
        "/health/db"
    ];

    // Prefix paths that bypass the API key check (any sub-path matches)
    private static readonly string[] PrefixPublicPaths =
    [
        "/swagger"
    ];

    public async Task InvokeAsync(HttpContext context)
    {
        var apiKey = configuration["ApiKey"];

        // If no API key is configured, skip enforcement (local dev without key set)
        if (string.IsNullOrEmpty(apiKey))
        {
            await next(context);
            return;
        }

        // Allow public paths through without a key
        var path = context.Request.Path.Value ?? string.Empty;
        if (ExactPublicPaths.Any(p => path.Equals(p, StringComparison.OrdinalIgnoreCase))
            || PrefixPublicPaths.Any(p => path.StartsWith(p, StringComparison.OrdinalIgnoreCase)))
        {
            await next(context);
            return;
        }

        // Check the key
        if (!context.Request.Headers.TryGetValue(ApiKeyHeader, out var providedKey) || providedKey != apiKey)
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsync("{\"statusCode\":401,\"message\":\"API key inválida ou em falta.\"}");
            return;
        }

        await next(context);
    }
}

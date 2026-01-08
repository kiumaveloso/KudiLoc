namespace ATMLocator.API.Middleware;

public class RequestLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestLoggingMiddleware> _logger;

    public RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var requestTime = DateTime.UtcNow;
        
        _logger.LogInformation(
            "Incoming request: {Method} {Path} from {IP}",
            context.Request.Method,
            context.Request.Path,
            context.Connection.RemoteIpAddress
        );

        await _next(context);

        var elapsed = DateTime.UtcNow - requestTime;
        
        _logger.LogInformation(
            "Completed request: {Method} {Path} - Status: {StatusCode} - Duration: {Duration}ms",
            context.Request.Method,
            context.Request.Path,
            context.Response.StatusCode,
            elapsed.TotalMilliseconds
        );
    }
}
using System.Net;
using System.Text.Json;

namespace ATMLocator.API.Middleware;

public class ErrorHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ErrorHandlingMiddleware> _logger;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
    };

    public ErrorHandlingMiddleware(RequestDelegate next, ILogger<ErrorHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            // If the response has already started (headers sent), we cannot write
            // an error body. Re-throw so the server handles it with its default behaviour.
            if (context.Response.HasStarted)
            {
                _logger.LogWarning(ex, "Exception occurred after response started — cannot write error body");
                throw;
            }

            _logger.LogError(ex, "An unhandled exception occurred");
            await HandleExceptionAsync(context, ex);
        }
    }

    private static Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var (code, message) = exception switch
        {
            ArgumentException ex => (HttpStatusCode.BadRequest, ex.Message),
            // Only map InvalidOperationException to 400 if it looks like a business logic error.
            // Framework-internal InvalidOperationExceptions (e.g. PipeWriter) should not become 400.
            InvalidOperationException ex when !ex.Message.Contains("PipeWriter")
                => (HttpStatusCode.BadRequest, ex.Message),
            UnauthorizedAccessException => (HttpStatusCode.Unauthorized, "Acesso não autorizado"),
            KeyNotFoundException => (HttpStatusCode.NotFound, "Recurso não encontrado"),
            _ => (HttpStatusCode.InternalServerError, "Ocorreu um erro interno no servidor")
        };

        var result = JsonSerializer.Serialize(
            new { statusCode = (int)code, message },
            JsonOptions);

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)code;
        return context.Response.WriteAsync(result);
    }
}

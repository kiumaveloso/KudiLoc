using System.Net;
using System.Text.Json;

namespace ATMLocator.API.Middleware;

public class ErrorHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ErrorHandlingMiddleware> _logger;

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
            _logger.LogError(ex, "An unhandled exception occurred");
            await HandleExceptionAsync(context, ex);
        }
    }

    private static Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var code = HttpStatusCode.InternalServerError;
        var result = string.Empty;

        switch (exception)
        {
            case ArgumentException:
            case InvalidOperationException:
                code = HttpStatusCode.BadRequest;
                result = JsonSerializer.Serialize(new 
                { 
                    error = exception.Message 
                });
                break;
            
            case KeyNotFoundException:
                code = HttpStatusCode.NotFound;
                result = JsonSerializer.Serialize(new 
                { 
                    error = "Recurso não encontrado" 
                });
                break;
            
            default:
                result = JsonSerializer.Serialize(new 
                { 
                    error = "Ocorreu um erro interno no servidor" 
                });
                break;
        }

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)code;
        return context.Response.WriteAsync(result);
    }
}
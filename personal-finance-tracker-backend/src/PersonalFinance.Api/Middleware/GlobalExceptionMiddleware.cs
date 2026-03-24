using System.Net;
using System.Text.Json;
using PersonalFinance.Api.Exceptions;

namespace PersonalFinance.Api.Middleware;

public sealed class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;

    public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task Invoke(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception exception)
        {
            var (statusCode, title, type) = exception switch
            {
                ForbiddenException => ((int)HttpStatusCode.Forbidden, "Forbidden", "https://httpstatuses.com/403"),
                _ => ((int)HttpStatusCode.InternalServerError, "Server error", "https://httpstatuses.com/500"),
            };

            if (statusCode >= 500)
            {
                _logger.LogError(exception, "Unhandled request failure");
            }
            else
            {
                _logger.LogWarning(exception, "Handled request failure");
            }

            context.Response.StatusCode = statusCode;
            context.Response.ContentType = "application/problem+json";
            var payload = new
            {
                type,
                title,
                status = statusCode,
                detail = exception.Message,
                traceId = context.TraceIdentifier,
            };
            await context.Response.WriteAsync(JsonSerializer.Serialize(payload));
        }
    }
}

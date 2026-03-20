using System.Net;
using System.Text.Json;

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
            _logger.LogError(exception, "Unhandled request failure");
            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
            context.Response.ContentType = "application/problem+json";
            var payload = new
            {
                type = "https://httpstatuses.com/500",
                title = "Server error",
                status = 500,
                detail = exception.Message,
                traceId = context.TraceIdentifier,
            };
            await context.Response.WriteAsync(JsonSerializer.Serialize(payload));
        }
    }
}

namespace PersonalFinance.Api.Middleware;

using System.Security.Claims;
using PersonalFinance.Application.Abstractions;

public sealed class HttpCurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public HttpCurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public Guid GetRequiredUserId()
    {
        var raw = _httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? _httpContextAccessor.HttpContext?.User.FindFirstValue("sub");

        return Guid.TryParse(raw, out var userId) ? userId : Guid.Empty;
    }

    public string? GetEmail() => _httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.Email);
}

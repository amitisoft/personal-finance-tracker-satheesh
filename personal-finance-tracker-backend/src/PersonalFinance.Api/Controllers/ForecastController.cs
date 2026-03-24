using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PersonalFinance.Api.Services;
using PersonalFinance.Application.Abstractions;

namespace PersonalFinance.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/forecast")]
public sealed class ForecastController : ControllerBase
{
    private readonly ForecastService _forecastService;
    private readonly ICurrentUserService _currentUser;

    public ForecastController(ForecastService forecastService, ICurrentUserService currentUser)
    {
        _forecastService = forecastService;
        _currentUser = currentUser;
    }

    [HttpGet("month")]
    public async Task<IActionResult> GetMonth(CancellationToken cancellationToken)
    {
        var userId = _currentUser.GetRequiredUserId();
        var forecast = await _forecastService.BuildMonthlyForecastAsync(userId, cancellationToken);
        return Ok(forecast.Summary);
    }

    [HttpGet("daily")]
    public async Task<IActionResult> GetDaily(CancellationToken cancellationToken)
    {
        var userId = _currentUser.GetRequiredUserId();
        var forecast = await _forecastService.BuildMonthlyForecastAsync(userId, cancellationToken);
        return Ok(forecast.Daily);
    }
}

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PersonalFinance.Api.Services;
using PersonalFinance.Application.Abstractions;

namespace PersonalFinance.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/insights")]
public sealed class InsightsController : ControllerBase
{
    private readonly InsightsService _insightsService;
    private readonly ICurrentUserService _currentUser;

    public InsightsController(InsightsService insightsService, ICurrentUserService currentUser)
    {
        _insightsService = insightsService;
        _currentUser = currentUser;
    }

    [HttpGet("health-score")]
    public async Task<IActionResult> GetHealthScore(CancellationToken cancellationToken)
    {
        var userId = _currentUser.GetRequiredUserId();
        return Ok(await _insightsService.GetHealthScoreAsync(userId, cancellationToken));
    }

    [HttpGet]
    public async Task<IActionResult> GetInsights(CancellationToken cancellationToken)
    {
        var userId = _currentUser.GetRequiredUserId();
        return Ok(await _insightsService.GetInsightsAsync(userId, cancellationToken));
    }
}

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PersonalFinance.Api.Contracts;
using PersonalFinance.Api.Helpers;
using PersonalFinance.Application.Abstractions;
using PersonalFinance.Domain.Entities;
using PersonalFinance.Domain.Enums;
using PersonalFinance.Infrastructure.Persistence;

namespace PersonalFinance.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/goals")]
public sealed class GoalsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public GoalsController(AppDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<GoalVm>>> GetAll(CancellationToken cancellationToken)
    {
        var userId = _currentUser.GetRequiredUserId();
        var items = await _db.GoalsSet.Where(x => x.UserId == userId).OrderBy(x => x.TargetDate).ToListAsync(cancellationToken);
        return Ok(items.Select(x => x.ToVm()).ToList());
    }

    [HttpPost]
    public async Task<ActionResult<GoalVm>> Create([FromBody] GoalVm request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.GetRequiredUserId();
        var goal = new Goal
        {
            UserId = userId,
            Name = request.Name.Trim(),
            TargetAmount = request.TargetAmount,
            CurrentAmount = request.CurrentAmount,
            TargetDate = request.TargetDate,
            LinkedAccountId = request.LinkedAccountId,
            Icon = request.Icon,
            Color = request.Color,
            Status = request.Status.ToGoalStatus(),
        };
        _db.GoalsSet.Add(goal);
        await _db.SaveChangesAsync(cancellationToken);
        return Ok(goal.ToVm());
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<GoalVm>> Update(Guid id, [FromBody] GoalVm request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.GetRequiredUserId();
        var goal = await _db.GoalsSet.SingleAsync(x => x.Id == id && x.UserId == userId, cancellationToken);
        goal.Name = request.Name.Trim();
        goal.TargetAmount = request.TargetAmount;
        goal.CurrentAmount = request.CurrentAmount;
        goal.TargetDate = request.TargetDate;
        goal.LinkedAccountId = request.LinkedAccountId;
        goal.Icon = request.Icon;
        goal.Color = request.Color;
        goal.Status = request.Status.ToGoalStatus();
        goal.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);
        return Ok(goal.ToVm());
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var userId = _currentUser.GetRequiredUserId();
        var goal = await _db.GoalsSet.SingleAsync(x => x.Id == id && x.UserId == userId, cancellationToken);
        _db.GoalsSet.Remove(goal);
        await _db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpPost("{id:guid}/contribute")]
    public async Task<ActionResult<GoalVm>> Contribute(Guid id, [FromBody] GoalAmountRequest request, CancellationToken cancellationToken)
    {
        return Ok(await ChangeAmountAsync(id, request.Amount, GoalContributionType.Contribution, cancellationToken));
    }

    [HttpPost("{id:guid}/withdraw")]
    public async Task<ActionResult<GoalVm>> Withdraw(Guid id, [FromBody] GoalAmountRequest request, CancellationToken cancellationToken)
    {
        return Ok(await ChangeAmountAsync(id, request.Amount, GoalContributionType.Withdrawal, cancellationToken));
    }

    private async Task<GoalVm> ChangeAmountAsync(Guid id, decimal amount, GoalContributionType contributionType, CancellationToken cancellationToken)
    {
        var userId = _currentUser.GetRequiredUserId();
        var goal = await _db.GoalsSet.SingleAsync(x => x.Id == id && x.UserId == userId, cancellationToken);
        goal.CurrentAmount += contributionType == GoalContributionType.Contribution ? amount : -amount;
        if (goal.CurrentAmount < 0) goal.CurrentAmount = 0;
        goal.UpdatedAt = DateTimeOffset.UtcNow;
        _db.GoalContributions.Add(new GoalContribution { GoalId = goal.Id, UserId = userId, AccountId = goal.LinkedAccountId, Amount = amount, Type = contributionType });
        await _db.SaveChangesAsync(cancellationToken);
        return goal.ToVm();
    }
}

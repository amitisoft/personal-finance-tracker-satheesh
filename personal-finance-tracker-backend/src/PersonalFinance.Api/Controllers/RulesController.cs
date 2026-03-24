using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PersonalFinance.Api.Contracts;
using PersonalFinance.Api.Services;
using PersonalFinance.Application.Abstractions;
using PersonalFinance.Domain.Entities;
using PersonalFinance.Infrastructure.Persistence;

namespace PersonalFinance.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/rules")]
public sealed class RulesController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly RuleEngineService _ruleEngine;

    public RulesController(AppDbContext db, ICurrentUserService currentUser, RuleEngineService ruleEngine)
    {
        _db = db;
        _currentUser = currentUser;
        _ruleEngine = ruleEngine;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<RuleVm>>> GetAll(CancellationToken cancellationToken)
    {
        var userId = _currentUser.GetRequiredUserId();
        var rules = await _ruleEngine.GetRulesAsync(userId, cancellationToken);
        return Ok(rules.Select(ToVm).ToList());
    }

    [HttpPost]
    public async Task<ActionResult<RuleVm>> Create([FromBody] RuleVm request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.GetRequiredUserId();
        _ruleEngine.Validate(request.Condition, request.Action);
        var entity = new Rule
        {
            UserId = userId,
            Name = request.Name.Trim(),
            ConditionJson = JsonSerializer.Serialize(request.Condition),
            ActionJson = JsonSerializer.Serialize(request.Action),
            Priority = request.Priority,
            IsActive = request.IsActive,
        };
        _db.RulesSet.Add(entity);
        await _db.SaveChangesAsync(cancellationToken);
        return Ok(ToVm(entity));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<RuleVm>> Update(Guid id, [FromBody] RuleVm request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.GetRequiredUserId();
        _ruleEngine.Validate(request.Condition, request.Action);
        var entity = await _db.RulesSet.SingleAsync(x => x.Id == id && x.UserId == userId, cancellationToken);
        entity.Name = request.Name.Trim();
        entity.ConditionJson = JsonSerializer.Serialize(request.Condition);
        entity.ActionJson = JsonSerializer.Serialize(request.Action);
        entity.Priority = request.Priority;
        entity.IsActive = request.IsActive;
        entity.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);
        return Ok(ToVm(entity));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var userId = _currentUser.GetRequiredUserId();
        var entity = await _db.RulesSet.SingleAsync(x => x.Id == id && x.UserId == userId, cancellationToken);
        _db.RulesSet.Remove(entity);
        await _db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpPost("{id:guid}/toggle")]
    public async Task<ActionResult<RuleVm>> Toggle(Guid id, CancellationToken cancellationToken)
    {
        var userId = _currentUser.GetRequiredUserId();
        var entity = await _db.RulesSet.SingleAsync(x => x.Id == id && x.UserId == userId, cancellationToken);
        entity.IsActive = !entity.IsActive;
        entity.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);
        return Ok(ToVm(entity));
    }

    [HttpPost("test")]
    public async Task<ActionResult<RuleTestResultVm>> Test([FromBody] RuleTestRequest request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.GetRequiredUserId();
        return Ok(await _ruleEngine.TestAsync(userId, request, cancellationToken));
    }

    [HttpPost("reapply")]
    public async Task<IActionResult> Reapply([FromBody] RuleReapplyRequest request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.GetRequiredUserId();
        var transactions = await _db.TransactionsSet
            .Where(x => x.UserId == userId && (request.TransactionIds == null || request.TransactionIds.Contains(x.Id)))
            .ToListAsync(cancellationToken);

        foreach (var transaction in transactions)
        {
            await _ruleEngine.ApplyAsync(userId, transaction, cancellationToken);
        }

        await _db.SaveChangesAsync(cancellationToken);
        return Ok(new { updated = transactions.Count });
    }

    private RuleVm ToVm(Rule entity)
    {
        var condition = JsonSerializer.Deserialize<RuleConditionVm>(entity.ConditionJson) ?? new RuleConditionVm("merchant", "equals", null);
        var action = JsonSerializer.Deserialize<RuleActionVm>(entity.ActionJson) ?? new RuleActionVm("mark_review", null);
        return new RuleVm(entity.Id, entity.Name, condition, action, entity.Priority, entity.IsActive, _ruleEngine.BuildSummary(condition, action));
    }
}

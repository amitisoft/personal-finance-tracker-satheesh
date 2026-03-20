using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PersonalFinance.Api.Contracts;
using PersonalFinance.Api.Helpers;
using PersonalFinance.Application.Abstractions;
using PersonalFinance.Domain.Entities;
using PersonalFinance.Infrastructure.Persistence;

namespace PersonalFinance.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/budgets")]
public sealed class BudgetsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public BudgetsController(AppDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<BudgetVm>>> GetAll([FromQuery] int? month, [FromQuery] int? year, CancellationToken cancellationToken)
    {
        var userId = _currentUser.GetRequiredUserId();
        var query = _db.BudgetsSet.Where(x => x.UserId == userId);
        if (month.HasValue) query = query.Where(x => x.Month == month.Value);
        if (year.HasValue) query = query.Where(x => x.Year == year.Value);
        var budgets = await query.OrderByDescending(x => x.Year).ThenByDescending(x => x.Month).ToListAsync(cancellationToken);
        var transactions = await _db.TransactionsSet.Where(x => x.UserId == userId).ToListAsync(cancellationToken);
        return Ok(budgets.Select(b => b.ToVm(transactions.Where(x => x.CategoryId == b.CategoryId && x.TransactionDate.Month == b.Month && x.TransactionDate.Year == b.Year && x.Type == Domain.Enums.TransactionType.Expense).Sum(x => x.Amount))).ToList());
    }

    [HttpPost]
    public async Task<ActionResult<BudgetVm>> Create([FromBody] BudgetVm request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.GetRequiredUserId();
        var budget = new Budget { UserId = userId, CategoryId = request.CategoryId, Month = request.Month, Year = request.Year, Amount = request.Amount, AlertThresholdPercent = request.AlertThresholdPercent };
        _db.BudgetsSet.Add(budget);
        await _db.SaveChangesAsync(cancellationToken);
        return Ok(budget.ToVm(0));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<BudgetVm>> Update(Guid id, [FromBody] BudgetVm request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.GetRequiredUserId();
        var budget = await _db.BudgetsSet.SingleAsync(x => x.Id == id && x.UserId == userId, cancellationToken);
        budget.CategoryId = request.CategoryId;
        budget.Month = request.Month;
        budget.Year = request.Year;
        budget.Amount = request.Amount;
        budget.AlertThresholdPercent = request.AlertThresholdPercent;
        budget.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);
        return Ok(budget.ToVm(request.Spent));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var userId = _currentUser.GetRequiredUserId();
        var budget = await _db.BudgetsSet.SingleAsync(x => x.Id == id && x.UserId == userId, cancellationToken);
        _db.BudgetsSet.Remove(budget);
        await _db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpPost("duplicate-last-month")]
    public async Task<IActionResult> DuplicateLastMonth(CancellationToken cancellationToken)
    {
        var userId = _currentUser.GetRequiredUserId();
        var now = DateOnly.FromDateTime(DateTime.UtcNow);
        var lastMonth = now.AddMonths(-1);
        var currentExists = await _db.BudgetsSet.AnyAsync(x => x.UserId == userId && x.Month == now.Month && x.Year == now.Year, cancellationToken);
        if (currentExists)
        {
            return BadRequest(new { message = "Current month budgets already exist." });
        }

        var lastBudgets = await _db.BudgetsSet.Where(x => x.UserId == userId && x.Month == lastMonth.Month && x.Year == lastMonth.Year).ToListAsync(cancellationToken);
        _db.BudgetsSet.AddRange(lastBudgets.Select(x => new Budget { UserId = userId, CategoryId = x.CategoryId, Month = now.Month, Year = now.Year, Amount = x.Amount, AlertThresholdPercent = x.AlertThresholdPercent }));
        await _db.SaveChangesAsync(cancellationToken);
        return Ok(new { success = true });
    }
}

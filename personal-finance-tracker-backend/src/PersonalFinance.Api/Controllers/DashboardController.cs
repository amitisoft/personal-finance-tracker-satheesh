using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PersonalFinance.Api.Contracts;
using PersonalFinance.Api.Helpers;
using PersonalFinance.Application.Abstractions;
using PersonalFinance.Domain.Enums;
using PersonalFinance.Infrastructure.Persistence;

namespace PersonalFinance.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/dashboard")]
public sealed class DashboardController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public DashboardController(AppDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    [HttpGet("summary")]
    public async Task<ActionResult<DashboardVm>> Summary([FromQuery] int? month, [FromQuery] int? year, CancellationToken cancellationToken)
    {
        var userId = _currentUser.GetRequiredUserId();
        var now = DateOnly.FromDateTime(DateTime.UtcNow);
        var selectedMonth = month ?? now.Month;
        var selectedYear = year ?? now.Year;

        var accounts = await _db.AccountsSet.Where(x => x.UserId == userId).ToListAsync(cancellationToken);
        var categories = await _db.CategoriesSet.Where(x => x.UserId == userId).ToListAsync(cancellationToken);
        var transactions = await _db.TransactionsSet.Where(x => x.UserId == userId).ToListAsync(cancellationToken);
        var budgets = await _db.BudgetsSet.Where(x => x.UserId == userId).ToListAsync(cancellationToken);
        var goals = await _db.GoalsSet.Where(x => x.UserId == userId).ToListAsync(cancellationToken);
        var recurring = await _db.RecurringTransactionsSet.Where(x => x.UserId == userId).ToListAsync(cancellationToken);

        var currentTransactions = transactions.Where(x => x.TransactionDate.Month == selectedMonth && x.TransactionDate.Year == selectedYear).ToList();
        var income = currentTransactions.Where(x => x.Type == TransactionType.Income).Sum(x => x.Amount);
        var expense = currentTransactions.Where(x => x.Type == TransactionType.Expense).Sum(x => x.Amount);
        var netBalance = accounts.Sum(x => x.CurrentBalance);
        var goalSavings = goals.Sum(x => x.CurrentAmount);

        var budgetDtos = budgets.OrderBy(x => x.Year).ThenBy(x => x.Month).Select(b =>
        {
            var spent = transactions.Where(x => x.Type == TransactionType.Expense && x.CategoryId == b.CategoryId && x.TransactionDate.Month == b.Month && x.TransactionDate.Year == b.Year).Sum(x => x.Amount);
            return b.ToVm(spent);
        }).ToList();

        var categorySpend = currentTransactions.Where(x => x.Type == TransactionType.Expense && x.CategoryId.HasValue)
            .GroupBy(x => x.CategoryId!.Value)
            .Select(group =>
            {
                var category = categories.FirstOrDefault(c => c.Id == group.Key);
                return (object)new { name = category?.Name ?? "Uncategorized", value = group.Sum(x => x.Amount), color = category?.Color ?? "#2563eb" };
            }).ToList();

        var incomeExpenseTrend = Enumerable.Range(0, 3)
            .Select(offset => new DateOnly(now.Year, now.Month, 1).AddMonths(-2 + offset))
            .Select(period =>
            {
                var monthly = transactions.Where(x => x.TransactionDate.Month == period.Month && x.TransactionDate.Year == period.Year).ToList();
                return (object)new { month = period.ToString("MMM yyyy"), income = monthly.Where(x => x.Type == TransactionType.Income).Sum(x => x.Amount), expense = monthly.Where(x => x.Type == TransactionType.Expense).Sum(x => x.Amount) };
            }).ToList();

        var dto = new DashboardVm(
            income,
            expense,
            netBalance,
            goalSavings,
            budgetDtos,
            categorySpend,
            incomeExpenseTrend,
            transactions.OrderByDescending(x => x.TransactionDate).ThenByDescending(x => x.CreatedAt).Take(5).Select(x => x.ToVm()).ToList(),
            recurring.Where(x => x.NextRunDate >= now && x.Status == RecurringStatus.Active).OrderBy(x => x.NextRunDate).Take(5).Select(x => x.ToVm()).ToList(),
            goals.OrderBy(x => x.TargetDate).Select(x => x.ToVm()).ToList());

        return Ok(dto);
    }
}

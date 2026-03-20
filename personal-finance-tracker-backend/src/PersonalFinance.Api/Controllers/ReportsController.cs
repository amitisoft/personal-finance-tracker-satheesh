using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PersonalFinance.Application.Abstractions;
using PersonalFinance.Domain.Enums;
using PersonalFinance.Infrastructure.Persistence;

namespace PersonalFinance.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/reports")]
public sealed class ReportsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public ReportsController(AppDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    [HttpGet("category-spend")]
    public async Task<IActionResult> CategorySpend(CancellationToken cancellationToken)
    {
        var userId = _currentUser.GetRequiredUserId();
        var categories = await _db.CategoriesSet.Where(x => x.UserId == userId).ToDictionaryAsync(x => x.Id, cancellationToken);
        var data = await _db.TransactionsSet.Where(x => x.UserId == userId && x.Type == TransactionType.Expense && x.CategoryId != null).ToListAsync(cancellationToken);
        return Ok(data.GroupBy(x => x.CategoryId!.Value).Select(g => new { name = categories[g.Key].Name, value = g.Sum(x => x.Amount), color = categories[g.Key].Color ?? "#2563eb" }).ToList());
    }

    [HttpGet("income-vs-expense")]
    public async Task<IActionResult> IncomeVsExpense(CancellationToken cancellationToken)
    {
        var userId = _currentUser.GetRequiredUserId();
        var now = DateOnly.FromDateTime(DateTime.UtcNow);
        var transactions = await _db.TransactionsSet.Where(x => x.UserId == userId).ToListAsync(cancellationToken);
        var data = Enumerable.Range(0, 6).Select(offset => new DateOnly(now.Year, now.Month, 1).AddMonths(-5 + offset)).Select(period =>
        {
            var monthly = transactions.Where(x => x.TransactionDate.Month == period.Month && x.TransactionDate.Year == period.Year).ToList();
            return new { month = period.ToString("MMM yyyy"), income = monthly.Where(x => x.Type == TransactionType.Income).Sum(x => x.Amount), expense = monthly.Where(x => x.Type == TransactionType.Expense).Sum(x => x.Amount) };
        }).ToList();
        return Ok(data);
    }

    [HttpGet("account-balance-trend")]
    public async Task<IActionResult> AccountBalanceTrend(CancellationToken cancellationToken)
    {
        var userId = _currentUser.GetRequiredUserId();
        var now = DateOnly.FromDateTime(DateTime.UtcNow);
        var accounts = await _db.AccountsSet.Where(x => x.UserId == userId).ToListAsync(cancellationToken);
        var transactions = await _db.TransactionsSet.Where(x => x.UserId == userId).ToListAsync(cancellationToken);
        var data = Enumerable.Range(0, 6).Select(offset => new DateOnly(now.Year, now.Month, 1).AddMonths(-5 + offset)).Select(period =>
        {
            var end = period.AddMonths(1).AddDays(-1);
            var balance = accounts.Sum(a => a.OpeningBalance) + transactions.Where(t => t.TransactionDate <= end).Sum(t => t.Type == TransactionType.Income ? t.Amount : t.Type == TransactionType.Expense ? -t.Amount : 0m);
            return new { month = period.ToString("MMM yyyy"), balance };
        }).ToList();
        return Ok(data);
    }

    [HttpGet("savings-progress")]
    public async Task<IActionResult> SavingsProgress(CancellationToken cancellationToken)
    {
        var userId = _currentUser.GetRequiredUserId();
        var goals = await _db.GoalsSet.Where(x => x.UserId == userId).ToListAsync(cancellationToken);
        return Ok(goals.Select(x => new { name = x.Name, progress = x.TargetAmount == 0 ? 0 : Math.Round((x.CurrentAmount / x.TargetAmount) * 100, 2) }).ToList());
    }

    [HttpGet("export/csv")]
    public async Task<IActionResult> ExportCsv(CancellationToken cancellationToken)
    {
        var userId = _currentUser.GetRequiredUserId();
        var transactions = await _db.TransactionsSet.Where(x => x.UserId == userId).OrderByDescending(x => x.TransactionDate).ToListAsync(cancellationToken);
        var builder = new StringBuilder();
        builder.AppendLine("Date,Type,Amount,Merchant,Note,PaymentMethod");
        foreach (var item in transactions)
        {
            builder.AppendLine($"{item.TransactionDate:yyyy-MM-dd},{item.Type.ToString().ToLowerInvariant()},{item.Amount},\"{item.Merchant}\",\"{item.Note}\",\"{item.PaymentMethod}\"");
        }
        return File(Encoding.UTF8.GetBytes(builder.ToString()), "text/csv", "transactions.csv");
    }
}

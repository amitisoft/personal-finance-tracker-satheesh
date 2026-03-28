using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PersonalFinance.Application.Abstractions;
using PersonalFinance.Api.Contracts;
using PersonalFinance.Api.Services;
using PersonalFinance.Domain.Enums;
using PersonalFinance.Infrastructure.Persistence;

namespace PersonalFinance.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/reports")]
public sealed class ReportsController : ControllerBase
{
    private const string SharedMemberSpendColor = "#ef4444";
    private const string UncategorizedLabel = "Needs review";
    private const string UncategorizedColor = "#64748b";

    private readonly AppDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly AccountAccessService _accountAccess;
    private readonly InsightsService _insightsService;

    public ReportsController(AppDbContext db, ICurrentUserService currentUser, AccountAccessService accountAccess, InsightsService insightsService)
    {
        _db = db;
        _currentUser = currentUser;
        _accountAccess = accountAccess;
        _insightsService = insightsService;
    }

    [HttpGet("category-spend")]
    public async Task<IActionResult> CategorySpend(CancellationToken cancellationToken)
    {
        var userId = _currentUser.GetRequiredUserId();
        var accountIds = await _accountAccess.GetAccessibleAccountIdsAsync(userId, cancellationToken);
        var data = await _db.TransactionsSet
            .Include(x => x.Category)
            .Include(x => x.User)
            .Where(x => accountIds.Contains(x.AccountId) && x.Type == TransactionType.Expense)
            .ToListAsync(cancellationToken);

        return Ok(data
            .GroupBy(x => BuildCategoryBucket(x, userId))
            .Select(g => new { name = g.Key.Name, value = g.Sum(x => x.Amount), color = g.Key.Color })
            .OrderByDescending(x => x.value)
            .ToList());
    }

    [HttpGet("income-vs-expense")]
    public async Task<IActionResult> IncomeVsExpense(CancellationToken cancellationToken)
    {
        var userId = _currentUser.GetRequiredUserId();
        var accountIds = await _accountAccess.GetAccessibleAccountIdsAsync(userId, cancellationToken);
        var now = DateOnly.FromDateTime(DateTime.UtcNow);
        var transactions = await _db.TransactionsSet.Where(x => accountIds.Contains(x.AccountId)).ToListAsync(cancellationToken);
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
        var accountIds = await _accountAccess.GetAccessibleAccountIdsAsync(userId, cancellationToken);
        var now = DateOnly.FromDateTime(DateTime.UtcNow);
        var accounts = await _db.AccountsSet.Where(x => accountIds.Contains(x.Id)).ToListAsync(cancellationToken);
        var transactions = await _db.TransactionsSet.Where(x => accountIds.Contains(x.AccountId) || (x.DestinationAccountId.HasValue && accountIds.Contains(x.DestinationAccountId.Value))).ToListAsync(cancellationToken);
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
        var accountIds = await _accountAccess.GetAccessibleAccountIdsAsync(userId, cancellationToken);
        var transactions = await _db.TransactionsSet.Where(x => accountIds.Contains(x.AccountId)).OrderByDescending(x => x.TransactionDate).ToListAsync(cancellationToken);
        var builder = new StringBuilder();
        builder.AppendLine("Date,Type,Amount,Merchant,Note,PaymentMethod");
        foreach (var item in transactions)
        {
            builder.AppendLine($"{item.TransactionDate:yyyy-MM-dd},{item.Type.ToString().ToLowerInvariant()},{item.Amount},\"{item.Merchant}\",\"{item.Note}\",\"{item.PaymentMethod}\"");
        }
        return File(Encoding.UTF8.GetBytes(builder.ToString()), "text/csv", "transactions.csv");
    }

    [HttpGet("trends")]
    public async Task<ActionResult<ReportTrendResponseVm>> Trends(
        [FromQuery] DateOnly? dateFrom,
        [FromQuery] DateOnly? dateTo,
        [FromQuery] Guid? accountId,
        [FromQuery] Guid? categoryId,
        CancellationToken cancellationToken)
    {
        var userId = _currentUser.GetRequiredUserId();
        var accountIds = await _accountAccess.GetAccessibleAccountIdsAsync(userId, cancellationToken);
        if (accountId.HasValue)
        {
            accountIds = accountIds.Where(x => x == accountId.Value).ToList();
        }

        var from = dateFrom ?? DateOnly.FromDateTime(DateTime.UtcNow).AddMonths(-5);
        var to = dateTo ?? DateOnly.FromDateTime(DateTime.UtcNow);
        var transactions = await _db.TransactionsSet
            .Include(x => x.Category)
            .Include(x => x.User)
            .Where(x => accountIds.Contains(x.AccountId) && x.TransactionDate >= from && x.TransactionDate <= to && (!categoryId.HasValue || x.CategoryId == categoryId))
            .ToListAsync(cancellationToken);
        var accounts = await _db.AccountsSet.Where(x => accountIds.Contains(x.Id)).ToListAsync(cancellationToken);

        var monthly = Enumerable.Range(0, ((to.Year - from.Year) * 12) + to.Month - from.Month + 1)
            .Select(offset => new DateOnly(from.Year, from.Month, 1).AddMonths(offset))
            .Select(period =>
            {
                var data = transactions.Where(x => x.TransactionDate.Month == period.Month && x.TransactionDate.Year == period.Year).ToList();
                var income = data.Where(x => x.Type == TransactionType.Income).Sum(x => x.Amount);
                var expense = data.Where(x => x.Type == TransactionType.Expense).Sum(x => x.Amount);
                var netWorth = accounts.Sum(x => x.OpeningBalance) + transactions.Where(x => x.TransactionDate <= period.AddMonths(1).AddDays(-1)).Sum(t => t.Type == TransactionType.Income ? t.Amount : t.Type == TransactionType.Expense ? -t.Amount : 0m);
                return new { period = period.ToString("MMM yyyy"), income, expense, savingsRate = income <= 0 ? 0 : Math.Round(((income - expense) / income) * 100, 2), netWorth };
            })
            .ToList();

        var categoryTrends = transactions
            .Where(x => x.Type == TransactionType.Expense)
            .GroupBy(x => new
            {
                x.TransactionDate.Year,
                x.TransactionDate.Month,
                Bucket = BuildCategoryBucket(x, userId)
            })
            .Select(g => new
            {
                period = new DateOnly(g.Key.Year, g.Key.Month, 1).ToString("MMM yyyy"),
                category = g.Key.Bucket.Name,
                value = g.Sum(x => x.Amount),
                color = g.Key.Bucket.Color,
            })
            .OrderBy(x => x.period)
            .ToList<object>();

        var insights = await _insightsService.GetInsightsAsync(userId, cancellationToken);
        return Ok(new ReportTrendResponseVm(
            categoryTrends,
            monthly.Select(x => (object)new { period = x.period, value = x.savingsRate }).ToList(),
            monthly.Select(x => (object)new { period = x.period, income = x.income, expense = x.expense }).ToList(),
            monthly.Select(x => (object)new { period = x.period, value = x.netWorth }).ToList(),
            insights.Highlights));
    }

    [HttpGet("net-worth")]
    public async Task<IActionResult> NetWorth(
        [FromQuery] DateOnly? dateFrom,
        [FromQuery] DateOnly? dateTo,
        [FromQuery] Guid? accountId,
        CancellationToken cancellationToken)
    {
        var userId = _currentUser.GetRequiredUserId();
        var accountIds = await _accountAccess.GetAccessibleAccountIdsAsync(userId, cancellationToken);
        if (accountId.HasValue)
        {
            accountIds = accountIds.Where(x => x == accountId.Value).ToList();
        }

        var from = dateFrom ?? DateOnly.FromDateTime(DateTime.UtcNow).AddMonths(-5);
        var to = dateTo ?? DateOnly.FromDateTime(DateTime.UtcNow);
        var accounts = await _db.AccountsSet.Where(x => accountIds.Contains(x.Id)).ToListAsync(cancellationToken);
        var transactions = await _db.TransactionsSet.Where(x => accountIds.Contains(x.AccountId) && x.TransactionDate >= from.AddMonths(-1) && x.TransactionDate <= to).ToListAsync(cancellationToken);

        var data = Enumerable.Range(0, ((to.Year - from.Year) * 12) + to.Month - from.Month + 1)
            .Select(offset => new DateOnly(from.Year, from.Month, 1).AddMonths(offset))
            .Select(period =>
            {
                var end = period.AddMonths(1).AddDays(-1);
                var value = accounts.Sum(x => x.OpeningBalance) + transactions.Where(t => t.TransactionDate <= end).Sum(t => t.Type == TransactionType.Income ? t.Amount : t.Type == TransactionType.Expense ? -t.Amount : 0m);
                return new { period = period.ToString("MMM yyyy"), value };
            })
            .ToList();

        return Ok(data);
    }

    private static (string Name, string Color) BuildCategoryBucket(PersonalFinance.Domain.Entities.Transaction transaction, Guid currentUserId)
    {
        if (transaction.UserId != currentUserId)
        {
            return (BuildSharedUserSpendLabel(transaction.User?.DisplayName ?? transaction.User?.Email), SharedMemberSpendColor);
        }

        return (
            transaction.Category?.Name ?? UncategorizedLabel,
            transaction.Category?.Color ?? UncategorizedColor);
    }

    private static string BuildSharedUserSpendLabel(string? actorName)
    {
        var normalized = string.IsNullOrWhiteSpace(actorName) ? "member" : actorName.Trim();
        return $"Shared user {normalized} spent";
    }
}


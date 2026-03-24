using Microsoft.EntityFrameworkCore;
using PersonalFinance.Api.Contracts;
using PersonalFinance.Domain.Enums;
using PersonalFinance.Infrastructure.Persistence;

namespace PersonalFinance.Api.Services;

public sealed class InsightsService
{
    private readonly AppDbContext _db;
    private readonly AccountAccessService _accountAccess;

    public InsightsService(AppDbContext db, AccountAccessService accountAccess)
    {
        _db = db;
        _accountAccess = accountAccess;
    }

    public async Task<HealthScoreVm> GetHealthScoreAsync(Guid userId, CancellationToken cancellationToken)
    {
        var accountIds = await _accountAccess.GetAccessibleAccountIdsAsync(userId, cancellationToken);
        var now = DateOnly.FromDateTime(DateTime.UtcNow);
        var from = new DateOnly(now.Year, now.Month, 1).AddMonths(-2);

        var transactions = await _db.TransactionsSet.Where(x => accountIds.Contains(x.AccountId) && x.TransactionDate >= from).ToListAsync(cancellationToken);
        var budgets = await _db.BudgetsSet.Where(x => x.UserId == userId && x.Year >= from.Year).ToListAsync(cancellationToken);
        var accounts = await _db.AccountsSet.Where(x => accountIds.Contains(x.Id)).ToListAsync(cancellationToken);

        var income = transactions.Where(x => x.Type == TransactionType.Income).Sum(x => x.Amount);
        var expense = transactions.Where(x => x.Type == TransactionType.Expense).Sum(x => x.Amount);
        var savingsRate = income <= 0 ? 0 : Math.Max(0, Math.Min(1, (income - expense) / income));
        var monthlyExpenses = transactions.Where(x => x.Type == TransactionType.Expense).GroupBy(x => $"{x.TransactionDate.Year}-{x.TransactionDate.Month}").Select(x => x.Sum(y => y.Amount)).ToList();
        var expenseStability = monthlyExpenses.Count <= 1 ? 0.6m : 1 - Math.Min(1, StandardDeviation(monthlyExpenses) / Math.Max(1, monthlyExpenses.Average()));
        var adheredBudgets = budgets.Count == 0
            ? 0.5m
            : budgets.Count(b =>
            {
                var spent = transactions.Where(x => x.CategoryId == b.CategoryId && x.TransactionDate.Month == b.Month && x.TransactionDate.Year == b.Year && x.Type == TransactionType.Expense).Sum(x => x.Amount);
                return spent <= b.Amount;
            }) / (decimal)budgets.Count;
        var avgMonthlySpend = monthlyExpenses.Any() ? monthlyExpenses.Average() : 0;
        var cashBufferMonths = avgMonthlySpend == 0 ? 1 : Math.Min(1, accounts.Sum(x => x.CurrentBalance) / avgMonthlySpend);

        var factors = new List<HealthScoreFactorVm>
        {
            BuildFactor("Savings rate", savingsRate * 100, 30, "Higher is better. This compares recent savings to recent income."),
            BuildFactor("Expense stability", expenseStability * 100, 20, "Stable spending produces more predictable cash flow."),
            BuildFactor("Budget adherence", adheredBudgets * 100, 25, "Measures how often spending stayed within configured budgets."),
            BuildFactor("Cash buffer", cashBufferMonths * 100, 25, "Compares available balances to recent monthly expenses."),
        };

        var score = Math.Clamp(factors.Sum(x => (x.Score * x.Weight) / 100), 0, 100);
        var suggestions = factors.OrderBy(x => x.Score).Take(2).Select(x => x.Name switch
        {
            "Savings rate" => "Increase the gap between income and expenses to improve monthly savings.",
            "Expense stability" => "Reduce avoidable spikes so spending is more predictable month to month.",
            "Budget adherence" => "Review the categories that overspend and adjust limits or habits.",
            _ => "Build a larger cash buffer to cover upcoming spending comfortably.",
        }).ToList();

        return new HealthScoreVm(
            score,
            score >= 80 ? "excellent" : score >= 65 ? "good" : score >= 45 ? "fair" : "poor",
            factors,
            suggestions,
            DateTimeOffset.UtcNow,
            score >= 65 ? "Your recent patterns support a stable score." : "The score is being pulled down by one or more weaker factors.");
    }

    public async Task<InsightsVm> GetInsightsAsync(Guid userId, CancellationToken cancellationToken)
    {
        var healthScore = await GetHealthScoreAsync(userId, cancellationToken);
        var accountIds = await _accountAccess.GetAccessibleAccountIdsAsync(userId, cancellationToken);
        var now = DateOnly.FromDateTime(DateTime.UtcNow);
        var currentMonth = new DateOnly(now.Year, now.Month, 1);
        var previousMonth = currentMonth.AddMonths(-1);
        var transactions = await _db.TransactionsSet.Where(x => accountIds.Contains(x.AccountId) && x.TransactionDate >= previousMonth).ToListAsync(cancellationToken);
        var categories = await _db.CategoriesSet.Where(x => x.UserId == userId).ToDictionaryAsync(x => x.Id, cancellationToken);

        var currentFood = transactions.Where(x => x.Type == TransactionType.Expense && x.TransactionDate.Month == currentMonth.Month && x.CategoryId.HasValue && categories.TryGetValue(x.CategoryId.Value, out var category) && category.Name.Contains("food", StringComparison.OrdinalIgnoreCase)).Sum(x => x.Amount);
        var previousFood = transactions.Where(x => x.Type == TransactionType.Expense && x.TransactionDate.Month == previousMonth.Month && x.CategoryId.HasValue && categories.TryGetValue(x.CategoryId.Value, out var category) && category.Name.Contains("food", StringComparison.OrdinalIgnoreCase)).Sum(x => x.Amount);
        var currentSavings = transactions.Where(x => x.Type == TransactionType.Income && x.TransactionDate.Month == currentMonth.Month).Sum(x => x.Amount) - transactions.Where(x => x.Type == TransactionType.Expense && x.TransactionDate.Month == currentMonth.Month).Sum(x => x.Amount);
        var previousSavings = transactions.Where(x => x.Type == TransactionType.Income && x.TransactionDate.Month == previousMonth.Month).Sum(x => x.Amount) - transactions.Where(x => x.Type == TransactionType.Expense && x.TransactionDate.Month == previousMonth.Month).Sum(x => x.Amount);

        var highlights = new List<InsightHighlightVm>
        {
            BuildHighlight("Food spend", currentFood, previousFood, "Monitor whether this category is drifting upward."),
            BuildHighlight("Savings", currentSavings, previousSavings, "A higher surplus improves both cash flow and health score."),
        };

        var trend = Enumerable.Range(0, 6)
            .Select(offset => currentMonth.AddMonths(-5 + offset))
            .Select(period =>
            {
                var monthly = transactions.Where(x => x.TransactionDate.Month == period.Month && x.TransactionDate.Year == period.Year).ToList();
                var monthlyIncome = monthly.Where(x => x.Type == TransactionType.Income).Sum(x => x.Amount);
                var monthlyExpense = monthly.Where(x => x.Type == TransactionType.Expense).Sum(x => x.Amount);
                return new
                {
                    period = period.ToString("MMM yyyy"),
                    savingsRate = monthlyIncome <= 0 ? 0 : Math.Round(((monthlyIncome - monthlyExpense) / monthlyIncome) * 100, 2),
                    income = monthlyIncome,
                    expense = monthlyExpense,
                };
            })
            .ToList();

        return new InsightsVm(
            healthScore,
            highlights,
            trend.Select(x => (object)new { period = x.period, value = x.savingsRate }).ToList(),
            trend.Select(x => (object)new { period = x.period, income = x.income, expense = x.expense }).ToList());
    }

    private static HealthScoreFactorVm BuildFactor(string name, decimal value, int weight, string explanation)
    {
        var score = (int)Math.Round(Math.Clamp(value, 0, 100));
        return new HealthScoreFactorVm(name, Math.Round(value, 2), score, weight, explanation);
    }

    private static decimal StandardDeviation(IEnumerable<decimal> values)
    {
        var list = values.ToList();
        if (!list.Any())
        {
            return 0;
        }

        var avg = list.Average();
        var variance = list.Sum(x => (x - avg) * (x - avg)) / list.Count;
        return (decimal)Math.Sqrt((double)variance);
    }

    private static InsightHighlightVm BuildHighlight(string title, decimal current, decimal previous, string fallback)
    {
        if (previous == 0)
        {
            return new InsightHighlightVm(title, fallback, "neutral");
        }

        var change = Math.Round(((current - previous) / previous) * 100, 2);
        var tone = change > 0 ? "amber" : "green";
        var direction = change > 0 ? "increased" : "decreased";
        return new InsightHighlightVm(title, $"{title} {direction} {Math.Abs(change)}% compared with last month.", tone, change);
    }
}

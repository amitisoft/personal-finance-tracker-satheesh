using Microsoft.EntityFrameworkCore;
using PersonalFinance.Api.Contracts;
using PersonalFinance.Domain.Entities;
using PersonalFinance.Domain.Enums;
using PersonalFinance.Infrastructure.Persistence;

namespace PersonalFinance.Api.Services;

public sealed class ForecastService
{
    private readonly AppDbContext _db;
    private readonly AccountAccessService _accountAccess;

    public ForecastService(AppDbContext db, AccountAccessService accountAccess)
    {
        _db = db;
        _accountAccess = accountAccess;
    }

    public async Task<(ForecastMonthVm Summary, ForecastDailyVm Daily)> BuildMonthlyForecastAsync(Guid userId, CancellationToken cancellationToken)
    {
        var accessibleAccountIds = await _accountAccess.GetAccessibleAccountIdsAsync(userId, cancellationToken);
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var monthStart = new DateOnly(today.Year, today.Month, 1);
        var monthEnd = monthStart.AddMonths(1).AddDays(-1);
        var historyStart = monthStart.AddMonths(-3);

        var accounts = await _db.AccountsSet.Where(x => accessibleAccountIds.Contains(x.Id)).ToListAsync(cancellationToken);
        var recurring = await _db.RecurringTransactionsSet
            .Where(x => accessibleAccountIds.Contains(x.AccountId) && x.NextRunDate <= monthEnd && x.Status == RecurringStatus.Active)
            .ToListAsync(cancellationToken);
        var history = await _db.TransactionsSet
            .Where(x => accessibleAccountIds.Contains(x.AccountId) && x.TransactionDate >= historyStart && x.TransactionDate <= today)
            .ToListAsync(cancellationToken);

        var currentBalance = accounts.Sum(x => x.CurrentBalance);
        var lowConfidence = history.Count < 8;
        var historicalDailyIncome = AverageDaily(history.Where(x => x.Type == TransactionType.Income), today);
        var historicalDailyExpense = AverageDaily(history.Where(x => x.Type == TransactionType.Expense), today);

        var dailyPoints = new List<ForecastDailyPointVm>();
        var projectedBalance = currentBalance;
        decimal expectedIncomeRemaining = 0;
        decimal expectedExpenseRemaining = 0;
        var riskMessages = new List<string>();
        var safetyBuffer = historicalDailyExpense * 5;

        for (var day = today; day <= monthEnd; day = day.AddDays(1))
        {
            var markers = new List<string>();
            var recurringForDay = recurring.Where(x => x.NextRunDate == day).ToList();
            foreach (var item in recurringForDay)
            {
                if (item.Type == TransactionType.Income)
                {
                    projectedBalance += item.Amount;
                    expectedIncomeRemaining += item.Amount;
                    markers.Add($"+{item.Title}");
                }
                else
                {
                    projectedBalance -= item.Amount;
                    expectedExpenseRemaining += item.Amount;
                    markers.Add($"-{item.Title}");
                }
            }

            if (day > today)
            {
                projectedBalance += historicalDailyIncome;
                projectedBalance -= historicalDailyExpense;
                expectedIncomeRemaining += historicalDailyIncome;
                expectedExpenseRemaining += historicalDailyExpense;
            }

            dailyPoints.Add(new ForecastDailyPointVm(day, Math.Round(projectedBalance, 2), markers));
        }

        var endBalance = dailyPoints.LastOrDefault()?.ProjectedBalance ?? currentBalance;
        var safeToSpend = Math.Max(0, endBalance - safetyBuffer);
        var riskLevel = "low";
        if (dailyPoints.Any(x => x.ProjectedBalance < 0))
        {
            riskLevel = "high";
            riskMessages.Add("Negative balance likely before month-end.");
        }
        else if (endBalance < safetyBuffer)
        {
            riskLevel = "medium";
            riskMessages.Add("Projected balance is close to the recommended safety buffer.");
        }

        if (lowConfidence)
        {
            riskMessages.Add("Forecast confidence is lower because there is limited transaction history.");
        }

        var summary = new ForecastMonthVm(
            currentBalance,
            endBalance,
            Math.Round(safeToSpend, 2),
            Math.Round(expectedIncomeRemaining, 2),
            Math.Round(expectedExpenseRemaining, 2),
            riskLevel,
            riskMessages,
            3,
            lowConfidence,
            "Built from current balances, recurring items, and recent daily income/expense patterns.");

        return (summary, new ForecastDailyVm(dailyPoints));
    }

    private static decimal AverageDaily(IEnumerable<Transaction> transactions, DateOnly today)
    {
        var items = transactions.ToList();
        if (!items.Any())
        {
            return 0;
        }

        var start = items.Min(x => x.TransactionDate);
        var days = Math.Max(1, today.DayNumber - start.DayNumber + 1);
        return Math.Round(items.Sum(x => x.Amount) / days, 2);
    }
}

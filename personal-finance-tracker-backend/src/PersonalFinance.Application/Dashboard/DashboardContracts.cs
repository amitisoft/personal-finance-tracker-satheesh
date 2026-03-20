namespace PersonalFinance.Application.Dashboard;

public sealed record MetricDto(decimal CurrentMonthIncome, decimal CurrentMonthExpense, decimal NetBalance, decimal GoalSavings);
public sealed record CategorySpendDto(Guid CategoryId, string Name, decimal Amount, string? Color);
public sealed record TrendPointDto(string Label, decimal Income, decimal Expense);
public sealed record BudgetProgressDto(Guid BudgetId, Guid CategoryId, string CategoryName, decimal Amount, decimal Spent, int AlertThresholdPercent, decimal PercentUsed);
public sealed record DashboardSummaryDto(
    MetricDto Metrics,
    IReadOnlyList<CategorySpendDto> SpendingByCategory,
    IReadOnlyList<TrendPointDto> IncomeVsExpenseTrend,
    IReadOnlyList<BudgetProgressDto> BudgetProgress,
    IReadOnlyList<object> RecentTransactions,
    IReadOnlyList<object> UpcomingRecurring,
    IReadOnlyList<object> Goals);

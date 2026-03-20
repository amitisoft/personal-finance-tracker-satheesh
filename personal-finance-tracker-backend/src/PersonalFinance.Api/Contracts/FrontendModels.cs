namespace PersonalFinance.Api.Contracts;

public sealed record UserVm(Guid Id, string DisplayName, string Email);
public sealed record SessionVm(UserVm User, string AccessToken, string RefreshToken);
public sealed record AccountVm(Guid? Id, string Name, string Type, decimal Balance);
public sealed record CategoryVm(Guid? Id, string Name, string Type, string Color, string Icon, bool Archived = false);
public sealed record TransactionVm(Guid? Id, Guid AccountId, Guid? DestinationAccountId, string Type, decimal Amount, DateOnly Date, Guid? CategoryId, string? Note, string? Merchant, string? PaymentMethod, Guid? RecurringTransactionId);
public sealed record BudgetVm(Guid? Id, Guid CategoryId, int Month, int Year, decimal Amount, decimal Spent, int AlertThresholdPercent);
public sealed record GoalVm(Guid? Id, string Name, decimal TargetAmount, decimal CurrentAmount, DateOnly? TargetDate, Guid? LinkedAccountId, string Icon, string Color, string Status);
public sealed record RecurringVm(Guid? Id, string Title, string Type, decimal Amount, Guid? CategoryId, Guid AccountId, string Frequency, DateOnly StartDate, DateOnly? EndDate, DateOnly NextRunDate, bool AutoCreateTransaction, bool Paused);
public sealed record GoalAmountRequest(decimal Amount);
public sealed record AccountTransferRequest(Guid SourceAccountId, Guid DestinationAccountId, decimal Amount, string? Note);
public sealed record NotificationStateVm(IReadOnlyList<string> SeenIds, IReadOnlyList<string> DismissedIds);
public sealed record NotificationIdsRequest(IReadOnlyList<string> NotificationIds);
public sealed record DashboardVm(
    decimal CurrentMonthIncome,
    decimal CurrentMonthExpense,
    decimal NetBalance,
    decimal TotalGoalSaved,
    IReadOnlyList<BudgetVm> Budgets,
    IReadOnlyList<object> CategorySpend,
    IReadOnlyList<object> IncomeExpenseTrend,
    IReadOnlyList<TransactionVm> RecentTransactions,
    IReadOnlyList<RecurringVm> UpcomingRecurring,
    IReadOnlyList<GoalVm> Goals);

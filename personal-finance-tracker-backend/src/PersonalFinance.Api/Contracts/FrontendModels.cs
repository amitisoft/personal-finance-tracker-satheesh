namespace PersonalFinance.Api.Contracts;

public sealed record UserVm(Guid Id, string DisplayName, string Email);
public sealed record SessionVm(UserVm User, string AccessToken, string RefreshToken);
public sealed record AccountVm(Guid? Id, string Name, string Type, decimal Balance, string AccessRole = "owner");
public sealed record CategoryVm(Guid? Id, string Name, string Type, string Color, string Icon, bool Archived = false);
public sealed record TransactionVm(Guid? Id, Guid AccountId, Guid? DestinationAccountId, string Type, decimal Amount, DateOnly Date, Guid? CategoryId, string? Note, string? Merchant, string? PaymentMethod, Guid? RecurringTransactionId, bool ReviewRequired = false, IReadOnlyList<string>? Tags = null);
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
public sealed record ForecastMonthVm(
    decimal CurrentBalance,
    decimal ForecastedEndOfMonthBalance,
    decimal SafeToSpend,
    decimal ExpectedIncomeRemaining,
    decimal ExpectedExpenseRemaining,
    string RiskLevel,
    IReadOnlyList<string> RiskMessages,
    int CalculationWindowMonths,
    bool LowConfidence,
    string Explanation);
public sealed record ForecastDailyPointVm(DateOnly Date, decimal ProjectedBalance, IReadOnlyList<string> Markers);
public sealed record ForecastDailyVm(IReadOnlyList<ForecastDailyPointVm> Points);
public sealed record HealthScoreFactorVm(string Name, decimal Value, int Score, int Weight, string Explanation);
public sealed record HealthScoreVm(int Score, string Grade, IReadOnlyList<HealthScoreFactorVm> Factors, IReadOnlyList<string> Suggestions, DateTimeOffset GeneratedAt, string ChangeSummary);
public sealed record InsightHighlightVm(string Title, string Message, string Tone, decimal? PercentChange = null);
public sealed record InsightsVm(HealthScoreVm HealthScore, IReadOnlyList<InsightHighlightVm> Highlights, IReadOnlyList<object> SavingsRateTrend, IReadOnlyList<object> IncomeVsExpenseTrend);
public sealed record RuleConditionVm(string Field, string Operator, string? Value, IReadOnlyList<string>? Values = null);
public sealed record RuleActionVm(string Type, string? Value);
public sealed record RuleVm(Guid? Id, string Name, RuleConditionVm Condition, RuleActionVm Action, int Priority, bool IsActive, string Summary);
public sealed record RuleTestRequest(RuleConditionVm Condition, RuleActionVm Action, TransactionVm Transaction);
public sealed record RuleTestResultVm(bool Matched, string Summary, TransactionVm Preview);
public sealed record RuleReapplyRequest(IReadOnlyList<Guid>? TransactionIds);
public sealed record AccountInviteRequest(string Email, string Role);
public sealed record AccountMemberVm(Guid? UserId, string DisplayName, string Email, string Role, string Status, bool IsOwner, DateTimeOffset? AddedAt = null);
public sealed record AccountMemberUpdateRequest(string Role);
public sealed record ActivityLogVm(Guid Id, Guid? AccountId, string ActionType, string EntityType, Guid? EntityId, string ActorName, DateTimeOffset CreatedAt, string? MetadataJson);
public sealed record AccountMembersResponseVm(IReadOnlyList<AccountMemberVm> Members, IReadOnlyList<ActivityLogVm> Activity);
public sealed record AccountInvitationVm(Guid Id, Guid AccountId, string AccountName, string Email, string Role, string Status, string InvitedByName, DateTimeOffset CreatedAt, DateTimeOffset ExpiresAt);
public sealed record TrendPointVm(string Period, decimal Income, decimal Expense, decimal SavingsRate, decimal NetWorth);
public sealed record ReportTrendResponseVm(
    IReadOnlyList<object> CategoryTrends,
    IReadOnlyList<object> SavingsRateTrend,
    IReadOnlyList<object> IncomeVsExpenseTrend,
    IReadOnlyList<object> NetWorthTrend,
    IReadOnlyList<InsightHighlightVm> Highlights);

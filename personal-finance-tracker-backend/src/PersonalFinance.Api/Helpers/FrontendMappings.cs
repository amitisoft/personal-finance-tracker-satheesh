using PersonalFinance.Api.Contracts;
using PersonalFinance.Domain.Entities;
using PersonalFinance.Domain.Enums;

namespace PersonalFinance.Api.Helpers;

internal static class FrontendMappings
{
    public static string ToFrontend(this AccountType value) => value switch
    {
        AccountType.BankAccount => "bank account",
        AccountType.CreditCard => "credit card",
        AccountType.CashWallet => "cash wallet",
        AccountType.SavingsAccount => "savings account",
        _ => "bank account",
    };

    public static AccountType ToAccountType(this string value) => value.Trim().ToLowerInvariant() switch
    {
        "bank account" => AccountType.BankAccount,
        "credit card" => AccountType.CreditCard,
        "cash wallet" => AccountType.CashWallet,
        "savings account" => AccountType.SavingsAccount,
        _ => AccountType.BankAccount,
    };

    public static string ToFrontend(this CategoryType value) => value == CategoryType.Income ? "income" : "expense";
    public static CategoryType ToCategoryType(this string value) => value.Trim().ToLowerInvariant() == "income" ? CategoryType.Income : CategoryType.Expense;
    public static string ToFrontend(this TransactionType value) => value.ToString().ToLowerInvariant();
    public static TransactionType ToTransactionType(this string value) => value.Trim().ToLowerInvariant() switch
    {
        "income" => TransactionType.Income,
        "expense" => TransactionType.Expense,
        "transfer" => TransactionType.Transfer,
        _ => throw new InvalidOperationException("Unsupported transaction type."),
    };

    public static string ToFrontend(this GoalStatus value) => value.ToString().ToLowerInvariant();
    public static GoalStatus ToGoalStatus(this string value) => value.Trim().ToLowerInvariant() switch
    {
        "completed" => GoalStatus.Completed,
        "paused" => GoalStatus.Paused,
        "cancelled" => GoalStatus.Cancelled,
        _ => GoalStatus.Active,
    };

    public static string ToFrontend(this RecurringFrequency value) => value.ToString().ToLowerInvariant();
    public static RecurringFrequency ToRecurringFrequency(this string value) => value.Trim().ToLowerInvariant() switch
    {
        "daily" => RecurringFrequency.Daily,
        "weekly" => RecurringFrequency.Weekly,
        "yearly" => RecurringFrequency.Yearly,
        _ => RecurringFrequency.Monthly,
    };

    public static AccountVm ToVm(this Account account) => new(account.Id, account.Name, account.Type.ToFrontend(), account.CurrentBalance);
    public static CategoryVm ToVm(this Category category) => new(category.Id, category.Name, category.Type.ToFrontend(), category.Color ?? "#2563eb", category.Icon ?? "Tag", category.IsArchived);
    public static TransactionVm ToVm(this Transaction transaction)
        => new(transaction.Id, transaction.AccountId, transaction.DestinationAccountId, transaction.Type.ToFrontend(), transaction.Amount, transaction.TransactionDate, transaction.CategoryId, transaction.Note, transaction.Merchant, transaction.PaymentMethod, transaction.RecurringTransactionId);
    public static BudgetVm ToVm(this Budget budget, decimal spent)
        => new(budget.Id, budget.CategoryId, budget.Month, budget.Year, budget.Amount, spent, budget.AlertThresholdPercent);
    public static GoalVm ToVm(this Goal goal)
        => new(goal.Id, goal.Name, goal.TargetAmount, goal.CurrentAmount, goal.TargetDate, goal.LinkedAccountId, goal.Icon ?? "PiggyBank", goal.Color ?? "#2563eb", goal.Status.ToFrontend());
    public static RecurringVm ToVm(this RecurringTransaction recurring)
        => new(recurring.Id, recurring.Title, recurring.Type.ToFrontend(), recurring.Amount, recurring.CategoryId, recurring.AccountId, recurring.Frequency.ToFrontend(), recurring.StartDate, recurring.EndDate, recurring.NextRunDate, recurring.AutoCreateTransaction, recurring.Status == RecurringStatus.Paused);
}

using PersonalFinance.Domain.Entities;

namespace PersonalFinance.Application.Abstractions;

public interface IAppDbContext
{
    IQueryable<User> Users { get; }
    IQueryable<Account> Accounts { get; }
    IQueryable<Category> Categories { get; }
    IQueryable<Transaction> Transactions { get; }
    IQueryable<Budget> Budgets { get; }
    IQueryable<Goal> Goals { get; }
    IQueryable<RecurringTransaction> RecurringTransactions { get; }
    IQueryable<RefreshToken> RefreshTokens { get; }
    IQueryable<PasswordResetToken> PasswordResetTokens { get; }
    IQueryable<UserNotificationState> UserNotificationStates { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

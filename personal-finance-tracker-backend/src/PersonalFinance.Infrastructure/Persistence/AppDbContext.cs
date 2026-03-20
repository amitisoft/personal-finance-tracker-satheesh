using Microsoft.EntityFrameworkCore;
using PersonalFinance.Application.Abstractions;
using PersonalFinance.Domain.Entities;

namespace PersonalFinance.Infrastructure.Persistence;

public sealed class AppDbContext : DbContext, IAppDbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> UsersSet => Set<User>();
    public DbSet<Account> AccountsSet => Set<Account>();
    public DbSet<Category> CategoriesSet => Set<Category>();
    public DbSet<Transaction> TransactionsSet => Set<Transaction>();
    public DbSet<Budget> BudgetsSet => Set<Budget>();
    public DbSet<Goal> GoalsSet => Set<Goal>();
    public DbSet<GoalContribution> GoalContributions => Set<GoalContribution>();
    public DbSet<RecurringTransaction> RecurringTransactionsSet => Set<RecurringTransaction>();
    public DbSet<RefreshToken> RefreshTokensSet => Set<RefreshToken>();
    public DbSet<PasswordResetToken> PasswordResetTokensSet => Set<PasswordResetToken>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<UserNotificationState> UserNotificationStatesSet => Set<UserNotificationState>();

    public IQueryable<User> Users => UsersSet.AsQueryable();
    public IQueryable<Account> Accounts => AccountsSet.AsQueryable();
    public IQueryable<Category> Categories => CategoriesSet.AsQueryable();
    public IQueryable<Transaction> Transactions => TransactionsSet.AsQueryable();
    public IQueryable<Budget> Budgets => BudgetsSet.AsQueryable();
    public IQueryable<Goal> Goals => GoalsSet.AsQueryable();
    public IQueryable<RecurringTransaction> RecurringTransactions => RecurringTransactionsSet.AsQueryable();
    public IQueryable<RefreshToken> RefreshTokens => RefreshTokensSet.AsQueryable();
    public IQueryable<PasswordResetToken> PasswordResetTokens => PasswordResetTokensSet.AsQueryable();
    public IQueryable<UserNotificationState> UserNotificationStates => UserNotificationStatesSet.AsQueryable();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}

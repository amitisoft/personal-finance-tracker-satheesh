using Microsoft.EntityFrameworkCore;
using PersonalFinance.Domain.Entities;
using PersonalFinance.Domain.Enums;
using PersonalFinance.Infrastructure.Persistence;

namespace PersonalFinance.Api.Helpers;

internal static class BalanceCalculator
{
    public static async Task RecalculateAsync(AppDbContext db, Guid userId, CancellationToken cancellationToken = default)
    {
        var accountIds = await db.AccountsSet.Where(x => x.UserId == userId).Select(x => x.Id).ToListAsync(cancellationToken);
        await RecalculateAccountsAsync(db, accountIds, cancellationToken);
    }

    public static async Task RecalculateAccountsAsync(AppDbContext db, IReadOnlyCollection<Guid> accountIds, CancellationToken cancellationToken = default)
    {
        if (accountIds.Count == 0)
        {
            return;
        }

        var accounts = await db.AccountsSet.Where(x => accountIds.Contains(x.Id)).ToListAsync(cancellationToken);
        var transactions = await db.TransactionsSet
            .Where(x => accountIds.Contains(x.AccountId) || (x.DestinationAccountId.HasValue && accountIds.Contains(x.DestinationAccountId.Value)))
            .OrderBy(x => x.TransactionDate)
            .ThenBy(x => x.CreatedAt)
            .ToListAsync(cancellationToken);

        var lookup = accounts.ToDictionary(x => x.Id);
        foreach (var account in accounts)
        {
            account.CurrentBalance = account.OpeningBalance;
            account.UpdatedAt = DateTimeOffset.UtcNow;
        }

        foreach (var transaction in transactions)
        {
            if (!lookup.TryGetValue(transaction.AccountId, out var source))
            {
                continue;
            }

            switch (transaction.Type)
            {
                case TransactionType.Income:
                    source.CurrentBalance += transaction.Amount;
                    break;
                case TransactionType.Expense:
                    source.CurrentBalance -= transaction.Amount;
                    break;
                case TransactionType.Transfer:
                    source.CurrentBalance -= transaction.Amount;
                    if (transaction.DestinationAccountId.HasValue && lookup.TryGetValue(transaction.DestinationAccountId.Value, out var destination))
                    {
                        destination.CurrentBalance += transaction.Amount;
                    }
                    break;
            }
        }

        await db.SaveChangesAsync(cancellationToken);
    }
}

using Microsoft.EntityFrameworkCore;
using PersonalFinance.Api.Exceptions;
using PersonalFinance.Infrastructure.Persistence;

namespace PersonalFinance.Api.Services;

public sealed class AccountAccessService
{
    private static readonly string[] WriteRoles = ["owner", "editor"];
    private readonly AppDbContext _db;

    public AccountAccessService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<Guid>> GetAccessibleAccountIdsAsync(Guid userId, CancellationToken cancellationToken)
    {
        var owned = await _db.AccountsSet.Where(x => x.UserId == userId).Select(x => x.Id).ToListAsync(cancellationToken);
        var shared = await _db.AccountMembersSet
            .Where(x => x.UserId == userId && x.InviteStatus == "accepted")
            .Select(x => x.AccountId)
            .ToListAsync(cancellationToken);

        return owned.Concat(shared).Distinct().ToList();
    }

    public Task<bool> CanViewAccountAsync(Guid userId, Guid accountId, CancellationToken cancellationToken)
        => CanAccessAsync(userId, accountId, false, cancellationToken);

    public Task<bool> CanWriteAccountAsync(Guid userId, Guid accountId, CancellationToken cancellationToken)
        => CanAccessAsync(userId, accountId, true, cancellationToken);

    public async Task EnsureCanWriteAccountAsync(Guid userId, Guid accountId, CancellationToken cancellationToken)
    {
        if (!await CanWriteAccountAsync(userId, accountId, cancellationToken))
        {
            throw new ForbiddenException("You do not have edit access to this account.");
        }
    }

    public async Task EnsureCanViewAccountAsync(Guid userId, Guid accountId, CancellationToken cancellationToken)
    {
        if (!await CanViewAccountAsync(userId, accountId, cancellationToken))
        {
            throw new ForbiddenException("You do not have access to this account.");
        }
    }

    public async Task EnsureCanManageMembersAsync(Guid userId, Guid accountId, CancellationToken cancellationToken)
    {
        var isOwner = await _db.AccountsSet.AnyAsync(x => x.Id == accountId && x.UserId == userId, cancellationToken);
        if (!isOwner)
        {
            throw new ForbiddenException("Only the owner can manage account members.");
        }
    }

    private async Task<bool> CanAccessAsync(Guid userId, Guid accountId, bool requireWrite, CancellationToken cancellationToken)
    {
        if (await _db.AccountsSet.AnyAsync(x => x.Id == accountId && x.UserId == userId, cancellationToken))
        {
            return true;
        }

        var query = _db.AccountMembersSet.Where(x => x.AccountId == accountId && x.UserId == userId && x.InviteStatus == "accepted");
        if (requireWrite)
        {
            query = query.Where(x => WriteRoles.Contains(x.Role));
        }

        return await query.AnyAsync(cancellationToken);
    }
}

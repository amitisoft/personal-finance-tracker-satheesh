using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PersonalFinance.Api.Contracts;
using PersonalFinance.Api.Helpers;
using PersonalFinance.Api.Services;
using PersonalFinance.Application.Abstractions;
using PersonalFinance.Domain.Entities;
using PersonalFinance.Domain.Enums;
using PersonalFinance.Infrastructure.Persistence;

namespace PersonalFinance.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/accounts")]
public sealed class AccountsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly AccountAccessService _accountAccess;
    private readonly ActivityLogService _activityLog;

    public AccountsController(AppDbContext db, ICurrentUserService currentUser, AccountAccessService accountAccess, ActivityLogService activityLog)
    {
        _db = db;
        _currentUser = currentUser;
        _accountAccess = accountAccess;
        _activityLog = activityLog;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<AccountVm>>> GetAll(CancellationToken cancellationToken)
    {
        var userId = _currentUser.GetRequiredUserId();
        var accessibleIds = await _accountAccess.GetAccessibleAccountIdsAsync(userId, cancellationToken);
        var items = await _db.AccountsSet.Where(x => accessibleIds.Contains(x.Id)).OrderBy(x => x.Name).ToListAsync(cancellationToken);
        var memberships = await _db.AccountMembersSet
            .Where(x => x.UserId == userId && x.InviteStatus == "accepted" && accessibleIds.Contains(x.AccountId))
            .ToDictionaryAsync(x => x.AccountId, x => x.Role, cancellationToken);

        return Ok(items.Select(x =>
        {
            var accessRole = x.UserId == userId ? "owner" : memberships.GetValueOrDefault(x.Id, "viewer");
            return x.ToVm(accessRole);
        }).ToList());
    }

    [HttpGet("invitations")]
    public async Task<ActionResult<IReadOnlyList<AccountInvitationVm>>> GetInvitations(CancellationToken cancellationToken)
    {
        var userId = _currentUser.GetRequiredUserId();
        var user = await _db.UsersSet.SingleAsync(x => x.Id == userId, cancellationToken);
        var normalizedEmail = user.Email.Trim().ToLowerInvariant();

        var invitationRows = await _db.AccountInvitationsSet
            .Where(x => x.Email == normalizedEmail && x.Status == "pending")
            .Join(_db.AccountsSet, invitation => invitation.AccountId, account => account.Id, (invitation, account) => new { Invitation = invitation, Account = account })
            .Join(_db.UsersSet, combined => combined.Invitation.InvitedByUserId, inviter => inviter.Id, (combined, inviter) => new { Combined = combined, Inviter = inviter })
            .OrderByDescending(x => x.Combined.Invitation.CreatedAt)
            .ToListAsync(cancellationToken);
        var invitations = invitationRows
            .Select(x => new AccountInvitationVm(
                x.Combined.Invitation.Id,
                x.Combined.Invitation.AccountId,
                x.Combined.Account.Name,
                x.Combined.Invitation.Email,
                x.Combined.Invitation.Role,
                x.Combined.Invitation.Status,
                x.Inviter.DisplayName ?? x.Inviter.Email,
                x.Combined.Invitation.CreatedAt,
                x.Combined.Invitation.ExpiresAt))
            .ToList();

        return Ok(invitations);
    }

    [HttpPost]
    public async Task<ActionResult<AccountVm>> Create([FromBody] AccountVm request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.GetRequiredUserId();
        var account = new Account
        {
            UserId = userId,
            Name = request.Name.Trim(),
            Type = request.Type.ToAccountType(),
            OpeningBalance = request.Balance,
            CurrentBalance = request.Balance,
        };
        _db.AccountsSet.Add(account);
        await _db.SaveChangesAsync(cancellationToken);
        _activityLog.Add(userId, "account_created", "account", account.Id, account.Id, new { account.Name });
        await _db.SaveChangesAsync(cancellationToken);
        return Ok(account.ToVm());
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<AccountVm>> Update(Guid id, [FromBody] AccountVm request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.GetRequiredUserId();
        await _accountAccess.EnsureCanWriteAccountAsync(userId, id, cancellationToken);
        var account = await _db.AccountsSet.SingleAsync(x => x.Id == id, cancellationToken);
        account.Name = request.Name.Trim();
        account.Type = request.Type.ToAccountType();
        var delta = request.Balance - account.CurrentBalance;
        account.OpeningBalance += delta;
        account.CurrentBalance = request.Balance;
        account.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);
        _activityLog.Add(userId, "account_updated", "account", account.Id, account.Id, new { account.Name });
        await _db.SaveChangesAsync(cancellationToken);
        return Ok(account.ToVm());
    }

    [HttpPost("transfer")]
    public async Task<IActionResult> Transfer([FromBody] AccountTransferRequest request, CancellationToken cancellationToken)
    {
        if (request.SourceAccountId == request.DestinationAccountId)
        {
            return BadRequest(new { message = "Source and destination accounts must be different." });
        }

        var userId = _currentUser.GetRequiredUserId();
        await _accountAccess.EnsureCanWriteAccountAsync(userId, request.SourceAccountId, cancellationToken);
        await _accountAccess.EnsureCanWriteAccountAsync(userId, request.DestinationAccountId, cancellationToken);
        using var tx = await _db.Database.BeginTransactionAsync(cancellationToken);
        _db.TransactionsSet.Add(new Transaction
        {
            UserId = userId,
            AccountId = request.SourceAccountId,
            DestinationAccountId = request.DestinationAccountId,
            Type = TransactionType.Transfer,
            Amount = request.Amount,
            TransactionDate = DateOnly.FromDateTime(DateTime.UtcNow),
            Note = request.Note,
            Merchant = "Account transfer",
            Tags = [],
        });
        await _db.SaveChangesAsync(cancellationToken);
        await BalanceCalculator.RecalculateAccountsAsync(_db, [request.SourceAccountId, request.DestinationAccountId], cancellationToken);
        if (await _db.AccountsSet.AnyAsync(x => x.Id == request.SourceAccountId && x.CurrentBalance < 0, cancellationToken))
        {
            await tx.RollbackAsync(cancellationToken);
            return BadRequest(new { message = "Insufficient balance for transfer." });
        }
        _activityLog.Add(userId, "account_transfer", "transaction", null, request.SourceAccountId, new { request.Amount, request.SourceAccountId, request.DestinationAccountId });
        await _db.SaveChangesAsync(cancellationToken);
        await tx.CommitAsync(cancellationToken);
        return Ok(new { success = true });
    }

    [HttpPost("{id:guid}/invite")]
    public async Task<ActionResult<AccountMemberVm>> Invite(Guid id, [FromBody] AccountInviteRequest request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.GetRequiredUserId();
        await _accountAccess.EnsureCanManageMembersAsync(userId, id, cancellationToken);

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(normalizedEmail))
        {
            return BadRequest(new { message = "Email is required." });
        }

        if (await _db.AccountsSet.AnyAsync(x => x.Id == id && x.User.Email.ToLower() == normalizedEmail, cancellationToken))
        {
            return BadRequest(new { message = "The owner already has access to this account." });
        }

        if (await _db.AccountInvitationsSet.AnyAsync(x => x.AccountId == id && x.Email == normalizedEmail && x.Status == "pending", cancellationToken))
        {
            return BadRequest(new { message = "A pending invitation already exists for this email." });
        }

        var invitedUser = await _db.UsersSet.SingleOrDefaultAsync(x => x.Email.ToLower() == normalizedEmail, cancellationToken);
        if (invitedUser is not null && await _db.AccountMembersSet.AnyAsync(x => x.AccountId == id && x.UserId == invitedUser.Id, cancellationToken))
        {
            return BadRequest(new { message = "This user is already a member of the account." });
        }

        var invitation = new AccountInvitation
        {
            AccountId = id,
            Email = normalizedEmail,
            Role = request.Role.Trim().ToLowerInvariant(),
            Token = Guid.NewGuid().ToString("N"),
            Status = "pending",
            InvitedByUserId = userId,
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(7),
        };

        _db.AccountInvitationsSet.Add(invitation);
        _activityLog.Add(userId, "member_invited", "account_invitation", invitation.Id, id, new { invitation.Email, invitation.Role });
        await _db.SaveChangesAsync(cancellationToken);
        return Ok(new AccountMemberVm(null, normalizedEmail, normalizedEmail, invitation.Role, invitation.Status, false, invitation.CreatedAt));
    }

    [HttpGet("{id:guid}/members")]
    public async Task<ActionResult<AccountMembersResponseVm>> GetMembers(Guid id, CancellationToken cancellationToken)
    {
        var userId = _currentUser.GetRequiredUserId();
        await _accountAccess.EnsureCanViewAccountAsync(userId, id, cancellationToken);

        var account = await _db.AccountsSet.Include(x => x.User).SingleAsync(x => x.Id == id, cancellationToken);
        var members = await _db.AccountMembersSet.Include(x => x.User).Where(x => x.AccountId == id).OrderBy(x => x.Role).ThenBy(x => x.User.DisplayName).ToListAsync(cancellationToken);
        var invitations = await _db.AccountInvitationsSet.Where(x => x.AccountId == id && x.Status == "pending").OrderByDescending(x => x.CreatedAt).ToListAsync(cancellationToken);
        var activityRows = await _db.AuditLogs
            .Where(x => x.AccountId == id)
            .Join(_db.UsersSet, x => x.UserId, y => y.Id, (log, actor) => new { Log = log, Actor = actor })
            .OrderByDescending(x => x.Log.CreatedAt)
            .Take(12)
            .ToListAsync(cancellationToken);
        var activity = activityRows
            .Select(x => new ActivityLogVm(
                x.Log.Id,
                x.Log.AccountId,
                x.Log.ActionType,
                x.Log.EntityType,
                x.Log.EntityId,
                x.Actor.DisplayName ?? x.Actor.Email,
                x.Log.CreatedAt,
                x.Log.MetadataJson))
            .ToList();

        var memberDtos = new List<AccountMemberVm>
        {
            new(account.UserId, account.User.DisplayName ?? account.User.Email, account.User.Email, "owner", "accepted", true, account.CreatedAt),
        };
        memberDtos.AddRange(members.Select(x => new AccountMemberVm(x.UserId, x.User.DisplayName ?? x.User.Email, x.User.Email, x.Role, x.InviteStatus, false, x.CreatedAt)));
        memberDtos.AddRange(invitations.Select(x => new AccountMemberVm(null, x.Email, x.Email, x.Role, x.Status, false, x.CreatedAt)));

        return Ok(new AccountMembersResponseVm(memberDtos, activity));
    }

    [HttpPut("{id:guid}/members/{userId:guid}")]
    public async Task<ActionResult<AccountMemberVm>> UpdateMember(Guid id, Guid userId, [FromBody] AccountMemberUpdateRequest request, CancellationToken cancellationToken)
    {
        var currentUserId = _currentUser.GetRequiredUserId();
        await _accountAccess.EnsureCanManageMembersAsync(currentUserId, id, cancellationToken);

        var member = await _db.AccountMembersSet.Include(x => x.User).SingleAsync(x => x.AccountId == id && x.UserId == userId, cancellationToken);
        member.Role = request.Role.Trim().ToLowerInvariant();
        member.UpdatedAt = DateTimeOffset.UtcNow;
        _activityLog.Add(currentUserId, "member_role_changed", "account_member", member.Id, id, new { member.UserId, member.Role });
        await _db.SaveChangesAsync(cancellationToken);

        return Ok(new AccountMemberVm(member.UserId, member.User.DisplayName ?? member.User.Email, member.User.Email, member.Role, member.InviteStatus, false, member.CreatedAt));
    }

    [HttpDelete("{id:guid}/members/{userId:guid}")]
    public async Task<IActionResult> RemoveMember(Guid id, Guid userId, CancellationToken cancellationToken)
    {
        var currentUserId = _currentUser.GetRequiredUserId();
        var isSelfRemoval = currentUserId == userId;
        if (!isSelfRemoval)
        {
            await _accountAccess.EnsureCanManageMembersAsync(currentUserId, id, cancellationToken);
        }

        var account = await _db.AccountsSet.SingleAsync(x => x.Id == id, cancellationToken);
        if (account.UserId == userId)
        {
            return BadRequest(new { message = "The owner cannot be removed from the account." });
        }

        var member = await _db.AccountMembersSet.SingleAsync(x => x.AccountId == id && x.UserId == userId, cancellationToken);
        _db.AccountMembersSet.Remove(member);
        _activityLog.Add(currentUserId, isSelfRemoval ? "member_left" : "member_removed", "account_member", member.Id, id, new { member.UserId });
        await _db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpPost("{id:guid}/accept-invite")]
    public async Task<IActionResult> AcceptInvite(Guid id, CancellationToken cancellationToken)
    {
        var userId = _currentUser.GetRequiredUserId();
        var user = await _db.UsersSet.SingleAsync(x => x.Id == userId, cancellationToken);
        var invitation = await _db.AccountInvitationsSet.SingleAsync(x => x.AccountId == id && x.Email == user.Email.ToLower() && x.Status == "pending", cancellationToken);

        _db.AccountMembersSet.Add(new AccountMember
        {
            AccountId = id,
            UserId = userId,
            Role = invitation.Role,
            InviteStatus = "accepted",
            InvitedByUserId = invitation.InvitedByUserId,
        });
        invitation.Status = "accepted";
        invitation.UpdatedAt = DateTimeOffset.UtcNow;
        _activityLog.Add(userId, "invite_accepted", "account_invitation", invitation.Id, id, new { invitation.Email, invitation.Role });
        await _db.SaveChangesAsync(cancellationToken);
        return Ok(new { success = true });
    }

    [HttpPost("{id:guid}/decline-invite")]
    public async Task<IActionResult> DeclineInvite(Guid id, CancellationToken cancellationToken)
    {
        var userId = _currentUser.GetRequiredUserId();
        var user = await _db.UsersSet.SingleAsync(x => x.Id == userId, cancellationToken);
        var invitation = await _db.AccountInvitationsSet.SingleAsync(x => x.AccountId == id && x.Email == user.Email.ToLower() && x.Status == "pending", cancellationToken);
        invitation.Status = "declined";
        invitation.UpdatedAt = DateTimeOffset.UtcNow;
        _activityLog.Add(userId, "invite_declined", "account_invitation", invitation.Id, id, new { invitation.Email, invitation.Role });
        await _db.SaveChangesAsync(cancellationToken);
        return Ok(new { success = true });
    }
}

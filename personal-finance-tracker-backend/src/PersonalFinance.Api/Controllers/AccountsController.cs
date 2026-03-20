using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PersonalFinance.Api.Contracts;
using PersonalFinance.Api.Helpers;
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

    public AccountsController(AppDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<AccountVm>>> GetAll(CancellationToken cancellationToken)
    {
        var userId = _currentUser.GetRequiredUserId();
        var items = await _db.AccountsSet.Where(x => x.UserId == userId).OrderBy(x => x.Name).ToListAsync(cancellationToken);
        return Ok(items.Select(x => x.ToVm()).ToList());
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
        return Ok(account.ToVm());
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<AccountVm>> Update(Guid id, [FromBody] AccountVm request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.GetRequiredUserId();
        var account = await _db.AccountsSet.SingleAsync(x => x.Id == id && x.UserId == userId, cancellationToken);
        account.Name = request.Name.Trim();
        account.Type = request.Type.ToAccountType();
        var delta = request.Balance - account.CurrentBalance;
        account.OpeningBalance += delta;
        account.CurrentBalance = request.Balance;
        account.UpdatedAt = DateTimeOffset.UtcNow;
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
        });
        await _db.SaveChangesAsync(cancellationToken);
        await BalanceCalculator.RecalculateAsync(_db, userId, cancellationToken);
        if (await _db.AccountsSet.AnyAsync(x => x.UserId == userId && x.CurrentBalance < 0, cancellationToken))
        {
            await tx.RollbackAsync(cancellationToken);
            return BadRequest(new { message = "Insufficient balance for transfer." });
        }
        await tx.CommitAsync(cancellationToken);
        return Ok(new { success = true });
    }
}

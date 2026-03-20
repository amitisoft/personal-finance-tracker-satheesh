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
[Route("api/transactions")]
public sealed class TransactionsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public TransactionsController(AppDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<TransactionVm>>> GetAll(
        [FromQuery] DateOnly? dateFrom,
        [FromQuery] DateOnly? dateTo,
        [FromQuery] Guid? categoryId,
        [FromQuery] Guid? accountId,
        [FromQuery] string? type,
        [FromQuery] string? search,
        CancellationToken cancellationToken)
    {
        var userId = _currentUser.GetRequiredUserId();
        var query = _db.TransactionsSet.Where(x => x.UserId == userId);

        if (dateFrom.HasValue) query = query.Where(x => x.TransactionDate >= dateFrom.Value);
        if (dateTo.HasValue) query = query.Where(x => x.TransactionDate <= dateTo.Value);
        if (categoryId.HasValue) query = query.Where(x => x.CategoryId == categoryId.Value);
        if (accountId.HasValue) query = query.Where(x => x.AccountId == accountId.Value || x.DestinationAccountId == accountId.Value);
        if (!string.IsNullOrWhiteSpace(type) && Enum.TryParse<TransactionType>(type, true, out var parsedType)) query = query.Where(x => x.Type == parsedType);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLowerInvariant();
            query = query.Where(x =>
                (x.Merchant != null && x.Merchant.ToLower().Contains(term)) ||
                (x.Note != null && x.Note.ToLower().Contains(term)) ||
                x.Type.ToString().ToLower().Contains(term));
        }

        var items = await query.OrderByDescending(x => x.TransactionDate).ThenByDescending(x => x.CreatedAt).ToListAsync(cancellationToken);
        return Ok(items.Select(x => x.ToVm()).ToList());
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<TransactionVm>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var userId = _currentUser.GetRequiredUserId();
        var transaction = await _db.TransactionsSet.SingleAsync(x => x.Id == id && x.UserId == userId, cancellationToken);
        return Ok(transaction.ToVm());
    }

    [HttpPost]
    public async Task<ActionResult<TransactionVm>> Create([FromBody] TransactionVm request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.GetRequiredUserId();
        var result = await UpsertInternalAsync(userId, null, request, cancellationToken);
        return Ok(result);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<TransactionVm>> Update(Guid id, [FromBody] TransactionVm request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.GetRequiredUserId();
        var result = await UpsertInternalAsync(userId, id, request, cancellationToken);
        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var userId = _currentUser.GetRequiredUserId();
        using var tx = await _db.Database.BeginTransactionAsync(cancellationToken);
        var transaction = await _db.TransactionsSet.SingleAsync(x => x.Id == id && x.UserId == userId, cancellationToken);
        _db.TransactionsSet.Remove(transaction);
        await _db.SaveChangesAsync(cancellationToken);
        await BalanceCalculator.RecalculateAsync(_db, userId, cancellationToken);
        await tx.CommitAsync(cancellationToken);
        return NoContent();
    }

    private async Task<TransactionVm> UpsertInternalAsync(Guid userId, Guid? id, TransactionVm request, CancellationToken cancellationToken)
    {
        if (request.Amount <= 0) throw new InvalidOperationException("Amount must be greater than zero.");
        if (request.Date > DateOnly.FromDateTime(DateTime.UtcNow)) throw new InvalidOperationException("Transaction date cannot be in the future.");

        var type = request.Type.ToTransactionType();
        if (type == TransactionType.Transfer && (!request.DestinationAccountId.HasValue || request.DestinationAccountId == request.AccountId))
        {
            throw new InvalidOperationException("Source and destination accounts must be different for transfers.");
        }

        if (request.CategoryId.HasValue)
        {
            var category = await _db.CategoriesSet.SingleAsync(x => x.Id == request.CategoryId.Value && x.UserId == userId, cancellationToken);
            if (category.IsArchived && id is null)
            {
                throw new InvalidOperationException("Archived categories cannot be used for new transactions.");
            }
        }

        using var tx = await _db.Database.BeginTransactionAsync(cancellationToken);
        Transaction entity;
        if (id.HasValue)
        {
            entity = await _db.TransactionsSet.SingleAsync(x => x.Id == id.Value && x.UserId == userId, cancellationToken);
            entity.AccountId = request.AccountId;
            entity.DestinationAccountId = request.DestinationAccountId;
            entity.Type = type;
            entity.Amount = request.Amount;
            entity.TransactionDate = request.Date;
            entity.CategoryId = request.CategoryId;
            entity.Note = request.Note;
            entity.Merchant = request.Merchant;
            entity.PaymentMethod = request.PaymentMethod;
            entity.RecurringTransactionId = request.RecurringTransactionId;
            entity.UpdatedAt = DateTimeOffset.UtcNow;
        }
        else
        {
            entity = new Transaction
            {
                UserId = userId,
                AccountId = request.AccountId,
                DestinationAccountId = request.DestinationAccountId,
                Type = type,
                Amount = request.Amount,
                TransactionDate = request.Date,
                CategoryId = request.CategoryId,
                Note = request.Note,
                Merchant = request.Merchant,
                PaymentMethod = request.PaymentMethod,
                RecurringTransactionId = request.RecurringTransactionId,
            };
            _db.TransactionsSet.Add(entity);
        }

        await _db.SaveChangesAsync(cancellationToken);
        await BalanceCalculator.RecalculateAsync(_db, userId, cancellationToken);

        if (await _db.AccountsSet.AnyAsync(x => x.UserId == userId && x.CurrentBalance < 0, cancellationToken))
        {
            await tx.RollbackAsync(cancellationToken);
            throw new InvalidOperationException("Insufficient balance for this transaction.");
        }

        await tx.CommitAsync(cancellationToken);
        entity = await _db.TransactionsSet.SingleAsync(x => x.Id == entity.Id, cancellationToken);
        return entity.ToVm();
    }
}

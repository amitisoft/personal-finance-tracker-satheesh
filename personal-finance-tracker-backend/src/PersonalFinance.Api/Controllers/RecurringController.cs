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
[Route("api/recurring")]
public sealed class RecurringController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public RecurringController(AppDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<RecurringVm>>> GetAll(CancellationToken cancellationToken)
    {
        var userId = _currentUser.GetRequiredUserId();
        var items = await _db.RecurringTransactionsSet.Where(x => x.UserId == userId).OrderBy(x => x.NextRunDate).ToListAsync(cancellationToken);
        return Ok(items.Select(x => x.ToVm()).ToList());
    }

    [HttpPost]
    public async Task<ActionResult<RecurringVm>> Create([FromBody] RecurringVm request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.GetRequiredUserId();
        var recurring = new RecurringTransaction
        {
            UserId = userId,
            Title = request.Title.Trim(),
            Type = request.Type.ToTransactionType(),
            Amount = request.Amount,
            CategoryId = request.CategoryId ?? Guid.Empty,
            AccountId = request.AccountId,
            Frequency = request.Frequency.ToRecurringFrequency(),
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            NextRunDate = request.NextRunDate,
            AutoCreateTransaction = request.AutoCreateTransaction,
            Status = request.Paused ? RecurringStatus.Paused : RecurringStatus.Active,
        };
        _db.RecurringTransactionsSet.Add(recurring);
        await _db.SaveChangesAsync(cancellationToken);
        return Ok(recurring.ToVm());
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<RecurringVm>> Update(Guid id, [FromBody] RecurringVm request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.GetRequiredUserId();
        var recurring = await _db.RecurringTransactionsSet.SingleAsync(x => x.Id == id && x.UserId == userId, cancellationToken);
        recurring.Title = request.Title.Trim();
        recurring.Type = request.Type.ToTransactionType();
        recurring.Amount = request.Amount;
        recurring.CategoryId = request.CategoryId ?? Guid.Empty;
        recurring.AccountId = request.AccountId;
        recurring.Frequency = request.Frequency.ToRecurringFrequency();
        recurring.StartDate = request.StartDate;
        recurring.EndDate = request.EndDate;
        recurring.NextRunDate = request.NextRunDate;
        recurring.AutoCreateTransaction = request.AutoCreateTransaction;
        recurring.Status = request.Paused ? RecurringStatus.Paused : RecurringStatus.Active;
        recurring.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);
        return Ok(recurring.ToVm());
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var userId = _currentUser.GetRequiredUserId();
        var recurring = await _db.RecurringTransactionsSet.SingleAsync(x => x.Id == id && x.UserId == userId, cancellationToken);
        _db.RecurringTransactionsSet.Remove(recurring);
        await _db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpPost("{id:guid}/pause")]
    public async Task<IActionResult> Pause(Guid id, CancellationToken cancellationToken)
    {
        var userId = _currentUser.GetRequiredUserId();
        var recurring = await _db.RecurringTransactionsSet.SingleAsync(x => x.Id == id && x.UserId == userId, cancellationToken);
        recurring.Status = RecurringStatus.Paused;
        recurring.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);
        return Ok(recurring.ToVm());
    }

    [HttpPost("{id:guid}/resume")]
    public async Task<IActionResult> Resume(Guid id, CancellationToken cancellationToken)
    {
        var userId = _currentUser.GetRequiredUserId();
        var recurring = await _db.RecurringTransactionsSet.SingleAsync(x => x.Id == id && x.UserId == userId, cancellationToken);
        recurring.Status = RecurringStatus.Active;
        recurring.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);
        return Ok(recurring.ToVm());
    }
}

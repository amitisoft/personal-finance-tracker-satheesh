using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PersonalFinance.Api.Contracts;
using PersonalFinance.Api.Helpers;
using PersonalFinance.Application.Abstractions;
using PersonalFinance.Domain.Entities;
using PersonalFinance.Infrastructure.Persistence;

namespace PersonalFinance.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/categories")]
public sealed class CategoriesController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public CategoriesController(AppDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<CategoryVm>>> GetAll(CancellationToken cancellationToken)
    {
        var userId = _currentUser.GetRequiredUserId();
        var items = await _db.CategoriesSet.Where(x => x.UserId == userId).OrderBy(x => x.Type).ThenBy(x => x.Name).ToListAsync(cancellationToken);
        return Ok(items.Select(x => x.ToVm()).ToList());
    }

    [HttpPost]
    public async Task<ActionResult<CategoryVm>> Create([FromBody] CategoryVm request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.GetRequiredUserId();
        var category = new Category
        {
            UserId = userId,
            Name = request.Name.Trim(),
            Type = request.Type.ToCategoryType(),
            Color = request.Color,
            Icon = request.Icon,
            IsArchived = request.Archived,
        };
        _db.CategoriesSet.Add(category);
        await _db.SaveChangesAsync(cancellationToken);
        return Ok(category.ToVm());
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<CategoryVm>> Update(Guid id, [FromBody] CategoryVm request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.GetRequiredUserId();
        var category = await _db.CategoriesSet.SingleAsync(x => x.Id == id && x.UserId == userId, cancellationToken);
        category.Name = request.Name.Trim();
        category.Type = request.Type.ToCategoryType();
        category.Color = request.Color;
        category.Icon = request.Icon;
        category.IsArchived = request.Archived;
        category.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);
        return Ok(category.ToVm());
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var userId = _currentUser.GetRequiredUserId();
        var inUse = await _db.TransactionsSet.AnyAsync(x => x.UserId == userId && x.CategoryId == id, cancellationToken)
            || await _db.BudgetsSet.AnyAsync(x => x.UserId == userId && x.CategoryId == id, cancellationToken)
            || await _db.RecurringTransactionsSet.AnyAsync(x => x.UserId == userId && x.CategoryId == id, cancellationToken);
        if (inUse)
        {
            return BadRequest(new { message = "Category is in use. Archive it instead of deleting." });
        }

        var category = await _db.CategoriesSet.SingleAsync(x => x.Id == id && x.UserId == userId, cancellationToken);
        _db.CategoriesSet.Remove(category);
        await _db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }
}

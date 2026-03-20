using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PersonalFinance.Api.Contracts;
using PersonalFinance.Application.Abstractions;
using PersonalFinance.Domain.Entities;
using PersonalFinance.Infrastructure.Persistence;

namespace PersonalFinance.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/notifications")]
public sealed class NotificationsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public NotificationsController(AppDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    [HttpGet("state")]
    public async Task<ActionResult<NotificationStateVm>> GetState(CancellationToken cancellationToken)
    {
        var state = await GetOrCreateStateAsync(cancellationToken);
        return Ok(ToVm(state));
    }

    [HttpPost("seen")]
    public async Task<ActionResult<NotificationStateVm>> MarkSeen([FromBody] NotificationIdsRequest request, CancellationToken cancellationToken)
    {
        var state = await GetOrCreateStateAsync(cancellationToken);
        var incomingIds = NormalizeIds(request.NotificationIds);

        if (incomingIds.Count > 0)
        {
            state.SeenNotificationIdsJson = SerializeIds(DeserializeIds(state.SeenNotificationIdsJson).Concat(incomingIds));
            state.UpdatedAt = DateTimeOffset.UtcNow;
            await _db.SaveChangesAsync(cancellationToken);
        }

        return Ok(ToVm(state));
    }

    [HttpPost("dismiss")]
    public async Task<ActionResult<NotificationStateVm>> Dismiss([FromBody] NotificationIdsRequest request, CancellationToken cancellationToken)
    {
        var state = await GetOrCreateStateAsync(cancellationToken);
        var incomingIds = NormalizeIds(request.NotificationIds);

        if (incomingIds.Count > 0)
        {
            state.SeenNotificationIdsJson = SerializeIds(DeserializeIds(state.SeenNotificationIdsJson).Concat(incomingIds));
            state.DismissedNotificationIdsJson = SerializeIds(DeserializeIds(state.DismissedNotificationIdsJson).Concat(incomingIds));
            state.UpdatedAt = DateTimeOffset.UtcNow;
            await _db.SaveChangesAsync(cancellationToken);
        }

        return Ok(ToVm(state));
    }

    private async Task<UserNotificationState> GetOrCreateStateAsync(CancellationToken cancellationToken)
    {
        var userId = _currentUser.GetRequiredUserId();
        var state = await _db.UserNotificationStatesSet.SingleOrDefaultAsync(x => x.UserId == userId, cancellationToken);

        if (state is not null)
        {
            return state;
        }

        state = new UserNotificationState { UserId = userId };
        _db.UserNotificationStatesSet.Add(state);
        await _db.SaveChangesAsync(cancellationToken);
        return state;
    }

    private static NotificationStateVm ToVm(UserNotificationState state)
        => new(DeserializeIds(state.SeenNotificationIdsJson), DeserializeIds(state.DismissedNotificationIdsJson));

    private static List<string> DeserializeIds(string? json)
    {
        try
        {
            return NormalizeIds(JsonSerializer.Deserialize<List<string>>(json ?? "[]"));
        }
        catch
        {
            return [];
        }
    }

    private static string SerializeIds(IEnumerable<string> ids) => JsonSerializer.Serialize(NormalizeIds(ids));

    private static List<string> NormalizeIds(IEnumerable<string>? ids)
        => ids?
            .Where(id => !string.IsNullOrWhiteSpace(id))
            .Select(id => id.Trim())
            .Distinct(StringComparer.Ordinal)
            .ToList()
            ?? [];
}

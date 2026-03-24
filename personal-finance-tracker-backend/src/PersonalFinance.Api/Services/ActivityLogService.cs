using System.Text.Json;
using PersonalFinance.Domain.Entities;
using PersonalFinance.Infrastructure.Persistence;

namespace PersonalFinance.Api.Services;

public sealed class ActivityLogService
{
    private readonly AppDbContext _db;

    public ActivityLogService(AppDbContext db)
    {
        _db = db;
    }

    public void Add(Guid actorUserId, string actionType, string entityType, Guid? entityId, Guid? accountId, object? metadata = null)
    {
        _db.AuditLogs.Add(new AuditLog
        {
            UserId = actorUserId,
            ActionType = actionType,
            EntityType = entityType,
            EntityId = entityId,
            AccountId = accountId,
            MetadataJson = metadata is null ? null : JsonSerializer.Serialize(metadata),
        });
    }
}

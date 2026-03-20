using PersonalFinance.Domain.Common;

namespace PersonalFinance.Domain.Entities;

public sealed class AuditLog : AuditableEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public string ActionType { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public Guid? EntityId { get; set; }
    public string? MetadataJson { get; set; }
}

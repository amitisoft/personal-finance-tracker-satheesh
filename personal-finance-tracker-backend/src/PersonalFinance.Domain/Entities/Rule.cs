using PersonalFinance.Domain.Common;

namespace PersonalFinance.Domain.Entities;

public sealed class Rule : AuditableEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public string Name { get; set; } = string.Empty;
    public string ConditionJson { get; set; } = "{}";
    public string ActionJson { get; set; } = "{}";
    public int Priority { get; set; }
    public bool IsActive { get; set; } = true;
}

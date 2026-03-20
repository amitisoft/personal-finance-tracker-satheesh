using PersonalFinance.Domain.Common;
using PersonalFinance.Domain.Enums;

namespace PersonalFinance.Domain.Entities;

public sealed class Category : AuditableEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public string Name { get; set; } = string.Empty;
    public CategoryType Type { get; set; }
    public string? Color { get; set; }
    public string? Icon { get; set; }
    public bool IsArchived { get; set; }
}

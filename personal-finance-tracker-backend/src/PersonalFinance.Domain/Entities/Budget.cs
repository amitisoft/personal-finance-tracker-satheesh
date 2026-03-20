using PersonalFinance.Domain.Common;

namespace PersonalFinance.Domain.Entities;

public sealed class Budget : AuditableEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public Guid CategoryId { get; set; }
    public Category Category { get; set; } = null!;
    public int Month { get; set; }
    public int Year { get; set; }
    public decimal Amount { get; set; }
    public int AlertThresholdPercent { get; set; } = 80;
}

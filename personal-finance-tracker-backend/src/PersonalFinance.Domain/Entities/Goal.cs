using PersonalFinance.Domain.Common;
using PersonalFinance.Domain.Enums;

namespace PersonalFinance.Domain.Entities;

public sealed class Goal : AuditableEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public string Name { get; set; } = string.Empty;
    public decimal TargetAmount { get; set; }
    public decimal CurrentAmount { get; set; }
    public DateOnly? TargetDate { get; set; }
    public Guid? LinkedAccountId { get; set; }
    public Account? LinkedAccount { get; set; }
    public string? Icon { get; set; }
    public string? Color { get; set; }
    public GoalStatus Status { get; set; } = GoalStatus.Active;
    public ICollection<GoalContribution> Contributions { get; set; } = new List<GoalContribution>();
}

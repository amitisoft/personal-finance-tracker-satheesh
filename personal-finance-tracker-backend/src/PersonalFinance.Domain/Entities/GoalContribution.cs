using PersonalFinance.Domain.Common;
using PersonalFinance.Domain.Enums;

namespace PersonalFinance.Domain.Entities;

public sealed class GoalContribution : AuditableEntity
{
    public Guid GoalId { get; set; }
    public Goal Goal { get; set; } = null!;
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public Guid? AccountId { get; set; }
    public Account? Account { get; set; }
    public decimal Amount { get; set; }
    public GoalContributionType Type { get; set; }
}

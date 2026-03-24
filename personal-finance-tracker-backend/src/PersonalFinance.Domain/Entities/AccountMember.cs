using PersonalFinance.Domain.Common;

namespace PersonalFinance.Domain.Entities;

public sealed class AccountMember : AuditableEntity
{
    public Guid AccountId { get; set; }
    public Account Account { get; set; } = null!;
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public string Role { get; set; } = "viewer";
    public string InviteStatus { get; set; } = "accepted";
    public Guid? InvitedByUserId { get; set; }
    public User? InvitedByUser { get; set; }
}

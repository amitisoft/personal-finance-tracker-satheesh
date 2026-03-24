using PersonalFinance.Domain.Common;

namespace PersonalFinance.Domain.Entities;

public sealed class AccountInvitation : AuditableEntity
{
    public Guid AccountId { get; set; }
    public Account Account { get; set; } = null!;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = "viewer";
    public string Token { get; set; } = string.Empty;
    public string Status { get; set; } = "pending";
    public Guid InvitedByUserId { get; set; }
    public User InvitedByUser { get; set; } = null!;
    public DateTimeOffset ExpiresAt { get; set; }
}

using PersonalFinance.Domain.Common;
using PersonalFinance.Domain.Enums;

namespace PersonalFinance.Domain.Entities;

public sealed class Account : AuditableEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public string Name { get; set; } = string.Empty;
    public AccountType Type { get; set; }
    public decimal OpeningBalance { get; set; }
    public decimal CurrentBalance { get; set; }
    public string? InstitutionName { get; set; }

    public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
    public ICollection<AccountMember> Members { get; set; } = new List<AccountMember>();
    public ICollection<AccountInvitation> Invitations { get; set; } = new List<AccountInvitation>();
}

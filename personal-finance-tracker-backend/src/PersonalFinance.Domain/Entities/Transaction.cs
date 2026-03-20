using PersonalFinance.Domain.Common;
using PersonalFinance.Domain.Enums;

namespace PersonalFinance.Domain.Entities;

public sealed class Transaction : AuditableEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public Guid AccountId { get; set; }
    public Account Account { get; set; } = null!;
    public Guid? DestinationAccountId { get; set; }
    public Account? DestinationAccount { get; set; }
    public Guid? CategoryId { get; set; }
    public Category? Category { get; set; }
    public Guid? RecurringTransactionId { get; set; }
    public RecurringTransaction? RecurringTransaction { get; set; }
    public Guid? TransferGroupId { get; set; }
    public TransactionType Type { get; set; }
    public decimal Amount { get; set; }
    public DateOnly TransactionDate { get; set; }
    public string? Merchant { get; set; }
    public string? Note { get; set; }
    public string? PaymentMethod { get; set; }
}

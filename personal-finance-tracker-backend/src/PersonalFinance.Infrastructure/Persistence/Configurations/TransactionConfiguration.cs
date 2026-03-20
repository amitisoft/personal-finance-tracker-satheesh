using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PersonalFinance.Domain.Entities;

namespace PersonalFinance.Infrastructure.Persistence.Configurations;

internal sealed class TransactionConfiguration : IEntityTypeConfiguration<Transaction>
{
    public void Configure(EntityTypeBuilder<Transaction> builder)
    {
        builder.ToTable("transactions");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.UserId).HasColumnName("user_id");
        builder.Property(x => x.AccountId).HasColumnName("account_id");
        builder.Property(x => x.DestinationAccountId).HasColumnName("destination_account_id");
        builder.Property(x => x.CategoryId).HasColumnName("category_id");
        builder.Property(x => x.RecurringTransactionId).HasColumnName("recurring_transaction_id");
        builder.Property(x => x.TransferGroupId).HasColumnName("transfer_group_id");
        builder.Property(x => x.Type).HasColumnName("type").HasConversion<string>().IsRequired();
        builder.Property(x => x.Amount).HasColumnName("amount").HasPrecision(12, 2);
        builder.Property(x => x.TransactionDate).HasColumnName("transaction_date");
        builder.Property(x => x.Merchant).HasColumnName("merchant").HasMaxLength(200);
        builder.Property(x => x.Note).HasColumnName("note");
        builder.Property(x => x.PaymentMethod).HasColumnName("payment_method").HasMaxLength(50);
        builder.Property(x => x.CreatedAt).HasColumnName("created_at");
        builder.Property(x => x.UpdatedAt).HasColumnName("updated_at");
        builder.HasIndex(x => new { x.UserId, x.TransactionDate });
        builder.HasIndex(x => new { x.UserId, x.AccountId });
        builder.HasIndex(x => new { x.UserId, x.CategoryId });
        builder.HasIndex(x => x.TransferGroupId);
        builder.HasOne(x => x.Account).WithMany(x => x.Transactions).HasForeignKey(x => x.AccountId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.DestinationAccount).WithMany().HasForeignKey(x => x.DestinationAccountId).OnDelete(DeleteBehavior.Restrict);
    }
}

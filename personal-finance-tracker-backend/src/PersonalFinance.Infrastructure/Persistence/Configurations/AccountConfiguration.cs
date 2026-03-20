using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PersonalFinance.Domain.Entities;
using PersonalFinance.Domain.Enums;

namespace PersonalFinance.Infrastructure.Persistence.Configurations;

internal sealed class AccountConfiguration : IEntityTypeConfiguration<Account>
{
    public void Configure(EntityTypeBuilder<Account> builder)
    {
        builder.ToTable("accounts");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.UserId).HasColumnName("user_id");
        builder.Property(x => x.Name).HasColumnName("name").HasMaxLength(100).IsRequired();
        builder.Property(x => x.Type).HasColumnName("type").HasConversion<string>().IsRequired();
        builder.Property(x => x.OpeningBalance).HasColumnName("opening_balance").HasPrecision(12, 2);
        builder.Property(x => x.CurrentBalance).HasColumnName("current_balance").HasPrecision(12, 2);
        builder.Property(x => x.InstitutionName).HasColumnName("institution_name").HasMaxLength(120);
        builder.Property(x => x.CreatedAt).HasColumnName("created_at");
        builder.Property(x => x.UpdatedAt).HasColumnName("updated_at");
        builder.HasOne(x => x.User).WithMany(x => x.Accounts).HasForeignKey(x => x.UserId);
        builder.HasIndex(x => x.UserId);
    }
}

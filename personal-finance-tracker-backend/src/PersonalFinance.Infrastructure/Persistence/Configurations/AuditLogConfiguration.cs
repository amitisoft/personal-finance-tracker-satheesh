using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PersonalFinance.Domain.Entities;

namespace PersonalFinance.Infrastructure.Persistence.Configurations;

internal sealed class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> builder)
    {
        builder.ToTable("audit_logs");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.UserId).HasColumnName("user_id");
        builder.Property(x => x.AccountId).HasColumnName("account_id");
        builder.Property(x => x.ActionType).HasColumnName("action_type").HasMaxLength(80).IsRequired();
        builder.Property(x => x.EntityType).HasColumnName("entity_type").HasMaxLength(80).IsRequired();
        builder.Property(x => x.EntityId).HasColumnName("entity_id");
        builder.Property(x => x.MetadataJson).HasColumnName("metadata_json");
        builder.Property(x => x.CreatedAt).HasColumnName("created_at");
        builder.Property(x => x.UpdatedAt).HasColumnName("updated_at");
        builder.HasIndex(x => new { x.AccountId, x.CreatedAt });
        builder.HasOne(x => x.Account).WithMany().HasForeignKey(x => x.AccountId).OnDelete(DeleteBehavior.SetNull);
        builder.HasOne(x => x.User).WithMany(x => x.AuditLogs).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
    }
}

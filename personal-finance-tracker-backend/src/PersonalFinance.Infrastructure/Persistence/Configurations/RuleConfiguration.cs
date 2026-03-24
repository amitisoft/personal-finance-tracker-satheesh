using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PersonalFinance.Domain.Entities;

namespace PersonalFinance.Infrastructure.Persistence.Configurations;

internal sealed class RuleConfiguration : IEntityTypeConfiguration<Rule>
{
    public void Configure(EntityTypeBuilder<Rule> builder)
    {
        builder.ToTable("rules");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.UserId).HasColumnName("user_id");
        builder.Property(x => x.Name).HasColumnName("name").HasMaxLength(120).IsRequired();
        builder.Property(x => x.ConditionJson).HasColumnName("condition_json").HasColumnType("jsonb").IsRequired();
        builder.Property(x => x.ActionJson).HasColumnName("action_json").HasColumnType("jsonb").IsRequired();
        builder.Property(x => x.Priority).HasColumnName("priority");
        builder.Property(x => x.IsActive).HasColumnName("is_active");
        builder.Property(x => x.CreatedAt).HasColumnName("created_at");
        builder.Property(x => x.UpdatedAt).HasColumnName("updated_at");
        builder.HasIndex(x => new { x.UserId, x.IsActive, x.Priority });
        builder.HasOne(x => x.User).WithMany(x => x.Rules).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
    }
}

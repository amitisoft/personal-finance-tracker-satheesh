using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PersonalFinance.Domain.Entities;

namespace PersonalFinance.Infrastructure.Persistence.Configurations;

internal sealed class AccountMemberConfiguration : IEntityTypeConfiguration<AccountMember>
{
    public void Configure(EntityTypeBuilder<AccountMember> builder)
    {
        builder.ToTable("account_members");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.AccountId).HasColumnName("account_id");
        builder.Property(x => x.UserId).HasColumnName("user_id");
        builder.Property(x => x.Role).HasColumnName("role").HasMaxLength(20).IsRequired();
        builder.Property(x => x.InviteStatus).HasColumnName("invite_status").HasMaxLength(20).IsRequired();
        builder.Property(x => x.InvitedByUserId).HasColumnName("invited_by_user_id");
        builder.Property(x => x.CreatedAt).HasColumnName("created_at");
        builder.Property(x => x.UpdatedAt).HasColumnName("updated_at");
        builder.HasIndex(x => new { x.AccountId, x.UserId }).IsUnique();
        builder.HasIndex(x => new { x.UserId, x.InviteStatus });
        builder.HasOne(x => x.Account).WithMany(x => x.Members).HasForeignKey(x => x.AccountId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.User).WithMany(x => x.AccountMemberships).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.InvitedByUser).WithMany().HasForeignKey(x => x.InvitedByUserId).OnDelete(DeleteBehavior.Restrict);
    }
}

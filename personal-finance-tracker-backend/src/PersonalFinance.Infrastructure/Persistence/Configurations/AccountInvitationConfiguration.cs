using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PersonalFinance.Domain.Entities;

namespace PersonalFinance.Infrastructure.Persistence.Configurations;

internal sealed class AccountInvitationConfiguration : IEntityTypeConfiguration<AccountInvitation>
{
    public void Configure(EntityTypeBuilder<AccountInvitation> builder)
    {
        builder.ToTable("account_invitations");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.AccountId).HasColumnName("account_id");
        builder.Property(x => x.Email).HasColumnName("email").HasMaxLength(255).IsRequired();
        builder.Property(x => x.Role).HasColumnName("role").HasMaxLength(20).IsRequired();
        builder.Property(x => x.Token).HasColumnName("token").HasMaxLength(255).IsRequired();
        builder.Property(x => x.Status).HasColumnName("status").HasMaxLength(20).IsRequired();
        builder.Property(x => x.InvitedByUserId).HasColumnName("invited_by_user_id");
        builder.Property(x => x.ExpiresAt).HasColumnName("expires_at");
        builder.Property(x => x.CreatedAt).HasColumnName("created_at");
        builder.Property(x => x.UpdatedAt).HasColumnName("updated_at");
        builder.HasIndex(x => x.Token).IsUnique();
        builder.HasIndex(x => new { x.AccountId, x.Email, x.Status });
        builder.HasOne(x => x.Account).WithMany(x => x.Invitations).HasForeignKey(x => x.AccountId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.InvitedByUser).WithMany(x => x.SentAccountInvitations).HasForeignKey(x => x.InvitedByUserId).OnDelete(DeleteBehavior.Restrict);
    }
}

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PersonalFinance.Domain.Entities;

namespace PersonalFinance.Infrastructure.Persistence.Configurations;

internal sealed class UserNotificationStateConfiguration : IEntityTypeConfiguration<UserNotificationState>
{
    public void Configure(EntityTypeBuilder<UserNotificationState> builder)
    {
        builder.ToTable("user_notification_states");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.UserId).HasColumnName("user_id");
        builder.Property(x => x.SeenNotificationIdsJson).HasColumnName("seen_notification_ids").HasColumnType("text").IsRequired();
        builder.Property(x => x.DismissedNotificationIdsJson).HasColumnName("dismissed_notification_ids").HasColumnType("text").IsRequired();
        builder.Property(x => x.CreatedAt).HasColumnName("created_at");
        builder.Property(x => x.UpdatedAt).HasColumnName("updated_at");
        builder.HasIndex(x => x.UserId).IsUnique();
        builder.HasOne(x => x.User)
            .WithMany(x => x.NotificationStates)
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

using PersonalFinance.Domain.Common;

namespace PersonalFinance.Domain.Entities;

public sealed class UserNotificationState : AuditableEntity
{
    public Guid UserId { get; set; }
    public string SeenNotificationIdsJson { get; set; } = "[]";
    public string DismissedNotificationIdsJson { get; set; } = "[]";

    public User? User { get; set; }
}

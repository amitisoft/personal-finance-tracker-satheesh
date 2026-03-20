namespace PersonalFinance.Application.Abstractions;

public interface ICurrentUserService
{
    Guid GetRequiredUserId();
    string? GetEmail();
}

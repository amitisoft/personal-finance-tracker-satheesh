using PersonalFinance.Application.Auth;
using PersonalFinance.Domain.Entities;

namespace PersonalFinance.Application.Abstractions;

public interface ITokenService
{
    string CreateAccessToken(User user);
    string CreateRefreshToken();
    string HashRefreshToken(string refreshToken);
    DateTimeOffset GetRefreshExpiryUtc();
    AuthSessionDto CreateSession(User user, string refreshToken);
}

using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using PersonalFinance.Application.Abstractions;
using PersonalFinance.Application.Auth;
using PersonalFinance.Domain.Entities;

namespace PersonalFinance.Infrastructure.Services;

public sealed class JwtTokenService : ITokenService
{
    private readonly IConfiguration _configuration;
    private readonly byte[] _key;

    public JwtTokenService(IConfiguration configuration)
    {
        _configuration = configuration;
        _key = Encoding.UTF8.GetBytes(configuration["Jwt:Secret"] ?? "development-only-secret-change-me-1234567890");
    }

    public string CreateAccessToken(User user)
    {
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Name, user.DisplayName ?? user.Email),
        };

        var credentials = new SigningCredentials(new SymmetricSecurityKey(_key), SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"] ?? "pft-api",
            audience: _configuration["Jwt:Audience"] ?? "pft-frontend",
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(int.TryParse(_configuration["Jwt:AccessTokenMinutes"], out var minutes) ? minutes : 60),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string CreateRefreshToken() => Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));

    public string HashRefreshToken(string refreshToken)
    {
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(refreshToken));
        return Convert.ToHexString(hash);
    }

    public DateTimeOffset GetRefreshExpiryUtc() => DateTimeOffset.UtcNow.AddDays(int.TryParse(_configuration["Jwt:RefreshTokenDays"], out var days) ? days : 14);

    public AuthSessionDto CreateSession(User user, string refreshToken)
        => new(new UserDto(user.Id, user.DisplayName ?? user.Email, user.Email), CreateAccessToken(user), refreshToken);
}

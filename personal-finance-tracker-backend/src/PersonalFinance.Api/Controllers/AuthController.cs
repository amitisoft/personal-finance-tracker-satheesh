using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PersonalFinance.Application.Abstractions;
using PersonalFinance.Application.Auth;
using PersonalFinance.Domain.Entities;
using PersonalFinance.Api.Contracts;
using PersonalFinance.Infrastructure.Persistence;

namespace PersonalFinance.Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ITokenService _tokenService;
    private readonly ICurrentUserService _currentUser;
    private readonly IConfiguration _configuration;

    public AuthController(
        AppDbContext db,
        IPasswordHasher passwordHasher,
        ITokenService tokenService,
        ICurrentUserService currentUser,
        IConfiguration configuration)
    {
        _db = db;
        _passwordHasher = passwordHasher;
        _tokenService = tokenService;
        _currentUser = currentUser;
        _configuration = configuration;
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthSessionDto>> Register([FromBody] RegisterRequest request, CancellationToken cancellationToken)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        if (await _db.UsersSet.AnyAsync(x => x.Email == email, cancellationToken))
        {
            return Conflict(new { message = "This email is already registered. Please log in instead." });
        }

        var user = new User
        {
            Email = email,
            DisplayName = string.IsNullOrWhiteSpace(request.DisplayName) ? email.Split('@')[0] : request.DisplayName.Trim(),
            PasswordHash = _passwordHasher.Hash(request.Password),
        };

        _db.UsersSet.Add(user);
        _db.CategoriesSet.AddRange(
            new Category { User = user, Name = "Salary", Type = Domain.Enums.CategoryType.Income, Color = "#16a34a", Icon = "BadgeIndianRupee" },
            new Category { User = user, Name = "Food", Type = Domain.Enums.CategoryType.Expense, Color = "#f59e0b", Icon = "UtensilsCrossed" },
            new Category { User = user, Name = "Transport", Type = Domain.Enums.CategoryType.Expense, Color = "#3b82f6", Icon = "CarFront" },
            new Category { User = user, Name = "Rent", Type = Domain.Enums.CategoryType.Expense, Color = "#ef4444", Icon = "House" });
        await _db.SaveChangesAsync(cancellationToken);

        return Ok(await CreateSessionAsync(user, cancellationToken));
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthSessionDto>> Login([FromBody] LoginRequest request, CancellationToken cancellationToken)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await _db.UsersSet.SingleOrDefaultAsync(x => x.Email == email, cancellationToken);
        if (user is null)
        {
            return Unauthorized(new { message = "This email is not registered. Please sign up first." });
        }

        if (!_passwordHasher.Verify(request.Password, user.PasswordHash))
        {
            return Unauthorized(new { message = "Password is incorrect for this email." });
        }

        return Ok(await CreateSessionAsync(user, cancellationToken));
    }

    [HttpPost("refresh")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthSessionDto>> Refresh([FromBody] RefreshRequest request, CancellationToken cancellationToken)
    {
        var hash = _tokenService.HashRefreshToken(request.RefreshToken);
        var token = await _db.RefreshTokensSet.Include(x => x.User)
            .SingleOrDefaultAsync(x => x.TokenHash == hash && x.RevokedAt == null && x.ExpiresAt > DateTimeOffset.UtcNow, cancellationToken);

        if (token is null)
        {
            return Unauthorized(new { message = "Refresh token is invalid or expired." });
        }

        token.RevokedAt = DateTimeOffset.UtcNow;
        token.UpdatedAt = DateTimeOffset.UtcNow;
        return Ok(await CreateSessionAsync(token.User, cancellationToken));
    }

    [HttpPost("forgot-password")]
    [AllowAnonymous]
    public async Task<ActionResult<ForgotPasswordResponse>> ForgotPassword([FromBody] ForgotPasswordRequest request, CancellationToken cancellationToken)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await _db.UsersSet.SingleOrDefaultAsync(x => x.Email == email, cancellationToken);
        string? resetUrl = null;

        if (user is not null)
        {
            var token = _tokenService.CreateRefreshToken();
            _db.PasswordResetTokensSet.Add(new PasswordResetToken
            {
                UserId = user.Id,
                TokenHash = _tokenService.HashRefreshToken(token),
                ExpiresAt = DateTimeOffset.UtcNow.AddHours(2),
            });
            await _db.SaveChangesAsync(cancellationToken);

            var frontendBaseUrl = ResolveFrontendBaseUrl();
            resetUrl = $"{frontendBaseUrl}/reset-password?token={Uri.EscapeDataString(token)}&email={Uri.EscapeDataString(email)}";
        }

        return Ok(new ForgotPasswordResponse(true, resetUrl));
    }

    [HttpPost("reset-password")]
    [AllowAnonymous]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request, CancellationToken cancellationToken)
    {
        if (!string.IsNullOrWhiteSpace(request.Token))
        {
            var hash = _tokenService.HashRefreshToken(request.Token);
            var token = await _db.PasswordResetTokensSet.Include(x => x.User)
                .SingleOrDefaultAsync(x => x.TokenHash == hash && x.UsedAt == null && x.ExpiresAt > DateTimeOffset.UtcNow, cancellationToken);

            if (token is null)
            {
                return BadRequest(new { message = "Reset token is invalid or expired." });
            }

            token.User.PasswordHash = _passwordHasher.Hash(request.Password);
            token.User.UpdatedAt = DateTimeOffset.UtcNow;
            token.UsedAt = DateTimeOffset.UtcNow;
            token.UpdatedAt = DateTimeOffset.UtcNow;

            var activeRefreshTokens = await _db.RefreshTokensSet
                .Where(x => x.UserId == token.UserId && x.RevokedAt == null && x.ExpiresAt > DateTimeOffset.UtcNow)
                .ToListAsync(cancellationToken);

            foreach (var refreshToken in activeRefreshTokens)
            {
                refreshToken.RevokedAt = DateTimeOffset.UtcNow;
                refreshToken.UpdatedAt = DateTimeOffset.UtcNow;
            }

            await _db.SaveChangesAsync(cancellationToken);
            return Ok(new { success = true });
        }

        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.CurrentPassword))
        {
            return BadRequest(new { message = "Email and current password are required." });
        }

        var email = request.Email.Trim().ToLowerInvariant();
        var user = await _db.UsersSet.SingleOrDefaultAsync(x => x.Email == email, cancellationToken);
        if (user is null)
        {
            return BadRequest(new { message = "This email is not registered." });
        }

        if (!_passwordHasher.Verify(request.CurrentPassword, user.PasswordHash))
        {
            return BadRequest(new { message = "Current password is incorrect." });
        }

        user.PasswordHash = _passwordHasher.Hash(request.Password);
        user.UpdatedAt = DateTimeOffset.UtcNow;

        var directResetTokens = await _db.RefreshTokensSet
            .Where(x => x.UserId == user.Id && x.RevokedAt == null && x.ExpiresAt > DateTimeOffset.UtcNow)
            .ToListAsync(cancellationToken);

        foreach (var refreshToken in directResetTokens)
        {
            refreshToken.RevokedAt = DateTimeOffset.UtcNow;
            refreshToken.UpdatedAt = DateTimeOffset.UtcNow;
        }

        await _db.SaveChangesAsync(cancellationToken);
        return Ok(new { success = true });
    }

    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.GetRequiredUserId();
        var user = await _db.UsersSet.SingleAsync(x => x.Id == userId, cancellationToken);
        if (!_passwordHasher.Verify(request.CurrentPassword, user.PasswordHash))
        {
            return BadRequest(new { message = "Current password is incorrect." });
        }

        user.PasswordHash = _passwordHasher.Hash(request.Password);
        user.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);
        return Ok(new { success = true });
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserVm>> Me(CancellationToken cancellationToken)
    {
        var userId = _currentUser.GetRequiredUserId();
        var user = await _db.UsersSet.SingleAsync(x => x.Id == userId, cancellationToken);
        return Ok(new UserVm(user.Id, user.DisplayName ?? user.Email, user.Email));
    }

    private async Task<AuthSessionDto> CreateSessionAsync(User user, CancellationToken cancellationToken)
    {
        var refreshToken = _tokenService.CreateRefreshToken();
        _db.RefreshTokensSet.Add(new RefreshToken
        {
            UserId = user.Id,
            TokenHash = _tokenService.HashRefreshToken(refreshToken),
            ExpiresAt = _tokenService.GetRefreshExpiryUtc(),
        });
        await _db.SaveChangesAsync(cancellationToken);
        return _tokenService.CreateSession(user, refreshToken);
    }

    private string ResolveFrontendBaseUrl()
    {
        var configured = _configuration["Frontend:BaseUrl"];
        if (!string.IsNullOrWhiteSpace(configured))
        {
            return configured.TrimEnd('/');
        }

        var origin = Request.Headers.Origin.ToString();
        if (Uri.TryCreate(origin, UriKind.Absolute, out var originUri))
        {
            return originUri.GetLeftPart(UriPartial.Authority);
        }

        var referer = Request.Headers.Referer.ToString();
        if (Uri.TryCreate(referer, UriKind.Absolute, out var refererUri))
        {
            return refererUri.GetLeftPart(UriPartial.Authority);
        }

        var allowedOrigins = _configuration.GetSection("Cors:AllowedOrigins").Get<string[]>();
        var localOrigin = allowedOrigins?.FirstOrDefault(x => x.Contains("localhost:8088", StringComparison.OrdinalIgnoreCase));
        if (!string.IsNullOrWhiteSpace(localOrigin))
        {
            return localOrigin.TrimEnd('/');
        }

        return "http://localhost:8088";
    }
}

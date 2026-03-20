namespace PersonalFinance.Application.Auth;

public sealed record UserDto(Guid Id, string DisplayName, string Email);
public sealed record AuthSessionDto(UserDto User, string AccessToken, string RefreshToken);
public sealed record RegisterRequest(string DisplayName, string Email, string Password);
public sealed record LoginRequest(string Email, string Password);
public sealed record RefreshRequest(string RefreshToken);
public sealed record ForgotPasswordRequest(string Email);
public sealed record ForgotPasswordResponse(bool Success, string? ResetUrl);
public sealed record ResetPasswordRequest(string? Token, string? Email, string? CurrentPassword, string Password);
public sealed record ChangePasswordRequest(string CurrentPassword, string Password);

namespace ATMLocator.Application.DTOs;

public record RequestOtpDto(string PhoneNumber);

public record VerifyOtpDto(string PhoneNumber, string OtpCode, string? Name = null);

public record OtpResponseDto(string Message, int ExpiresInSeconds);

public record BootstrapAdminDto(string Secret, string PhoneNumber, string? Name = null);

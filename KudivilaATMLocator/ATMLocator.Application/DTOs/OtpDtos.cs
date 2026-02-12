namespace ATMLocator.Application.DTOs;

public record RequestOtpDto(string PhoneNumber);

public record VerifyOtpDto(string PhoneNumber, string OtpCode);

public record OtpResponseDto(string Message, int ExpiresInSeconds);

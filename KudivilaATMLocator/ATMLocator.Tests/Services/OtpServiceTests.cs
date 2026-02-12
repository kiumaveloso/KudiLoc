using Xunit;
using FluentAssertions;
using ATMLocator.Application.Services;

namespace ATMLocator.Tests;

public class OtpServiceTests
{
    private readonly OtpService _service = new();

    [Fact]
    public void GenerateOtp_Returns6DigitCode()
    {
        var code = _service.GenerateOtp("+244923000001");

        code.Should().HaveLength(6);
        code.Should().MatchRegex(@"^\d{6}$");
    }

    [Fact]
    public void VerifyOtp_WithCorrectCode_ReturnsTrue()
    {
        var phone = "+244923000002";
        var code = _service.GenerateOtp(phone);

        var result = _service.VerifyOtp(phone, code);

        result.Should().BeTrue();
    }

    [Fact]
    public void VerifyOtp_WithWrongCode_ReturnsFalse()
    {
        var phone = "+244923000003";
        _service.GenerateOtp(phone);

        var result = _service.VerifyOtp(phone, "000000");

        result.Should().BeFalse();
    }

    [Fact]
    public void VerifyOtp_WithUnknownPhone_ReturnsFalse()
    {
        var result = _service.VerifyOtp("+244999999999", "123456");

        result.Should().BeFalse();
    }

    [Fact]
    public void VerifyOtp_IsOneTimeUse()
    {
        var phone = "+244923000004";
        var code = _service.GenerateOtp(phone);

        _service.VerifyOtp(phone, code).Should().BeTrue();
        _service.VerifyOtp(phone, code).Should().BeFalse();
    }

    [Fact]
    public void GenerateOtp_OverwritesPreviousCode()
    {
        var phone = "+244923000005";
        var firstCode = _service.GenerateOtp(phone);
        var secondCode = _service.GenerateOtp(phone);

        // First code should no longer work
        _service.VerifyOtp(phone, firstCode).Should().BeFalse();
    }

    [Fact]
    public void GenerateOtp_DifferentPhones_IndependentCodes()
    {
        var code1 = _service.GenerateOtp("+244923000006");
        var code2 = _service.GenerateOtp("+244923000007");

        _service.VerifyOtp("+244923000006", code1).Should().BeTrue();
        _service.VerifyOtp("+244923000007", code2).Should().BeTrue();
    }
}

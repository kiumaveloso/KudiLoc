using ATMLocator.Application.Services;
using ATMLocator.Core.Entities;
using ATMLocator.Core.Interfaces;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace ATMLocator.Tests.Services;

public class OtpServiceTests
{
    private readonly Mock<IOtpRepository> _repoMock = new();
    private readonly OtpService _sut;

    public OtpServiceTests()
    {
        _sut = new OtpService(_repoMock.Object, Options.Create(new DemoSettings()));
    }

    [Fact]
    public async Task GenerateOtpAsync_ReturnsSixDigitCode()
    {
        _repoMock.Setup(r => r.SaveAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<DateTime>()))
            .Returns(Task.CompletedTask);
        var code = await _sut.GenerateOtpAsync("+244911111111");
        Assert.Matches(@"^\d{6}$", code);
    }

    [Fact]
    public async Task VerifyOtpAsync_WithCorrectCode_ReturnsTrue()
    {
        var entry = new OtpEntry
        {
            PhoneNumber = "+244912345678",
            Code = "123456",
            ExpiresAt = DateTime.UtcNow.AddMinutes(5)
        };
        _repoMock.Setup(r => r.GetAsync("+244912345678"))
            .ReturnsAsync(entry);
        _repoMock.Setup(r => r.DeleteAsync(It.IsAny<string>())).Returns(Task.CompletedTask);

        var result = await _sut.VerifyOtpAsync("+244912345678", "123456");
        Assert.True(result);
    }

    [Fact]
    public async Task VerifyOtpAsync_WithWrongCode_ReturnsFalse()
    {
        var entry = new OtpEntry
        {
            PhoneNumber = "+244912345678",
            Code = "123456",
            ExpiresAt = DateTime.UtcNow.AddMinutes(5)
        };
        _repoMock.Setup(r => r.GetAsync("+244912345678"))
            .ReturnsAsync(entry);
        _repoMock.Setup(r => r.DeleteAsync(It.IsAny<string>())).Returns(Task.CompletedTask);

        var result = await _sut.VerifyOtpAsync("+244912345678", "000000");
        Assert.False(result);
    }

    [Fact]
    public async Task VerifyOtpAsync_WithExpiredCode_ReturnsFalse()
    {
        var entry = new OtpEntry
        {
            PhoneNumber = "+244912345678",
            Code = "123456",
            ExpiresAt = DateTime.UtcNow.AddMinutes(-1) // expired
        };
        _repoMock.Setup(r => r.GetAsync("+244912345678"))
            .ReturnsAsync(entry);

        var result = await _sut.VerifyOtpAsync("+244912345678", "123456");
        Assert.False(result);
    }
}

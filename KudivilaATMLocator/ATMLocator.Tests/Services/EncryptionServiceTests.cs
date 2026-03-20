using ATMLocator.Infrastructure.Services;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace ATMLocator.Tests.Services;

public class EncryptionServiceTests
{
    private readonly EncryptionService _sut;

    public EncryptionServiceTests()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Encryption:Key"] = Convert.ToBase64String(new byte[32]),
                ["Encryption:HmacKey"] = Convert.ToBase64String(new byte[32]),
            })
            .Build();
        _sut = new EncryptionService(config);
    }

    [Fact]
    public void EncryptDecrypt_RoundTrip_ReturnsOriginal()
    {
        const string phone = "+244912345678";
        var encrypted = _sut.Encrypt(phone);
        var decrypted = _sut.Decrypt(encrypted);
        Assert.Equal(phone, decrypted);
    }

    [Fact]
    public void Encrypt_SameInput_ProducesDifferentCiphertext()
    {
        const string phone = "+244912345678";
        var a = _sut.Encrypt(phone);
        var b = _sut.Encrypt(phone);
        Assert.NotEqual(a, b); // different IVs
    }

    [Fact]
    public void Hash_SameInput_ProducesSameHash()
    {
        const string phone = "+244912345678";
        Assert.Equal(_sut.Hash(phone), _sut.Hash(phone));
    }

    [Fact]
    public void Hash_DifferentInputs_ProduceDifferentHashes()
    {
        Assert.NotEqual(_sut.Hash("+244912345678"), _sut.Hash("+244987654321"));
    }
}

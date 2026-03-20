using ATMLocator.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Asp.Versioning;

namespace ATMLocator.API.Controllers;

[ApiVersion("1.0")]
[ApiController]
[Route("api/v{version:apiVersion}/[controller]")]
[Route("api/[controller]")]
[Authorize(Roles = "admin")]
public class MigrationController : ControllerBase
{
    private readonly IUserRepository _userRepo;
    private readonly IEncryptionService _encryption;
    private readonly ILogger<MigrationController> _logger;

    public MigrationController(
        IUserRepository userRepo,
        IEncryptionService encryption,
        ILogger<MigrationController> logger)
    {
        _userRepo = userRepo;
        _encryption = encryption;
        _logger = logger;
    }

    /// <summary>
    /// One-time migration: encrypts plain-text phone numbers for legacy user records.
    /// Only processes users whose PhoneNumberHash is null or empty.
    /// </summary>
    [HttpPost("encrypt-phone-numbers")]
    public async Task<IActionResult> EncryptPhoneNumbers()
    {
        var unmigrated = await _userRepo.GetUnmigratedAsync();
        int migrated = 0;
        int skipped = 0;

        foreach (var user in unmigrated)
        {
            // Only migrate if the user has a plain-text phone number and no hash yet
            if (!string.IsNullOrEmpty(user.PhoneNumber) && string.IsNullOrEmpty(user.PhoneNumberHash))
            {
                try
                {
                    var plainPhone = user.PhoneNumber;
                    user.PhoneNumberEncrypted = _encryption.Encrypt(plainPhone);
                    user.PhoneNumberHash = _encryption.Hash(plainPhone);
                    user.PhoneNumber = string.Empty; // clear plain text

                    await _userRepo.UpdateAsync(user);
                    migrated++;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to migrate user {UserId}", user.Id);
                    skipped++;
                }
            }
            else
            {
                skipped++;
            }
        }

        _logger.LogInformation("Phone number migration complete: migrated={Migrated}, skipped={Skipped}", migrated, skipped);
        return Ok(new { migrated, skipped });
    }
}

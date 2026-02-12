using ATMLocator.Application.DTOs;
using FluentValidation;

namespace ATMLocator.Application.Validators;

public class UploadPhotoDtoValidator : AbstractValidator<UploadPhotoDto>
{
    private const int MaxBase64Length = 7 * 1024 * 1024; // ~5MB binary ≈ 6.7MB Base64

    public UploadPhotoDtoValidator()
    {
        RuleFor(x => x.Base64Photo)
            .NotEmpty().WithMessage("Foto é obrigatória")
            .MaximumLength(MaxBase64Length).WithMessage("Foto excede o tamanho máximo permitido")
            .Must(BeValidBase64).WithMessage("Foto deve estar em formato Base64 válido");
    }

    private static bool BeValidBase64(string? base64)
    {
        if (string.IsNullOrEmpty(base64)) return false;
        try
        {
            Convert.FromBase64String(base64);
            return true;
        }
        catch
        {
            return false;
        }
    }
}

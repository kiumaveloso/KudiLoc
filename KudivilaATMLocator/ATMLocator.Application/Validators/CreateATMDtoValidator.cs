using ATMLocator.Application.DTOs;
using FluentValidation;

namespace ATMLocator.Application.Validators;

public class CreateATMDtoValidator : AbstractValidator<CreateATMDto>
{
    public CreateATMDtoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Nome do ATM é obrigatório")
            .MaximumLength(200).WithMessage("Nome não pode ter mais de 200 caracteres");

        RuleFor(x => x.BankName)
            .NotEmpty().WithMessage("Nome do banco é obrigatório")
            .MaximumLength(100).WithMessage("Nome do banco não pode ter mais de 100 caracteres");

        RuleFor(x => x.Latitude)
            .InclusiveBetween(-18.0, -4.4).WithMessage("Latitude deve estar dentro dos limites de Angola (-18.0 a -4.4)");

        RuleFor(x => x.Longitude)
            .InclusiveBetween(11.7, 24.1).WithMessage("Longitude deve estar dentro dos limites de Angola (11.7 a 24.1)");

        // Province, Municipality, Street, Neighborhood are now optional for kudi-cash-find
        RuleFor(x => x.Province)
            .Must(BeValidAngolanProvinceOrNull).WithMessage("Província inválida")
            .When(x => !string.IsNullOrEmpty(x.Province));

        RuleFor(x => x.Municipality)
            .MaximumLength(100)
            .When(x => !string.IsNullOrEmpty(x.Municipality));

        RuleFor(x => x.Street)
            .MaximumLength(200)
            .When(x => !string.IsNullOrEmpty(x.Street));

        RuleFor(x => x.Neighborhood)
            .MaximumLength(100)
            .When(x => !string.IsNullOrEmpty(x.Neighborhood));

        RuleFor(x => x.LocationName)
            .MaximumLength(300).WithMessage("Nome da localização não pode ter mais de 300 caracteres")
            .When(x => !string.IsNullOrEmpty(x.LocationName));
    }

    private bool BeValidAngolanProvinceOrNull(string? province)
    {
        if (string.IsNullOrEmpty(province)) return true;

        var validProvinces = new[]
        {
            "Bengo", "Benguela", "Bié", "Cabinda", "Cuando Cubango",
            "Cuanza Norte", "Cuanza Sul", "Cunene", "Huambo", "Huíla",
            "Luanda", "Lunda Norte", "Lunda Sul", "Malanje", "Moxico",
            "Namibe", "Uíge", "Zaire"
        };

        return validProvinces.Contains(province, StringComparer.OrdinalIgnoreCase);
    }
}

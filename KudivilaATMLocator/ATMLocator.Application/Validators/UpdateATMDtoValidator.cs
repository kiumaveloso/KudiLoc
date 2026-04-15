using ATMLocator.Application.DTOs;
using FluentValidation;

namespace ATMLocator.Application.Validators;

public class UpdateATMDtoValidator : AbstractValidator<UpdateATMDto>
{
    public UpdateATMDtoValidator()
    {
        RuleFor(x => x.Name)
            .MaximumLength(200).WithMessage("Nome nao pode ter mais de 200 caracteres")
            .When(x => x.Name != null);

        RuleFor(x => x.BankName)
            .MaximumLength(100).WithMessage("Nome do banco nao pode ter mais de 100 caracteres")
            .When(x => x.BankName != null);

        RuleFor(x => x.Latitude)
            .InclusiveBetween(-18.0, -4.4)
            .WithMessage("Latitude deve estar dentro dos limites de Angola (-18.0 a -4.4)")
            .When(x => x.Latitude.HasValue);

        RuleFor(x => x.Longitude)
            .InclusiveBetween(11.7, 24.1)
            .WithMessage("Longitude deve estar dentro dos limites de Angola (11.7 a 24.1)")
            .When(x => x.Longitude.HasValue);

        RuleFor(x => x.LocationName)
            .MaximumLength(300).WithMessage("Nome da localizacao nao pode ter mais de 300 caracteres")
            .When(x => x.LocationName != null);

        RuleFor(x => x.Province)
            .Must(BeValidAngolanProvinceOrNull).WithMessage("Provincia invalida")
            .When(x => x.Province != null);

        RuleFor(x => x.Municipality)
            .MaximumLength(100)
            .When(x => x.Municipality != null);

        RuleFor(x => x.Street)
            .MaximumLength(200)
            .When(x => x.Street != null);

        RuleFor(x => x.Neighborhood)
            .MaximumLength(100)
            .When(x => x.Neighborhood != null);

        RuleFor(x => x.Landmark)
            .MaximumLength(200)
            .When(x => x.Landmark != null);

        RuleFor(x => x.Status)
            .Must(s => s == null || s == "has_money" || s == "no_money" || s == "uncertain")
            .WithMessage("Status deve ser 'has_money', 'no_money' ou 'uncertain'")
            .When(x => x.Status != null);

        RuleFor(x => x.IsOnline)
            .Must(s => s == null || s == "online" || s == "offline" || s == "maintenance")
            .WithMessage("IsOnline deve ser 'online', 'offline' ou 'maintenance'")
            .When(x => x.IsOnline != null);
    }

    private static bool BeValidAngolanProvinceOrNull(string? province)
    {
        if (string.IsNullOrEmpty(province)) return true;

        var validProvinces = new[]
        {
            "Bengo", "Benguela", "Bie", "Cabinda", "Cuando Cubango",
            "Cuanza Norte", "Cuanza Sul", "Cunene", "Huambo", "Huila",
            "Luanda", "Lunda Norte", "Lunda Sul", "Malanje", "Moxico",
            "Namibe", "Uige", "Zaire"
        };

        return validProvinces.Contains(province, StringComparer.OrdinalIgnoreCase);
    }
}

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

        RuleFor(x => x.Province)
            .NotEmpty().WithMessage("Província é obrigatória")
            .Must(BeValidAngolanProvince).WithMessage("Província inválida");

        RuleFor(x => x.Municipality)
            .NotEmpty().WithMessage("Município é obrigatório")
            .MaximumLength(100);

        RuleFor(x => x.Street)
            .NotEmpty().WithMessage("Rua é obrigatória")
            .MaximumLength(200);

        RuleFor(x => x.Neighborhood)
            .NotEmpty().WithMessage("Bairro é obrigatório")
            .MaximumLength(100);

        RuleFor(x => x.SupportedServices)
            .NotEmpty().WithMessage("Deve ter pelo menos um serviço suportado");
    }

    private bool BeValidAngolanProvince(string province)
    {
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
using ATMLocator.Application.DTOs;
using FluentValidation;

namespace ATMLocator.Application.Validators;

public class UserLocationDtoValidator : AbstractValidator<UserLocationDto>
{
    public UserLocationDtoValidator()
    {
        RuleFor(x => x.Latitude)
            .InclusiveBetween(-18.0, -4.4).WithMessage("Latitude deve estar dentro dos limites de Angola (-18.0 a -4.4)");

        RuleFor(x => x.Longitude)
            .InclusiveBetween(11.7, 24.1).WithMessage("Longitude deve estar dentro dos limites de Angola (11.7 a 24.1)");

        RuleFor(x => x.RadiusKm)
            .InclusiveBetween(0.1, 50.0).WithMessage("Raio deve estar entre 0.1 e 50 km")
            .When(x => x.RadiusKm.HasValue);

        RuleFor(x => x.MinReliabilityScore)
            .InclusiveBetween(0, 100).WithMessage("Score de confiança deve estar entre 0 e 100")
            .When(x => x.MinReliabilityScore.HasValue);
    }
}

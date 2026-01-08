using ATMLocator.Application.DTOs;
using FluentValidation;

namespace ATMLocator.Application.Validators;

public class CreateUserDtoValidator : AbstractValidator<CreateUserDto>
{
    public CreateUserDtoValidator()
    {
        RuleFor(x => x.PhoneNumber)
            .NotEmpty().WithMessage("Número de telefone é obrigatório")
            .Matches(@"^\+244[0-9]{9}$").WithMessage("Número de telefone deve estar no formato +244XXXXXXXXX");

        RuleFor(x => x.Name)
            .MaximumLength(100).WithMessage("Nome não pode ter mais de 100 caracteres");
    }
}
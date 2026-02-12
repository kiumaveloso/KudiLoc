using ATMLocator.Application.DTOs;
using FluentValidation;

namespace ATMLocator.Application.Validators;

public class UpdateUserDtoValidator : AbstractValidator<UpdateUserDto>
{
    public UpdateUserDtoValidator()
    {
        RuleFor(x => x.Name)
            .MaximumLength(100).WithMessage("Nome não pode ter mais de 100 caracteres")
            .When(x => x.Name != null);
    }
}

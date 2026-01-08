using ATMLocator.Application.DTOs;
using FluentValidation;

namespace ATMLocator.Application.Validators;

public class CreateStatusReportDtoValidator : AbstractValidator<CreateStatusReportDto>
{
    public CreateStatusReportDtoValidator()
    {
        RuleFor(x => x.ATMId)
            .NotEmpty().WithMessage("ID do ATM é obrigatório");

        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("ID do utilizador é obrigatório");

        RuleFor(x => x.Notes)
            .MaximumLength(500).WithMessage("Notas não podem ter mais de 500 caracteres");
    }
}
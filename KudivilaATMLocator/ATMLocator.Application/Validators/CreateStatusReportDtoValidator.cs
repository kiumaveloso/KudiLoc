using ATMLocator.Application.DTOs;
using FluentValidation;

namespace ATMLocator.Application.Validators;

public class CreateStatusReportDtoValidator : AbstractValidator<CreateStatusReportDto>
{
    public CreateStatusReportDtoValidator()
    {
        RuleFor(x => x.ATMId)
            .NotEmpty().WithMessage("ID do ATM é obrigatório");

        // UserId is now optional — kudi-cash-find sends anonymous reports
        RuleFor(x => x.UserId)
            .MaximumLength(100)
            .When(x => !string.IsNullOrEmpty(x.UserId));

        RuleFor(x => x.Notes)
            .MaximumLength(500).WithMessage("Notas não podem ter mais de 500 caracteres");

        RuleFor(x => x.StatusReported)
            .Must(s => s == null || s == "has_money" || s == "no_money")
            .WithMessage("status_reported deve ser 'has_money' ou 'no_money'");

        RuleFor(x => x.CreatedBy)
            .MaximumLength(200)
            .When(x => !string.IsNullOrEmpty(x.CreatedBy));
    }
}

using ATMLocator.Application.DTOs;
using FluentValidation;

namespace ATMLocator.Application.Validators;

public class RequestOtpDtoValidator : AbstractValidator<RequestOtpDto>
{
    public RequestOtpDtoValidator()
    {
        RuleFor(x => x.PhoneNumber)
            .NotEmpty().WithMessage("Número de telefone é obrigatório")
            .Matches(@"^\+244[0-9]{9}$").WithMessage("Número de telefone deve estar no formato +244XXXXXXXXX");
    }
}

public class VerifyOtpDtoValidator : AbstractValidator<VerifyOtpDto>
{
    public VerifyOtpDtoValidator()
    {
        RuleFor(x => x.PhoneNumber)
            .NotEmpty().WithMessage("Número de telefone é obrigatório")
            .Matches(@"^\+244[0-9]{9}$").WithMessage("Número de telefone deve estar no formato +244XXXXXXXXX");

        RuleFor(x => x.OtpCode)
            .NotEmpty().WithMessage("Código OTP é obrigatório")
            .Length(6).WithMessage("Código OTP deve ter 6 dígitos")
            .Matches(@"^\d{6}$").WithMessage("Código OTP deve conter apenas dígitos");
    }
}

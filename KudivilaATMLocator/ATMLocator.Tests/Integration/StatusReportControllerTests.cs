using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using ATMLocator.Application.DTOs;
using ATMLocator.Core.Entities;
using FluentAssertions;
using Moq;
using Xunit;

namespace ATMLocator.Tests.Integration;

public class StatusReportControllerTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly CustomWebApplicationFactory _factory;

    public StatusReportControllerTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    private async Task<string> GetAuthToken()
    {
        _factory.MockUserRepository
            .Setup(r => r.GetByPhoneNumberAsync("+244923111111"))
            .ReturnsAsync(new User
            {
                Id = "auth-user",
                PhoneNumber = "+244923111111",
                Name = "Auth User",
                ReputationScore = 80,
                CreatedAt = DateTime.UtcNow
            });

        var response = await _client.PostAsSnakeCaseJsonAsync("/api/Auth/login", new LoginDto("+244923111111"));
        var auth = await response.Content.ReadFromJsonAsync<AuthResponseDto>(TestHelpers.SnakeCaseJson);
        return auth!.Token;
    }

    [Fact]
    public async Task SubmitReport_WithoutAuth_WhenATMNotFound_ReturnsBadRequest_Anonymous()
    {
        // POST /api/statusreport is now AllowAnonymous for kudi-cash-find compatibility
        _factory.MockATMRepository
            .Setup(r => r.GetByIdAsync("atm1"))
            .ReturnsAsync((ATM?)null);

        var dto = new CreateStatusReportDto("atm1", null, HasCash: true);

        var response = await _client.PostAsSnakeCaseJsonAsync("/api/StatusReport", dto);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task SubmitReport_WithAuth_WhenATMNotFound_ReturnsBadRequest()
    {
        var token = await GetAuthToken();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        _factory.MockATMRepository
            .Setup(r => r.GetByIdAsync("nonexistent"))
            .ReturnsAsync((ATM?)null);

        var dto = new CreateStatusReportDto("nonexistent", "user1", HasCash: true);
        var response = await _client.PostAsSnakeCaseJsonAsync("/api/StatusReport", dto);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        _client.DefaultRequestHeaders.Authorization = null;
    }

    [Fact]
    public async Task GetRecentReports_ReturnsOk()
    {
        var reports = new List<StatusReport>
        {
            new()
            {
                Id = "r1", ATMId = "atm1", UserId = "u1", HasCash = true,
                ReportedAt = DateTime.UtcNow, Status = ReportStatus.Verified
            }
        };

        _factory.MockStatusReportRepository
            .Setup(r => r.GetByATMIdAsync("atm1", It.IsAny<int>(), It.IsAny<int>()))
            .ReturnsAsync(reports);
        _factory.MockStatusReportRepository
            .Setup(r => r.CountByATMIdAsync("atm1"))
            .ReturnsAsync(1);

        var response = await _client.GetAsync("/api/StatusReport/atm/atm1");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}

using ATMLocator.Application.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace ATMLocator.Infrastructure.Services;

public class AfricasTalkingService : ISmsService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<AfricasTalkingService> _logger;
    private readonly string _apiKey;
    private readonly string _username;
    private readonly string _senderId;
    private readonly bool _enabled;

    public AfricasTalkingService(HttpClient httpClient, IConfiguration config, ILogger<AfricasTalkingService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
        _apiKey = config["AfricasTalking:ApiKey"] ?? string.Empty;
        _username = config["AfricasTalking:Username"] ?? string.Empty;
        _senderId = config["AfricasTalking:SenderId"] ?? "KudiLoc";
        _enabled = !string.IsNullOrEmpty(_apiKey) && !string.IsNullOrEmpty(_username);
    }

    public async Task SendAsync(string phoneNumber, string message)
    {
        if (!_enabled)
        {
            _logger.LogInformation("[SMS DISABLED] To {Phone}: {Message}", phoneNumber, message);
            return;
        }

        var content = new FormUrlEncodedContent(new[]
        {
            new KeyValuePair<string, string>("username", _username),
            new KeyValuePair<string, string>("to", phoneNumber),
            new KeyValuePair<string, string>("message", message),
            new KeyValuePair<string, string>("from", _senderId),
        });

        _httpClient.DefaultRequestHeaders.Remove("apiKey");
        _httpClient.DefaultRequestHeaders.Add("apiKey", _apiKey);
        _httpClient.DefaultRequestHeaders.Remove("Accept");
        _httpClient.DefaultRequestHeaders.Add("Accept", "application/json");

        var response = await _httpClient.PostAsync(
            "https://api.africastalking.com/version1/messaging", content);

        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync();
            _logger.LogError("Africa's Talking SMS failed for {Phone}: {Status} - {Body}",
                phoneNumber, response.StatusCode, body);
            throw new InvalidOperationException($"Falha ao enviar SMS: {response.StatusCode}");
        }

        _logger.LogInformation("SMS sent to {Phone}", phoneNumber);
    }
}

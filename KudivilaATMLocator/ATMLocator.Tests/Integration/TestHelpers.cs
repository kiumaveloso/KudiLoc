using System.Net.Http.Json;
using System.Text.Json;

namespace ATMLocator.Tests.Integration;

/// <summary>
/// Shared utilities for integration tests. The API is configured with
/// SnakeCaseLower JSON naming policy, so all POST/PUT bodies must
/// be serialized with the same policy; otherwise property binding fails.
/// </summary>
public static class TestHelpers
{
    /// <summary>
    /// JSON options matching the API's SnakeCaseLower configuration.
    /// </summary>
    public static readonly JsonSerializerOptions SnakeCaseJson = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        DictionaryKeyPolicy = JsonNamingPolicy.SnakeCaseLower,
    };

    /// <summary>
    /// POST JSON using the API's expected snake_case naming policy.
    /// </summary>
    public static Task<HttpResponseMessage> PostAsSnakeCaseJsonAsync<T>(
        this HttpClient client, string requestUri, T value)
    {
        return client.PostAsync(requestUri,
            JsonContent.Create(value, options: SnakeCaseJson));
    }

    /// <summary>
    /// PUT JSON using the API's expected snake_case naming policy.
    /// </summary>
    public static Task<HttpResponseMessage> PutAsSnakeCaseJsonAsync<T>(
        this HttpClient client, string requestUri, T value)
    {
        return client.PutAsync(requestUri,
            JsonContent.Create(value, options: SnakeCaseJson));
    }
}

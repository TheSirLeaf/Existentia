using System.Net.Http.Json;
using System.Security.Claims;
using Microsoft.AspNetCore.Components.Authorization;

namespace Existentia.Web.Services;

public class ApiAuthState
{
    public string? Token { get; set; }
    public string? Nome { get; set; }
    public string? Email { get; set; }
    public string? Papel { get; set; }
    public bool IsAuthenticated => !string.IsNullOrEmpty(Token);
}

public class ApiAuthStateProvider : AuthenticationStateProvider
{
    private readonly ApiAuthState _state = new();

    public override Task<AuthenticationState> GetAuthenticationStateAsync()
    {
        var identity = _state.IsAuthenticated
            ? new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.Name, _state.Email!),
                new Claim("nome", _state.Nome!),
                new Claim("papel", _state.Papel!),
            }, "jwt")
            : new ClaimsIdentity();

        return Task.FromResult(new AuthenticationState(new ClaimsPrincipal(identity)));
    }

    public void SetAuth(ApiAuthState state)
    {
        _state.Token = state.Token;
        _state.Nome = state.Nome;
        _state.Email = state.Email;
        _state.Papel = state.Papel;
        NotifyAuthenticationStateChanged(GetAuthenticationStateAsync());
    }

    public void Logout()
    {
        _state.Token = null;
        _state.Nome = null;
        _state.Email = null;
        _state.Papel = null;
        NotifyAuthenticationStateChanged(GetAuthenticationStateAsync());
    }

    public string? GetToken() => _state.Token;
    public string? GetNome() => _state.Nome;
    public string? GetEmail() => _state.Email;
}

public class AuthApiClient
{
    private readonly HttpClient _http;

    public AuthApiClient(HttpClient http)
    {
        _http = http;
    }

    public async Task<(bool Success, string? Token, string? Error)> Login(string email, string senha)
    {
        var resp = await _http.PostAsJsonAsync("/api/auth/login", new { Email = email, Senha = senha });

        if (!resp.IsSuccessStatusCode)
        {
            var body = await resp.Content.ReadFromJsonAsync<ErrorResponse>();
            return (false, null, body?.Erro ?? body?.Erros?.FirstOrDefault() ?? "Erro ao fazer login.");
        }

        var result = await resp.Content.ReadFromJsonAsync<AuthResponseDto>();
        return (true, result?.Token, null);
    }

    public async Task<(bool Success, string? Error)> Register(string nome, string email, string senha)
    {
        var resp = await _http.PostAsJsonAsync("/api/auth/register", new { Nome = nome, Email = email, Senha = senha });

        if (!resp.IsSuccessStatusCode)
        {
            var body = await resp.Content.ReadFromJsonAsync<ErrorResponse>();
            return (false, body?.Erros?.FirstOrDefault() ?? body?.Erro ?? "Erro ao registrar.");
        }

        return (true, null);
    }

    public async Task<AuthResponseDto?> GetUserInfo(string token)
    {
        // Decode JWT payload to get user info
        var parts = token.Split('.');
        if (parts.Length < 2) return null;

        var payload = parts[1];
        var padded = payload.Replace('-', '+').Replace('_', '/');
        switch (padded.Length % 4)
        {
            case 2: padded += "=="; break;
            case 3: padded += "="; break;
        }

        var bytes = Convert.FromBase64String(padded);
        var json = System.Text.Encoding.UTF8.GetString(bytes);
        var dict = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(json);

        if (dict == null) return null;

        return new AuthResponseDto
        {
            Token = token,
            Nome = dict.ContainsKey("nome") ? dict["nome"]?.ToString() : "",
            Email = dict.ContainsKey("email") ? dict["email"]?.ToString() : "",
            Papel = dict.ContainsKey("papel") ? dict["papel"]?.ToString() : "",
        };
    }

    public record AuthResponseDto(string? Token = null, string? Nome = null, string? Email = null, string? Papel = null);
    public record ErrorResponse(string? Erro = null, List<string>? Erros = null);
}

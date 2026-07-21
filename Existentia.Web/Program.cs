using Existentia.Web.Components;
using Existentia.Web.Services;
using Microsoft.AspNetCore.Components.Authorization;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddHttpContextAccessor();
builder.Services.AddCascadingAuthenticationState();

// API client
var apiBase = builder.Configuration["ApiBaseUrl"] ?? "http://localhost:5090";
builder.Services.AddHttpClient("Api", client =>
{
    client.BaseAddress = new Uri(apiBase);
});

builder.Services.AddScoped<ApiAuthStateProvider>();
builder.Services.AddScoped<AuthenticationStateProvider>(sp => sp.GetRequiredService<ApiAuthStateProvider>());
builder.Services.AddScoped<AuthApiClient>(sp =>
{
    var authState = sp.GetRequiredService<ApiAuthStateProvider>();
    var factory = sp.GetRequiredService<IHttpClientFactory>();
    var client = factory.CreateClient("Api");
    return new AuthApiClient(client);
});

builder.Services.AddRazorComponents()
    .AddInteractiveServerComponents();

var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error", createScopeForErrors: true);
    app.UseHsts();
}

app.UseStatusCodePagesWithReExecute("/not-found", createScopeForStatusCodePages: true);
app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseAntiforgery();

app.MapStaticAssets();
app.MapRazorComponents<App>()
    .AddInteractiveServerRenderMode();

app.Run();

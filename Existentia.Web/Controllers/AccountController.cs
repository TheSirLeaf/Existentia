using Existentia.Web.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace Existentia.Web.Controllers;

[Route("api/account")]
public class AccountController : Controller
{
    private readonly SignInManager<Usuario> _signInManager;

    public AccountController(SignInManager<Usuario> signInManager)
    {
        _signInManager = signInManager;
    }

    [HttpPost("login")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Login(string email, string senha, bool lembraMe = false)
    {
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(senha))
        {
            return Redirect("/login?erro=Email e senha são obrigatórios.");
        }

        var resultado = await _signInManager.PasswordSignInAsync(
            email, senha, lembraMe, lockoutOnFailure: false);

        if (resultado.Succeeded)
        {
            return Redirect("/");
        }

        return Redirect("/login?erro=Email ou senha inválidos.");
    }

    [HttpPost("logout")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Logout()
    {
        await _signInManager.SignOutAsync();
        return Redirect("/login");
    }
}

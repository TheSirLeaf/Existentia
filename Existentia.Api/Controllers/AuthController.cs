using Existentia.Api.Models;
using Existentia.Api.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace Existentia.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly UserManager<Usuario> _userManager;
    private readonly SignInManager<Usuario> _signInManager;
    private readonly TokenService _tokenService;

    public AuthController(
        UserManager<Usuario> userManager,
        SignInManager<Usuario> signInManager,
        TokenService tokenService)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _tokenService = tokenService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Nome) ||
            string.IsNullOrWhiteSpace(request.Email) ||
            string.IsNullOrWhiteSpace(request.Senha))
        {
            return BadRequest(new { erro = "Nome, email e senha são obrigatórios." });
        }

        var usuario = new Usuario
        {
            UserName = request.Email,
            Email = request.Email,
            Nome = request.Nome,
            Papel = PapelUsuario.Jogador
        };

        var resultado = await _userManager.CreateAsync(usuario, request.Senha);

        if (!resultado.Succeeded)
        {
            return BadRequest(new { erros = resultado.Errors.Select(e => e.Description) });
        }

        var token = _tokenService.GenerateToken(
            usuario.Id, usuario.Email!, usuario.Nome, usuario.Papel.ToString());

        return Ok(new AuthResponse(token, usuario.Nome, usuario.Email!, usuario.Papel.ToString()));
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Senha))
        {
            return BadRequest(new { erro = "Email e senha são obrigatórios." });
        }

        var resultado = await _signInManager.PasswordSignInAsync(
            request.Email, request.Senha, isPersistent: false, lockoutOnFailure: false);

        if (!resultado.Succeeded)
        {
            return Unauthorized(new { erro = "Email ou senha inválidos." });
        }

        var usuario = await _userManager.FindByEmailAsync(request.Email);
        if (usuario == null)
        {
            return Unauthorized(new { erro = "Email ou senha inválidos." });
        }

        var token = _tokenService.GenerateToken(
            usuario.Id, usuario.Email!, usuario.Nome, usuario.Papel.ToString());

        return Ok(new AuthResponse(token, usuario.Nome, usuario.Email!, usuario.Papel.ToString()));
    }
}

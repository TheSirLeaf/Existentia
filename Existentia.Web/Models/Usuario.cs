using Microsoft.AspNetCore.Identity;

namespace Existentia.Web.Models;

public class Usuario : IdentityUser
{
    public string Nome { get; set; } = string.Empty;
    public PapelUsuario Papel { get; set; } = PapelUsuario.Espectador;
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;

    public ICollection<Personagem> Personagens { get; set; } = new List<Personagem>();
}

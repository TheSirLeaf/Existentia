namespace Existentia.Web.Models;

public class Personagem
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string? Apelido { get; set; }
    public TipoPersonagem Tipo { get; set; }
    public string? ImagemUrl { get; set; }
    public string? Descricao { get; set; }
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
    public DateTime? AtualizadoEm { get; set; }

    public string? UsuarioId { get; set; }
    public Usuario? Usuario { get; set; }

    public ICollection<Conceito> Conceitos { get; set; } = new List<Conceito>();
    public ICollection<PersonagemAtributo> Atributos { get; set; } = new List<PersonagemAtributo>();
}

public enum TipoPersonagem
{
    PC,
    NPC
}

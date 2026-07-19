namespace Existentia.Web.Models;

public class Conceito
{
    public int Id { get; set; }
    public string Chave { get; set; } = string.Empty;
    public string Valor { get; set; } = string.Empty;
    public string? Descricao { get; set; }
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;

    public int PersonagemId { get; set; }
    public Personagem Personagem { get; set; } = null!;
}

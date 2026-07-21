namespace Existentia.Api.Models;

public class Atributo
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string? Descricao { get; set; }
    public string? Sigla { get; set; }

    public ICollection<PersonagemAtributo> PersonagemAtributos { get; set; } = new List<PersonagemAtributo>();
}

namespace Existentia.Web.Models;

public class PersonagemAtributo
{
    public int Id { get; set; }
    public int Valor { get; set; }
    public int? Modificador { get; set; }

    public int PersonagemId { get; set; }
    public Personagem Personagem { get; set; } = null!;

    public int AtributoId { get; set; }
    public Atributo Atributo { get; set; } = null!;
}

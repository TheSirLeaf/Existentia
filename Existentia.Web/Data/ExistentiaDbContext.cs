using Existentia.Web.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Existentia.Web.Data;

public class ExistentiaDbContext : IdentityDbContext<Usuario>
{
    public ExistentiaDbContext(DbContextOptions<ExistentiaDbContext> options)
        : base(options)
    {
    }

    public DbSet<Personagem> Personagens => Set<Personagem>();
    public DbSet<Conceito> Conceitos => Set<Conceito>();
    public DbSet<Atributo> Atributos => Set<Atributo>();
    public DbSet<PersonagemAtributo> PersonagemAtributos => Set<PersonagemAtributo>();
}

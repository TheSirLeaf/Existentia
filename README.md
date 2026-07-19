# Existentia

Sistema de RPG digital com fichas de personagem, wiki de lore, mapa interativo, chat com rolagem de dados e sincronização com FoundryVTT.

## Dependências

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js 22+](https://nodejs.org/)
- [Obsidian](https://obsidian.md/) (para edição do vault)

## Setup

```bash
# Clonar
git clone https://github.com/TheSirLeaf/Existentia.git
cd Existentia

# Backend (Blazor Server)
cd Existentia.Web
dotnet restore
dotnet watch run

# Wiki (Quartz)
cd ../Existentia.Wiki/quartz
npm i
npx quartz plugin install --from-config
npx quartz build --serve
```

### Configuração do Vault

O Launcher copia o conteúdo do vault Obsidian para o Quartz. O caminho padrão é:

```
D:\Meu Drive\DriveSyncFiles\Obsidian\Nowa Existentia
```

Para mudar, edite a linha `VaultPath` no topo de `Existentia.Launcher/Program.cs`:

```csharp
static readonly string VaultPath = @"C:\Users\SeuUsuario\Documents\SeuVault";
```

### Atalho (Launcher)

```bash
# Na raiz do projeto
dotnet run --project Existentia.Launcher
```

Ou dê double-click em `Iniciar.bat`.

| Atalho | O que faz |
|--------|-----------|
| `[1]` | Inicia Blazor + abre navegador |
| `[2]` | Inicia Quartz + abre navegador |
| `[3]` | Abre o vault no Explorer |
| `[A]` | Funções avançadas (copiar vault, backup) |
| `[S]` | Fecha tudo e sai |

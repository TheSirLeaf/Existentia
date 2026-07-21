# Existentia

Sistema de RPG digital com fichas de personagem, wiki de lore, mapa interativo, chat com rolagem de dados e sincronização com FoundryVTT.

## Arquitetura

```
Existentia.Api        →  API REST (auth, banco de dados, regras de negócio)
Existentia.Web        →  Blazor Server (consome a API via HTTP)
Existentia.Wiki       →  Quartz wiki (markdown do vault Obsidian)
Existentia.Launcher   →  Gerencia todos os serviços
```

A API é a única que acessa o banco (`existentia.db`). Todos os clientes (web, desktop, mobile) consomem a API via HTTP com JWT.

## Dependências

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js 22+](https://nodejs.org/)
- [Obsidian](https://obsidian.md/) (para edição do vault)

## Setup

```bash
# Clonar
git clone https://github.com/TheSirLeaf/Existentia.git
cd Existentia

# API (banco + auth)
cd Existentia.Api
dotnet restore
dotnet run

# Em outro terminal — Blazor (Web)
cd ../Existentia.Web
dotnet watch run

# Em outro terminal — Wiki (Quartz)
cd ../Existentia.Wiki/quartz
npm i
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
| `[1]` | API (banco + auth) |
| `[2]` | Blazor (Web) |
| `[3]` | Quartz (Wiki) |
| `[4]` | Obsidian (Vault) |
| `[A]` | Funções avançadas (copiar vault, backup) |
| `[S]` | Fecha tudo e sai |

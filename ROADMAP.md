# Roadmap - Existentia

## Fase 1 — Fundação
- [x] Setup do projeto Blazor Server (.NET 10)
- [x] Estrutura de solução (Existentia.sln + Existentia.Web)
- [x] EF Core + SQLite configurado
- [x] Models iniciais (Personagem, Conceito, Atributo, Usuário)
- [ ] Autenticação e cadastro de usuários
- [ ] Login / Logout
- [ ] Sistema de permissões (mestre, dev, player, viewer)
- [ ] CRUD de Personagens (criar, listar, editar, excluir)
- [ ] Criação de Conceitos (lore, personalidade, raça, etc.)

## Fase 2 — Sistema de Traços & Talentos
- [ ] Modelo de Traços (tags/etiquetas)
- [ ] Traços aplicáveis a Talentos, Itens, Equipamentos, etc.
- [ ] Catálogo de Talentos com CRUD
- [ ] Talentos nivelados (cada nível altera o funcionamento)
- [ ] Wiki MD por talento

## Fase 3 — Mundo & Comunicação
- [ ] Wiki/Lore com renderização de Markdown
- [ ] Wikilinks e links internos (estilo Obsidian)
- [ ] Permissões por seção/página da wiki
- [ ] Chat com rolagem de dados (notação: 2d20+1d6)
- [ ] Mapa interativo com zoom/pan/pins

## Fase 4 — Integrações
- [ ] Kanban board com drag & drop
- [ ] Sincronização com FoundryVTT
- [ ] Integração com Obsidian (leitura de arquivos MD)

---

## Stack
| Camada | Tecnologia |
|---|---|
| Frontend | Blazor Server |
| ORM | EF Core |
| DB | SQLite |
| Auth | ASP.NET Identity |
| MD Rendering | Markdig |
| Mapa | Leaflet.js |
| Chat | SignalR |

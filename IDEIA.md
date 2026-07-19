# Existentia

## Sistema de rpg com as seguintes features:

### **Personagem**
- Criação de fichas de personagem, com imagens, atributos, e afins.
    1. Criação de NPC (Uso do Mestre)
    2. Criação de PC (Uso do jogador)
    3. Pagina de criação de conceitos basicos do personagem, contendo CRUD (será usado em campos descritivos como lore, personalidade genero, raça e etc.), na pagina terá exibição da imagem do personagem.
    4. Automatização e criação de personagem guiada.

- Catálogo de Talentos com CRUD detalhado e página própria via link (parte da wiki, à frente) renderizada baseada em arquivos MD (habilidades de ficha de personagem) // Bônus: Automatização.
    1. Listagem de talentos filtrada baseada em traços.
    2. CRUD desses talentos.
    3. Artigo estilo wiki escrita em MD (preferencialmente obsidian) para o talento.
    4. Talentos nivelados, onde cada nível seguinte pode alterar o funcionamento do talento.

- Sistema de Traços, a base do sistema desse RPG.
    1. Traços aplicáveis a objetos específicos (Talentos/Itens/Equipamentos/Seres/Locais) que aparecem como etiquetas na exibição daquele objeto em específico.
    2. Descrição do traço ao passar o mouse.
    3. forks para facilidade de criação. 

---
### **Mundo**
- Página com o mapa expandido podendo o usuario dar zoom out/in, mover-se clickando com botão principal do mouse (ou customizavel), adicionar pins de localização (com sistema de renderização própio)

- [Mermaid](https://mermaid.ai) de modelagem de como o sistema será.

- Kanban board para gerenciamento de tarefas. (Player/Mestre/Dev) + (drag n' drop)
    1. Alternativas: Integrado ao Site / Github Projects / Trello / Obsidian Kanban Plugin

- Wiki de Lore do RPG + Artigos renderizados em MD (Inspirado nas freatures do [Obsidian](https://obsidian.md/), se possível utilizando a arquitetura dele, com wikilinks e afins, parecido com um um obsidian publish, talvez usar [Quartz](https://quartz.jzhao.xyz/)?)
    1. Exibição de páginas MD, especialmente bom se usar o próprio obsidian.
    2. Artigos pessoais por usuário.
    3. Gerenciamento de permissão, com seções de texto ou páginas restritas à usuários específicos.
    4. Comunicação Obsidian/Sistema para

- Sincronização com FoundryVTT.
    1. Sync Sistema -> Foundry.
    2. Sync em ambos os lados.

- Chat de texto com comandos e rolagens de dado baseado em notação (2d20...2d8+1d6).
    1. Chat de texto.
    2. Rolagem de dados baseada em notação.
    3. Linkagem de artigos da wiki e exibição de imagens.

- Autenticação e cadastro de usuários.
    1. Cadastro + Login
    2. Níveis de Permissão (mestre, dev, player e viewer)

---
### **Outros**

- Sistema de toasts persistente entre páginas.
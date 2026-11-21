# Especificações Técnicas – MTG Deck Manager

Documento destinado a desenvolvedores e avaliadores que desejam compreender a arquitetura interna do sistema.

## 1. Visão geral da arquitetura

O projeto segue o padrão **MVC (Model-View-Controller)**:

- **Model:** responsável pelo acesso e manipulação dos dados (pasta `src/models`).
- **View:** arquivos estáticos em `public/` (HTML, CSS, JS) servidos pelo Express.
- **Controller:** concentra a lógica de negócio e faz a ponte entre Model e View (pasta `src/controllers`).

As rotas são definidas em `src/routes` e montadas no `app.js`.

## 2. Tecnologias e dependências

| Camada | Tecnologia |
|---|---|
| Servidor | Node.js + Express |
| Banco de dados | MySQL |
| Driver MySQL | `mysql2` (promise) |
| Variáveis de ambiente | `dotenv` |
| Frontend | HTML, CSS, JavaScript puro |

## 3. Estrutura de diretórios
src/
├── controllers/
│ ├── usuarioController.js
│ ├── decksController.js
│ ├── cardsController.js
│ └── dashboardController.js
├── models/
│ ├── usuarioModel.js
│ ├── deckModel.js
│ ├── cartaModel.js
│ └── ...
├── routes/
│ ├── usuarios.js
│ ├── decks.js
│ ├── cards.js
│ └── dashboard.js
└── database/
├── config.js
└── script-tabelas.sql
public/
├── index.html
├── login.html
├── cadastro.html
├── dashboard.html
├── deck.html
├── perfil.html
└── assets/ (css, js, imagens)
app.js


## 4. Modelo de dados (detalhado)

### 4.1 Tabelas

- **`cadastro`**: armazena e-mail, senha (hash) e status.
- **`usuario`**: nome e FK para `cadastro`.
- **`deck`**: nome, comandante, identidade de cor e FK para `usuario`.
- **`carta`**: catálogo de cartas com atributos de MTG (CMC, cores, texto, etc.).
- **`board`**: tipos de board (Mainboard, Sideboard, Maybeboard, Wishboard).
- **`deck_carta`**: tabela associativa que relaciona decks, cartas e boards, com campo `quantidade`.
- **`tipo`** e **`tipo_carta`**: normalização dos tipos de carta.

### 4.2 Relacionamentos principais

- Um **usuário** possui muitos **decks** (1:N).
- Um **deck** possui muitas **cartas** através de `deck_carta` (N:N).
- Uma **carta** pode pertencer a vários **tipos** via `tipo_carta` (N:N).
- `deck_carta` possui FK para `deck` com `ON DELETE CASCADE`, garantindo integridade referencial.

## 5. API – Rotas e Controllers

### 5.1 Usuário (`usuarioController.js`)

| Método | Rota | Ação |
|---|---|---|
| POST | `/usuarios/autenticar` | Login (valida e-mail/senha) |
| POST | `/usuarios/cadastrar` | Cria novo usuário |

### 5.2 Decks (`decksController.js`)

| Método | Rota | Ação |
|---|---|---|
| GET | `/decks/usuario/:id` | Lista decks de um usuário |
| GET | `/decks/:id` | Detalhe simples do deck |
| GET | `/decks/:id/completo` | Detalhe com cartas e validação de acesso |
| POST | `/decks` | Cadastra novo deck |
| PUT | `/decks/:id` | Atualiza deck (verifica propriedade) |
| DELETE | `/decks/:id` | Remove deck (verifica propriedade) |
| GET | `/decks/:id/cartas` | Lista cartas do deck |
| POST | `/decks/:id/cartas` | Adiciona carta (ou incrementa quantidade) |
| DELETE | `/decks/:id/cartas/:cartaId` | Remove carta |
| POST | `/decks/:id/cartas/lote` | Adiciona várias cartas de uma vez |

### 5.3 Cartas (`cardsController.js`)

| Método | Rota | Ação |
|---|---|---|
| GET | `/cards/comandantes` | Busca cartas que podem ser comandantes |
| POST | `/cards/lote` | Verifica existência de cartas em lote |
| GET | `/cards/buscar` | Busca simples por nome (com filtros e paginação) |
| GET | `/cards/avancada` | Busca avançada (nome, cores, custo, tipo, texto) |

### 5.4 Dashboard (`dashboardController.js`)

| Método | Rota | Ação |
|---|---|---|
| GET | `/dashboard/perfil` | Dados agregados do perfil |
| GET | `/dashboard/deck/:id` | Estatísticas de um deck específico |

## 6. Segurança e validações

- Senhas devem ser armazenadas com hash (ex.: bcrypt) – **atualmente o script insere senha em texto plano, o que precisa ser corrigido**.
- Validação de propriedade: operações de atualização/remoção de decks verificam se o deck pertence ao usuário autenticado.
- Uso de `ON DUPLICATE KEY UPDATE` para adicionar cartas evita duplicatas e soma quantidades.
- Recomenda-se implementar autenticação via JWT ou sessões seguras.

## 7. Fluxo de dados (exemplo: adicionar carta a um deck)

1. Frontend envia `POST /decks/:id/cartas` com `{ cartaId, boardId, quantidade }`.
2. `decksController.adicionarCarta` valida se o deck pertence ao usuário.
3. Model executa `INSERT ... ON DUPLICATE KEY UPDATE quantidade = quantidade + ?`.
4. Retorna status 200 ou 201.

## 8. Pontos de melhoria (técnicos)

- Implementar hash de senhas.
- Adicionar testes automatizados (Jest + Supertest).
- Padronizar respostas da API (ex.: sempre retornar `{ success, data, error }`).
- Documentar a API com Swagger/OpenAPI.
- Separar melhor as responsabilidades (controllers muito extensos).
- Utilizar migrations em vez de script SQL manual.
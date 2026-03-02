# Projeto-X — Plataforma Imobiliária

Plataforma para **imobiliárias e corretores**: CRM, site em um clique, disparos com tags e qualificação, publicação Instagram, agente nas postagens e **agente WhatsApp** (MCP + LangGraph).

## ⚠️ Regra imutável

- **Todo o código** da plataforma é escrito **apenas** no Projeto-X.
- Os projetos Agentes-SaaS, CRM-Imobliaria, Devocionais e Agente-Instagram são **referência**: nada é alterado neles; o que for útil é **reaplicado** aqui.

## 📂 Estrutura

```
Projeto-X/
├── docs/
│   ├── DESENHO_FASE_0.md
│   ├── DEPLOY_EASYPANEL.md   # Deploy: 3 serviços, quando criar repo/EasyPanel
│   ├── ENV.md                # Variáveis de ambiente por serviço
│   └── schema/schema.sql
├── backend/                  # API (Express, Drizzle). Dockerfile na pasta.
├── frontend/                 # Painel (Vite + React). Dockerfile na pasta.
├── mcp-server/               # MCP (FastMCP). Dockerfile na pasta.
├── PROJECT.md
├── PRODUTO_PLATAFORMA_IMOBILIARIA.md
├── PLATAFORMA_VISAO.md
└── README.md
```

## 📖 Documentos principais

| Documento | Conteúdo |
|-----------|----------|
| [PROJECT.md](./PROJECT.md) | Visão do projeto, stack, regras de execução (Cursor commit+push, Fred deploy). |
| [PRODUTO_PLATAFORMA_IMOBILIARIA.md](./PRODUTO_PLATAFORMA_IMOBILIARIA.md) | Produto: módulos (CRM, Site, Instagram, Disparos, Agentes), público, regra imutável. |
| [docs/DESENHO_FASE_0.md](./docs/DESENHO_FASE_0.md) | Desenho para desenvolvimento: modelo de dados, repositórios, checklist de kickoff. |
| [docs/schema/schema.sql](./docs/schema/schema.sql) | Draft do modelo de dados unificado (SQL). |
| [docs/DEPLOY_EASYPANEL.md](./docs/DEPLOY_EASYPANEL.md) | Deploy: 3 serviços no EasyPanel. |
| [docs/DEPLOY_AGORA.md](./docs/DEPLOY_AGORA.md) | **O que fazer agora** — passo a passo para colocar no ar. |
| [docs/ENV.md](./docs/ENV.md) | Variáveis de ambiente (backend, frontend, mcp-server, DB). |

## 🚀 Deploy (EasyPanel)

Cada pasta (**backend**, **frontend**, **mcp-server**) tem **Dockerfile** próprio para instalar o serviço separadamente. Ver **[docs/DEPLOY_EASYPANEL.md](./docs/DEPLOY_EASYPANEL.md)**. Quando o assistente avisar *“Pode criar o repositório e abrir o projeto no EasyPanel”*, crie o repo no GitHub e os 3 serviços no EasyPanel; em seguida definimos as variáveis de ambiente (**[docs/ENV.md](./docs/ENV.md)**).

## 🚀 Iniciar desenvolvimento

1. Ler **docs/DESENHO_FASE_0.md** (modelo de dados e checklist).
2. Aplicar o schema em um PostgreSQL (ou gerar migrations a partir de `docs/schema/schema.sql`).
3. Desenvolver na ordem: **backend** (auth, CRM mínimo, webhook) → **mcp-server** (tools) → **frontend** (login, CRM).

## Acesso demo

Após o seed (primeira subida do backend), existe um tenant e usuário de demonstração:

| Campo    | Valor           |
|----------|-----------------|
| **Login** | `admin@demo.com` |
| **Senha** | `admin123`       |

Use no **frontend** (login) ou para testar a API. O tenant demo tem imóveis e contatos de exemplo.

## Regras de negócio (CRM)

- **Tarefas não podem ser soltas**: toda tarefa deve estar vinculada a um **lead (contato)** e, preferencialmente, a um **responsável (usuário)** que executa. Isso permite saber o que foi executado e por quem.

## Comandos do chat (webhook)

No **POST /api/webhook/message** (ou integração Evolution/ChatWoot), o usuário pode enviar:

| Mensagem | Ação |
|----------|------|
| `buscar imóveis` / `buscar até 500 mil` | Lista imóveis (com filtro de valor opcional) |
| `1` (só o número) | Detalhes do imóvel 1 |
| `contatos` | Lista contatos/leads |
| `contato 2` | Detalhes do contato 2 |
| `tarefas` | Lista tarefas |
| `concluir tarefa 2` | Marca tarefa 2 como concluída |
| `criar tarefa: Ligar para João` | Cria tarefa (aceita "amanhã" para data) |

## Ambiente

- Deploy: **EasyPanel** (VPS); repositórios no **GitHub**.
- Regra: Cursor (IA) faz commit + push; Fred implanta no EasyPanel.

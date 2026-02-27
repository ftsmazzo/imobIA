# Desenho Fase 0 — Modelo de Dados e Arquitetura

> Documento de desenho para colocar a Plataforma Imobiliária em desenvolvimento. Define o modelo de dados unificado, os repositórios/serviços e o checklist de kickoff.

---

## 📋 Metadados

| Campo | Valor |
|-------|-------|
| **Documento** | Desenho Fase 0 |
| **Criado** | 2026-02-26 |
| **Status** | Em uso — desenvolvimento iniciado |
| **Relacionado** | PROJECT.md, PRODUTO_PLATAFORMA_IMOBILIARIA.md |

---

## 🎯 Objetivo da Fase 0

- Ter **modelo de dados unificado** documentado e em SQL draft.
- Ter **arquitetura de repositórios e serviços** definida.
- Ter **estrutura de pastas** do Projeto-X pronta para desenvolvimento.
- Servir de referência única para quem for codar (backend, MCP server, frontend).

---

## 🏗 Estrutura de repositórios e serviços

Todo o código fica **dentro do Projeto-X**. A estrutura de pastas reflete os futuros repositórios (podem ser monorepo ou repos separados no GitHub).

```
Projeto-X/
├── docs/                    # Documentação (este desenho, schema, decisões)
│   ├── DESENHO_FASE_0.md
│   └── schema/
│       └── schema.sql       # Draft do modelo unificado
├── backend/                 # API, LangGraph, webhooks, jobs
├── mcp-server/              # Servidor MCP (FastMCP), tools imobiliárias
├── frontend/                 # Painel (admin + app imobiliário)
├── PROJECT.md
├── PRODUTO_PLATAFORMA_IMOBILIARIA.md
├── PLATAFORMA_VISAO.md
└── README.md
```

### Responsabilidade de cada parte

| Pasta / Serviço | Responsabilidade | Stack (prevista) |
|-----------------|-------------------|------------------|
| **backend** | API REST ou tRPC, autenticação, tenant/planos, CRM (imóveis, contatos, pipeline, tarefas), disparos, site config, agenda; recebe webhooks (Evolution/ChatWoot); orquestra LangGraph; chama MCP Server para tools. | Node.js, TypeScript, PostgreSQL (Drizzle ou Prisma), Evolution API, ChatWoot, Redis (opcional) |
| **mcp-server** | Servidor MCP (FastMCP) expondo tools: buscar imóveis, buscar contato, agendar visita, RAG, etc. Chamado pelo backend/agente. | Python, FastMCP |
| **frontend** | Painel web: login, dashboard, CRM (imóveis, contatos, pipeline, tarefas), configuração do agente, disparos, listas/tags, config do site, (futuro) Instagram. | React (ou Next.js), TypeScript, Vite |

---

## 📊 Modelo de dados unificado (resumo)

Todas as tabelas são **multi-tenant** via `tenant_id`, exceto `plans` e tabelas de sistema.

### Núcleo (conta, usuários, planos, agente)

| Entidade | Tabela | Descrição |
|----------|--------|-----------|
| Inquilino (conta) | `tenants` | Imobiliária ou corretor; plano; status; credenciais Evolution/ChatWoot (quando aplicável). |
| Usuários | `users` | Usuários da plataforma; pertencem a um `tenant`; role: admin, gestor, corretor. |
| Planos | `plans` | Planos (Corretor, Imobiliária, etc.); limites (imóveis, leads, disparos, agentes). |
| Agente | `agents` | Agente de IA por tenant; Evolution instance, ChatWoot inbox, N8N/MCP. |
| Config do agente | `agent_configs` | Prompt, welcome, tools habilitadas, RAG, agenda; 1:1 com `agents`. |

### CRM

| Entidade | Tabela | Descrição |
|----------|--------|-----------|
| Imóvel | `properties` | Imóveis (endereço, tipo, valor, status, descrição, etc.). |
| Fotos do imóvel | `property_photos` | Fotos por imóvel; ordem, url. |
| Contato / Lead | `contacts` | Nome, telefone, email, origem, opt_in, tags (via relação), estágio no pipeline. |
| Tag | `tags` | Tags (ex.: interesse-aluguel, lead-quente); tenant. |
| Contato ↔ Tag | `contact_tag_relations` | N:N entre contatos e tags. |
| Etapa do pipeline | `pipeline_stages` | Etapas (lead, qualificado, visita, proposta, fechado); ordem; tenant. |
| Estágio do contato | `contacts.pipeline_stage_id` ou `deals` | Contato em qual etapa; opcional: tabela `deals` (contato + imóvel + etapa). |
| Tarefa | `tasks` | Tarefa (ligar, visitar, etc.); vinculada a contact e/ou property; responsável user. |

### Disparos

| Entidade | Tabela | Descrição |
|----------|--------|-----------|
| Lista | `contact_lists` | Lista estática/dinâmica; filtros (tags, opt_in) em JSON. |
| Item da lista | `contact_list_items` | Contatos em lista estática (para listas híbridas). |
| Disparo | `dispatches` | Campanha; tipo (marketing, novo_imovel, empreendimento); lista; status; blindagem. |
| Disparo ↔ Contato | `dispatch_contacts` | Contatos de um disparo; status (pending, sent, failed); pontuação se for devocional-style. |

### Canal e conversa (WhatsApp / agente)

| Entidade | Tabela | Descrição |
|----------|--------|-----------|
| Conversa | `conversations` | Conversa com um contato em um agente; status (active, closed). |
| Mensagem | `chat_messages` | Mensagens da conversa; role (user, assistant); conteúdo; mídia. |

### Site e extensões

| Entidade | Tabela | Descrição |
|----------|--------|-----------|
| Config do site | `site_configs` | Por tenant: nome, logo, cores, domínio/subdomínio, template. |
| Visita (agenda) | `visits` ou `scheduled_visits` | Visita agendada; contato, imóvel, data/hora, responsável. |
| Disponibilidade | `availability` ou em `site_configs` | Horários disponíveis para agendamento (opcional na Fase 1). |

---

## 🔗 Diagrama de relações (principais)

```
tenants 1──N users
tenants 1──N agents 1──1 agent_configs
tenants N──1 plans

tenants 1──N properties 1──N property_photos
tenants 1──N contacts N──N tags (contact_tag_relations)
tenants 1──N pipeline_stages
contacts N──1 pipeline_stages (ou deals)
tasks N──1 contacts, N──1 properties?, N──1 users

tenants 1──N contact_lists 1──N contact_list_items N──1 contacts
tenants 1──N dispatches 1──N dispatch_contacts N──1 contacts

agents 1──N conversations N──1 contacts
conversations 1──N chat_messages

tenants 1──1 site_configs
tenants 1──N visits (scheduled_visits) N──1 contacts, N──1 properties
```

---

## 📁 Schema SQL (draft)

O arquivo **`docs/schema/schema.sql`** contém o draft do modelo unificado em SQL (CREATE TABLE). É a referência para implementar no backend com Drizzle ou Prisma; ajustes finos (tipos, índices, FKs) podem ser feitos na implementação.

---

## ✅ Checklist de kickoff (desenvolvimento)

### Setup geral
- [x] Documento DESENHO_FASE_0.md criado
- [x] Schema draft (schema.sql) criado
- [x] Estrutura de pastas `backend/`, `mcp-server/`, `frontend/` criada
- [x] README.md do Projeto-X com visão e links
- [x] Repositórios GitHub (monorepo imobIA) definidos e criados
- [x] EasyPanel: projeto criado; PostgreSQL provisionado; backend, frontend, mcp-server online

### Backend
- [x] Projeto Node.js + TypeScript; Express, Drizzle
- [x] Conexão PostgreSQL; schema aplicado no deploy (entrypoint); seed (plans)
- [ ] Auth (login, JWT ou sessão); middleware tenant
- [ ] CRUD mínimo: tenants, users (plans já com seed)
- [x] CRUD: properties, property_photos, contacts, tags, pipeline_stages, tasks
- [ ] API de listas e disparos (estrutura)
- [ ] Webhook Evolution/ChatWoot (receber mensagem)
- [ ] Integração LangGraph + MCP (chamar tools do mcp-server)

### MCP Server
- [x] Projeto Python; FastMCP instalado
- [x] Tool: buscar imóveis (search_properties, get_property)
- [ ] Tool: buscar contato
- [ ] Tool: agendar visita (ou registrar interesse)
- [x] Servidor HTTP (porta 8000) para o backend chamar

### Frontend
- [x] Projeto React + TypeScript + Vite; config runtime (VITE_API_URL)
- [ ] Login e layout base
- [ ] Páginas: Dashboard, Imóveis, Contatos, Pipeline, Tarefas (mínimo)
- [ ] Configuração do agente (prompt, nome) e conexão WhatsApp (QR)

### Integração e deploy
- [x] Variáveis de ambiente documentadas (docs/ENV.md, .env.example onde aplicável)
- [x] Dockerfile para backend, mcp-server, frontend (contexto raiz)
- [x] Deploy no EasyPanel (backend + frontend + mcp-server + PostgreSQL)

---

## 🚀 Próximos passos (após tudo online)

Ordem sugerida:

1. **Backend — Auth e núcleo**  
   Login (JWT ou sessão), middleware tenant, CRUD tenants/users (além do seed de plans). Base para o restante.

2. **Backend — CRUD CRM**  
   Rotas para properties, contacts, pipeline_stages, tags, tasks (e property_photos). Frontend e MCP vão consumir.

3. **Frontend — Layout e listagem**  
   Login, layout base (sidebar/menu), página que lista planos (já tem `/api/plans`) e depois Imóveis/Contatos.

4. **Integração**  
   Webhook Evolution/ChatWoot → LangGraph → chamar MCP (search_properties, get_property, etc.).

5. **MCP**  
   Tools adicionais: buscar contato, agendar visita (quando o backend tiver as tabelas/APIs).

---

## 📝 Histórico (este documento)

| Data | Alteração |
|------|-----------|
| 2026-02-26 | Criação. Modelo de dados unificado (resumo), estrutura de repos/serviços, checklist de kickoff. |
| 2026-02-27 | Checklist atualizado (deploy e Dockerfiles concluídos); seção "Próximos passos" adicionada. |

---

*Última atualização: 2026-02-27*

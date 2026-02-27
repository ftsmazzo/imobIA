# Projeto Agentes MCP

> Documentação base do projeto. Tudo registrado aqui, versionado e com histórico de alterações.

---

## 📋 Metadados

| Campo | Valor |
|-------|-------|
| **Nome** | Agentes MCP |
| **Início** | 2026-02-11 |
| **Status** | Setup → Desenvolvimento |
| **Ambiente** | EasyPanel (VPS) — projeto dedicado, paralelo à estrutura atual |

---

## ⚙️ Regras de Execução (IMUTÁVEIS)

**A partir do momento que começarmos a codar:**

| Responsável | Responsabilidade |
|-------------|------------------|
| **Cursor (IA)** | Sempre que alterar código: **commit + push** nos repositórios do GitHub |
| **Fred** | **Implantar** no EasyPanel o que foi commitado no GitHub |

**Projeto único — outros projetos são referência:**

| Regra | Descrição |
|-------|-----------|
| **Só Projeto-X** | Todo código da Plataforma Imobiliária (e do ecossistema Agentes MCP) é escrito e alterado **apenas** no Projeto-X (seus repositórios e pastas). |
| **Não alterar outros projetos** | Agentes-SaaS, CRM-Imobliaria, Devocionais e Agente-Instagram estão no workspace para **conhecer e replicar**. **Nada deve ser alterado** no código desses projetos. |
| **Reaplicar** | O que for útil neles deve ser **reaplicado** no Projeto-X (reimplementado ou adaptado), nunca editado na origem. |

**Implantação — tudo automático:**

| Regra | Descrição |
|-------|-----------|
| **Sem comandos manuais** | Não migrar nem rodar nada em command/shell. Banco de dados (schema, seed) e o que for necessário devem estar prontos e **rodar automaticamente na implantação**. |

*Estas regras não serão repetidas em outros documentos. São a base do fluxo de trabalho. Detalhes em [PRODUTO_PLATAFORMA_IMOBILIARIA.md](./PRODUTO_PLATAFORMA_IMOBILIARIA.md).*

---

## 🎯 Visão do Projeto

Construir um ecossistema de agentes de IA com:
- **MCP** como protocolo de ferramentas (desacoplamento)
- **LangGraph** como orquestrador principal (extensível para CrewAI no futuro)
- **Front-end** modular para administração (Fase 2)
- **Preparado para SaaS** (Fase 3, quando validado)

**Ampliação — Plataforma Imobiliária:** Produto focado em imobiliárias e corretores: CRM, site 1 clique, disparos com tags e qualificação, publicação Instagram, agente nas postagens e agente WhatsApp (MCP). Ver **[PRODUTO_PLATAFORMA_IMOBILIARIA.md](./PRODUTO_PLATAFORMA_IMOBILIARIA.md)** para escopo completo e **[PLATAFORMA_VISAO.md](./PLATAFORMA_VISAO.md)** para estratégia e reuso (por reaplicação, sem alterar os projetos de referência).

---

## 🛠 Stack Tecnológica

| Camada | Tecnologia |
|--------|------------|
| Orquestração do agente | LangGraph |
| Protocolo de ferramentas | MCP (Model Context Protocol) |
| Servidor MCP | FastMCP (Python) |
| LLM | A definir por agente (OpenAI, xAI Grok, etc.) |
| Banco de dados | PostgreSQL (Supabase ou próprio) |
| Cache / Filas | Redis |
| WhatsApp | Evolution API |
| Atendimento / Canal | ChatWoot |
| Automação (opcional) | N8N |
| Deploy | EasyPanel + Docker + GitHub |

---

## 🏗 Arquitetura

```
                    ┌─────────────────────────────────────────┐
                    │         EasyPanel - Projeto Agentes MCP  │
                    │                                          │
  WhatsApp ◄──────► Evolution API ◄──────► ChatWoot             │
       │                    │                     │             │
       │                    │ webhook             │             │
       ▼                    ▼                     ▼             │
  ┌─────────┐         ┌─────────────┐      ┌──────────────┐   │
  │ Webhook │────────►│   Backend   │      │   N8N         │   │
  └─────────┘         │  (Agente    │      └──────────────┘   │
                      │  LangGraph) │                          │
                      └──────┬──────┘                          │
                             │ tools                           │
                             ▼                                 │
                      ┌─────────────┐                          │
                      │ MCP Server  │                          │
                      └──────┬──────┘                          │
                             │                                 │
                      ┌──────┴──────┐                          │
                      ▼             ▼                          │
               PostgreSQL        Redis                         │
                    └─────────────────────────────────────────┘
```

---

## 📅 Fases do Projeto

### Fase 1 — MVP Funcional
**Objetivo:** Atendimento via WhatsApp com LangGraph + MCP funcionando.

| Inclui | Não inclui |
|--------|------------|
| MCP Server com tools principais | Multi-tenancy |
| Agente LangGraph | Billing |
| Integração Evolution + ChatWoot | CrewAI |
| Memória em PostgreSQL | Marketplace |
| Fluxo completo receber → processar → responder | Front-end avançado |

### Fase 2 — Painel de Administração
**Objetivo:** Configurar agentes e MCP via interface.

| Inclui | Não inclui |
|--------|------------|
| CRUD de agentes (nome, persona, tools) | Multi-tenancy |
| Vincular MCP/tools a agentes | Billing |
| Ver histórico de conversas | Marketplace |
| Trocar prompt/LLM por agente | |

### Fase 3 — Escala SaaS (futuro)
**Objetivo:** Vender agentes como serviço.

| Inclui |
|--------|
| Multi-tenancy |
| Planos e billing |
| Onboarding de clientes |
| CrewAI como orquestrador opcional |

---

## 📜 Regras de Negócio

1. **Agentes como dados** — definidos em banco, não hardcoded
2. **MCP como contrato** — tools no MCP Server; agentes referenciam
3. **Orquestradores plugáveis** — LangGraph hoje, CrewAI amanhã (sem quebrar)
4. **MVP antes de SaaS** — validar com um caso antes de escalar
5. **Um documento, versionado** — evitar fragmentação de informação

---

## 📂 Estrutura Prevista

### Repositórios GitHub

| Repo | Conteúdo |
|------|----------|
| `agentes-mcp-server` | Servidor MCP (FastMCP, tools) |
| `agentes-mcp-backend` | Agente LangGraph, API, webhooks |
| `agentes-mcp-frontend` | Painel de administração (Fase 2) |

### Serviços no EasyPanel (projeto "Agentes MCP")

| Serviço | Tipo | Observação |
|---------|------|------------|
| PostgreSQL | Banco | Dedicado ao projeto |
| Redis | Cache | Opcional na Fase 1 |
| N8N | Automação | Opcional |
| Evolution API | WhatsApp | Dedicado |
| ChatWoot | Atendimento | Dedicado |
| mcp-server | App (GitHub) | Deploy via Dockerfile |
| backend | App (GitHub) | Deploy via Dockerfile |
| frontend | App (Fase 2) | Deploy via Dockerfile |

---

## 🚀 Setup Inicial (Próximos Passos)

### 0. Desenho (concluído)
- [x] Modelo de dados unificado: **[docs/DESENHO_FASE_0.md](./docs/DESENHO_FASE_0.md)** e **[docs/schema/schema.sql](./docs/schema/schema.sql)**
- [x] Estrutura de pastas: `backend/`, `mcp-server/`, `frontend/` — ver **[README.md](./README.md)**

### 1. EasyPanel
- [ ] Criar projeto "Agentes MCP" (ou "Plataforma Imobiliária") no EasyPanel
- [ ] Instalar: PostgreSQL, Redis (opcional), Evolution API, ChatWoot, N8N (opcional)

### 2. GitHub
- [ ] Definir: monorepo (Projeto-X único) ou repos separados (`agentes-mcp-server`, `agentes-mcp-backend`, `agentes-mcp-frontend`)
- [ ] Criar repositório(s) e conectar ao EasyPanel

### 3. Desenvolvimento
- [ ] Backend: aplicar schema, auth, CRUD mínimo (tenants, properties, contacts)
- [ ] MCP Server: FastMCP com tools imobiliárias
- [ ] Frontend: login, dashboard, páginas CRM
- [ ] Integração: webhook Evolution/ChatWoot → LangGraph → MCP

---

## 📝 Histórico de Alterações

| Data | Versão | Alteração |
|------|--------|-----------|
| 2026-02-11 | 0.1 | Criação do documento base. Definição de escopo, fases, stack, regra de execução, estrutura de repos e EasyPanel. |
| 2026-02-23 | 0.2 | Inclusão da ampliação “Plataforma + apps nichados”; referência a PLATAFORMA_VISAO.md. |
| 2026-02-23 | 0.3 | Regra imutável Projeto único / não alterar outros / reaplicar; PRODUTO_PLATAFORMA_IMOBILIARIA.md. |
| 2026-02-26 | 0.4 | Desenho Fase 0: docs/DESENHO_FASE_0.md, docs/schema/schema.sql, estrutura backend/mcp-server/frontend, README; status Setup → Desenvolvimento. |

---

*Última atualização: 2026-02-26*

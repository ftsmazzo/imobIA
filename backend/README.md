# Backend — Plataforma Imobiliária

API, webhooks, LangGraph e integrações. Todo código aqui faz parte do **Projeto-X**; não alterar projetos de referência (Agentes-SaaS, CRM-Imobliaria, Devocionais).

## Responsabilidade

- API (REST ou tRPC): auth, tenants, planos, CRM (imóveis, contatos, pipeline, tarefas), disparos, listas/tags, site config, agenda
- Webhooks: Evolution API, ChatWoot
- Orquestração do agente: LangGraph; chamada ao MCP Server para tools
- Jobs: disparos agendados, reset de créditos (quando houver)

## Stack prevista

- Node.js, TypeScript
- PostgreSQL (Drizzle ou Prisma) — schema em `../docs/schema/schema.sql`
- Evolution API, ChatWoot
- Redis (opcional, Fase 1)

## Desenho

Ver `../docs/DESENHO_FASE_0.md`.

## Como iniciar desenvolvimento

```bash
cd backend
cp .env.example .env
# Editar .env e definir DATABASE_URL (PostgreSQL)

pnpm install
pnpm db:push      # Cria tabelas no banco (Drizzle)
pnpm db:seed      # Insere planos iniciais (Corretor, Imobiliária)
pnpm dev          # Sobe o servidor em http://localhost:3000
```

- **GET /api/health** — health check
- **GET /api/plans** — listar planos (requer seed)

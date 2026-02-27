# Variáveis de ambiente — Plataforma Imobiliária

Cada serviço (backend, frontend, mcp-server) e o banco têm variáveis próprias. No **EasyPanel** você configura por serviço.

---

## Banco de dados (PostgreSQL)

Crie um serviço **PostgreSQL** no EasyPanel (ou use um banco externo). Anote:

- **Host** (ex.: `postgres` ou o host interno)
- **Porta** (ex.: `5432`)
- **Usuário**
- **Senha**
- **Nome do banco** (ex.: `plataforma_imobiliaria`)

A **connection string** fica no formato:

```
postgresql://USUARIO:SENHA@HOST:5432/NOME_DO_BANCO
```

Exemplo para outro serviço no mesmo EasyPanel acessar o Postgres:

```
postgresql://postgres:SUA_SENHA@postgres:5432/plataforma_imobiliaria
```

---

## Backend

| Variável | Obrigatória | Descrição | Exemplo |
|----------|-------------|-----------|---------|
| `DATABASE_URL` | Sim | Connection string do PostgreSQL | `postgresql://user:pass@postgres:5432/plataforma_imobiliaria` |
| `PORT` | Não | Porta HTTP (padrão: 3000) | `3000` |
| `NODE_ENV` | Não | `development` ou `production` | `production` |

**Após o primeiro deploy:** rodar migrations/seed no banco (uma vez). No EasyPanel você pode usar "Execute command" no container do backend, por exemplo:

```bash
npx drizzle-kit push
npx tsx scripts/seed.ts
```

Ou aplicar o SQL manual: `docs/schema/schema.sql` e depois inserir os planos.

---

## Frontend

O frontend é **build estático** (Vite). A URL do backend é definida **no momento do build** (não em runtime).

| Variável | Obrigatória | Descrição | Exemplo |
|----------|-------------|-----------|---------|
| `VITE_API_URL` | Sim (no build) | URL pública do backend | `https://api.seudominio.com` ou `http://backend:3000` se for só interno |

No **EasyPanel**, configure como **Build Argument** (não como env de runtime):

- Nome: `VITE_API_URL`
- Valor: a URL que o navegador usará para chamar o backend (ex.: `https://api.seudominio.com`)

Se o backend for acessado por um domínio interno do EasyPanel, use o nome do serviço, ex.: `http://backend:3000` (só funciona se o front for servido pelo mesmo backend ou se houver proxy; em geral use a URL pública do backend).

---

## MCP Server

| Variável | Obrigatória | Descrição | Exemplo |
|----------|-------------|-----------|---------|
| `PORT` | Não | Porta HTTP (padrão: 8000) | `8000` |

Por enquanto o MCP server não precisa de banco; no futuro pode receber `BACKEND_URL` ou `DATABASE_URL` para chamar o backend ou ler direto.

---

## Resumo por serviço no EasyPanel

| Serviço | Variáveis principais |
|---------|----------------------|
| **PostgreSQL** | (criar usuário/senha/banco e anotar para o backend) |
| **backend** | `DATABASE_URL`, `PORT` (opcional), `NODE_ENV` (opcional) |
| **frontend** | Build arg: `VITE_API_URL` = URL do backend |
| **mcp-server** | `PORT` (opcional, padrão 8000) |

---

*Última atualização: 2026-02-26*

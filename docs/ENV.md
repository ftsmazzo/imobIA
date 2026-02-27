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

**Schema e seed:** rodam **automaticamente** no startup do container do backend (entrypoint). Não é necessário rodar nenhum comando em shell.

---

## Frontend

O frontend é **build estático** (Vite). A URL do backend é definida **no momento do build** (não em runtime).

| Variável | Obrigatória | Descrição | Exemplo |
|----------|-------------|-----------|---------|
| `VITE_API_URL` | Sim (no build) | **URL pública** do backend (a que o usuário acessa no navegador) | `https://api.seudominio.com` |

No **EasyPanel**, configure como **Build Argument**:

- Nome: `VITE_API_URL`
- Valor: **a URL pública do backend** — ou seja, o endereço que você usa no navegador para abrir a API do backend (com domínio e porta, se não for 80/443).

**Importante:** O frontend roda **no navegador do usuário**. As chamadas à API são feitas **pelo navegador**, não pelo servidor. Por isso:

- **Use a URL pública do backend** (ex.: `https://backend.seudominio.com` ou `https://api.imobia.com`).
- **Não use** o host interno do Docker (ex.: `http://imobia_backend:3000` ou `http://backend:3000`) — o navegador não resolve esses nomes e aparece "Backend inacessível".

Depois de alterar `VITE_API_URL`, é preciso **refazer o build e o deploy** do frontend (o valor é fixado no build).

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

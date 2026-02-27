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
| `JWT_SECRET` | Sim (produção) | Chave para assinar tokens JWT (login) | string longa e aleatória |
| `MCP_SERVER_URL` | Sim (para webhook) | URL do MCP server (backend chama as tools aqui) | `http://mcp-server:8000` (host interno Docker) |
| `PORT` | Não | Porta HTTP (padrão: 3000) | `3000` |
| `NODE_ENV` | Não | `development` ou `production` | `production` |

**Schema e seed:** rodam **automaticamente** no startup do container (entrypoint). Seed cria planos e, se não houver usuários, um tenant + admin (admin@demo.com / admin123). Defina **JWT_SECRET** no EasyPanel em produção.

---

## Frontend

A URL do backend é lida **em runtime**: ao subir o container, um script gera `/config.js` a partir da variável `VITE_API_URL`. Basta definir a variável no EasyPanel (variável de ambiente do **container**, não build arg) e reiniciar o serviço — não precisa refazer o build.

| Variável | Obrigatória | Descrição | Exemplo |
|----------|-------------|-----------|---------|
| `VITE_API_URL` | Sim | **URL pública** do backend (sem barra no final) | `https://imobia-backend.90qhxz.easypanel.host` |

No **EasyPanel**, configure como **variável de ambiente** do serviço frontend:

- Nome: `VITE_API_URL`
- Valor: **a URL pública do backend** (ex.: `https://imobia-backend.90qhxz.easypanel.host`), **sem barra no final**.

**Importante:** O frontend roda **no navegador do usuário**. As chamadas à API são feitas **pelo navegador**. Use sempre a URL pública do backend. Não use host interno (ex.: `http://imobia_backend:3000`) — o navegador não resolve e aparece "Backend inacessível".

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
| **frontend** | Variável de ambiente: `VITE_API_URL` = URL pública do backend (runtime) |
| **mcp-server** | `PORT` (opcional, padrão 8000) |

---

*Última atualização: 2026-02-26*

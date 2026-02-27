# Deploy no EasyPanel — Plataforma Imobiliária

Três serviços: **backend**, **frontend**, **mcp-server**. Cada um com seu **Dockerfile** na pasta correspondente.

---

## Quando criar o repositório e o EasyPanel

A estrutura mínima (backend, frontend, mcp-server com Dockerfiles e docs) já está pronta. **Quando o assistente avisar:** *“Pode criar o repositório no GitHub e abrir o projeto no EasyPanel”*, faça:

1. **GitHub:** crie o repositório (vazio ou só com README).
2. **EasyPanel:** crie o projeto e os 3 serviços (backend, frontend, mcp-server), cada um usando a pasta e o Dockerfile corretos.
3. Em seguida combinamos **todas as variáveis de ambiente** necessárias (estão listadas em [ENV.md](./ENV.md)).

O assistente fará **commit e push** no GitHub depois que você criar o repositório; você fará a **implantação** no EasyPanel.

---

## 1. Pré-requisito: repositório no GitHub

1. Crie um repositório no GitHub (ex.: `plataforma-imobiliaria` ou `projeto-x`).
2. **Não** faça push ainda — o assistente fará o primeiro commit e push quando você avisar que o repositório está criado (vazio ou com README).
3. Depois de receber o aviso **“Pode criar o repositório e abrir o projeto no EasyPanel”**, crie o repo e anote a URL (ex.: `https://github.com/SEU_USUARIO/plataforma-imobiliaria`).

---

## 2. EasyPanel: criar projeto e três serviços

1. No EasyPanel, crie um **novo projeto** (ex.: “Plataforma Imobiliária”).
2. Adicione o **PostgreSQL** (um serviço de banco) se ainda não tiver. Anote o host interno (ex.: `postgres`), usuário, senha e nome do banco. Monte a **DATABASE_URL** para o backend.
3. Crie **três serviços de aplicação**, cada um conectado ao **mesmo repositório** do GitHub, mas com **contexto (pasta) e Dockerfile** diferentes:

| Serviço   | Nome no EasyPanel | Pasta / Contexto | Dockerfile      | Porta |
|-----------|-------------------|------------------|------------------|-------|
| Backend   | `backend`         | `backend`        | `backend/Dockerfile` | 3000 |
| Frontend  | `frontend`        | `frontend`       | `frontend/Dockerfile`| 80   |
| MCP Server| `mcp-server`      | `mcp-server`     | `mcp-server/Dockerfile`| 8000 |

4. Em cada serviço:
   - **Build Context:** raiz do repositório (ou a pasta do serviço, conforme o EasyPanel permitir).
   - **Dockerfile path:** `backend/Dockerfile`, `frontend/Dockerfile`, `mcp-server/Dockerfile` (ajuste se o EasyPanel pedir caminho a partir da raiz).
   - **Portas:** exponha a porta indicada (3000, 80, 8000).

Se o EasyPanel pedir “pasta do projeto” ou “context”, use:
- Backend: pasta `backend` (e Dockerfile `Dockerfile` dentro dela), ou raiz com Dockerfile `backend/Dockerfile`.
- O mesmo para `frontend` e `mcp-server`.

(Ajuste fino depende da interface do EasyPanel; o importante é que cada build use o **Dockerfile** da pasta correta.)

---

## 3. Variáveis de ambiente

Configure conforme **[ENV.md](./ENV.md)**:

- **backend:** `DATABASE_URL` (obrigatório), `PORT`, `NODE_ENV`.
- **frontend:** build arg `VITE_API_URL` = URL do backend (ex.: `https://backend.seudominio.com`).
- **mcp-server:** `PORT` (opcional).

---

## 4. Ordem de deploy

1. Subir **PostgreSQL** (se for no EasyPanel).
2. Subir **backend** (com `DATABASE_URL`); depois rodar migrations/seed (veja ENV.md).
3. Subir **frontend** (com `VITE_API_URL` apontando para o backend).
4. Subir **mcp-server**.

---

## 5. Regra de atualização

- **Cursor (IA):** faz **commit + push** no GitHub após alterações.
- **Você (Fred):** faz **implantar** no EasyPanel o que foi enviado ao GitHub.

---

*Última atualização: 2026-02-26*

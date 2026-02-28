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

| Serviço   | Nome no EasyPanel | Contexto (build) | Dockerfile           | Porta |
|-----------|-------------------|------------------|----------------------|-------|
| Backend   | `backend`         | **raiz do repo** | `backend/Dockerfile` | 3000  |
| Frontend  | `frontend`        | **raiz do repo** | `frontend/Dockerfile`| 80    |
| MCP Server| `mcp-server`       | **raiz do repo** | `mcp-server/Dockerfile` | 8000 |

4. Em cada serviço:
   - **Build Context:** **raiz do repositório** (`.` ou o diretório onde está o clone).
   - **Dockerfile path:** exatamente `backend/Dockerfile`, `frontend/Dockerfile`, `mcp-server/Dockerfile` (com **hífen** em `mcp-server`, não `mcp~server`).
   - **Portas:** 3000, 80, 8000.

**Se der erro “mcp~server: no such file or directory”:** o EasyPanel às vezes troca o hífen por tilde. Ajuste manualmente o caminho do Dockerfile para **`mcp-server/Dockerfile`** (hífen) e o contexto para a **raiz** do repositório.

---

## 3. Variáveis de ambiente

Configure conforme **[ENV.md](./ENV.md)**:

- **backend:** `DATABASE_URL` (obrigatório), `PORT`, `NODE_ENV`.
- **frontend:** variável de ambiente `VITE_API_URL` = URL pública do backend (ex.: `https://imobia-backend.90qhxz.easypanel.host`).
- **mcp-server:** `PORT` (opcional).

---

## 4. Ordem de deploy

1. Subir **PostgreSQL** (se for no EasyPanel).
2. Subir **backend** (com `DATABASE_URL`); depois rodar migrations/seed (veja ENV.md).
3. Subir **frontend** (com `VITE_API_URL` apontando para o backend).
4. Subir **mcp-server**.

---

## 5. Troubleshooting — MCP Server reiniciando

Se o **mcp-server** ficar em loop (logs: "Shutting down" a cada poucos segundos):

1. **Tipo de serviço:** no EasyPanel, o mcp-server deve ser **aplicação web / long-running**, não "job" ou "cron". Job encerra o processo após iniciar.
2. **Health check:** o servidor responde **200** em GET `/`, `/health`, `/healthz`, `/ready`, `/readyz`. Se o painel tiver verificação de saúde, use um desses paths ou deixe desativado.
3. **Redeploy** do mcp-server após alterações no código.

---

## 6. Regra de atualização

- **Cursor (IA):** faz **commit + push** no GitHub após alterações.
- **Você (Fred):** faz **implantar** no EasyPanel o que foi enviado ao GitHub.

---

*Última atualização: 2026-02-26*

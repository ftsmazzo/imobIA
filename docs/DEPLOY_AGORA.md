# O que fazer agora para o Deploy

Você já criou os 3 serviços no EasyPanel. Siga estes passos para colocar tudo no ar.

---

## 1. Código no GitHub

O Projeto-X precisa estar em um repositório Git e o código enviado (push) para o GitHub, para o EasyPanel conseguir fazer o build.

### Se o repositório já existe no GitHub (vazio ou com README)

No terminal, na pasta do **Projeto-X**:

```bash
cd "c:\Users\anjo_\OneDrive\Projetos-FabriaIA\Projeto-X"

git init
git add .
git commit -m "chore: estrutura inicial backend, frontend, mcp-server e Dockerfiles"

git remote add origin https://github.com/SEU_USUARIO/NOME_DO_REPO.git
git branch -M main
git push -u origin main
```

Substitua `SEU_USUARIO` e `NOME_DO_REPO` pela URL do seu repositório.

### Se ainda não criou o repositório

1. No GitHub, crie um repositório novo (ex.: `plataforma-imobiliaria`).
2. **Não** marque “Initialize with README” se quiser manter o histórico limpo, ou marque (o primeiro push pode precisar de `git pull origin main --rebase` antes do push).
3. Depois rode os comandos acima com a URL do repositório que você criou.

---

## 2. PostgreSQL no EasyPanel

- Se ainda **não** tiver um serviço PostgreSQL no mesmo projeto do EasyPanel, crie um (ex.: imagem `postgres:16-alpine`).
- Anote:
  - **Host interno** (nome do serviço, ex.: `postgres`)
  - **Porta** (ex.: `5432`)
  - **Usuário** (ex.: `postgres`)
  - **Senha** (a que você definiu)
  - **Nome do banco** (ex.: `plataforma_imobiliaria` — crie o banco se a imagem não criar automaticamente)

A **connection string** do backend será:

```
postgresql://USUARIO:SENHA@HOST:5432/NOME_DO_BANCO
```

Exemplo: `postgresql://postgres:minhasenha@postgres:5432/plataforma_imobiliaria`

---

## 3. Variáveis de ambiente no EasyPanel

Configure em cada serviço (conforme **[ENV.md](./ENV.md)**).

### Serviço **backend**

| Nome           | Valor                                                                 |
|----------------|-----------------------------------------------------------------------|
| `DATABASE_URL` | `postgresql://USUARIO:SENHA@postgres:5432/plataforma_imobiliaria`     |
| `PORT`         | `3000` (opcional; padrão 3000)                                        |
| `NODE_ENV`     | `production` (opcional)                                               |

### Serviço **frontend**

O frontend precisa da URL do backend **no momento do build** (não em runtime).

- Tipo: **Build argument** / **Build-time variable** (ou equivalente no EasyPanel).
- Nome: `VITE_API_URL`
- Valor: URL que o **navegador** usará para acessar o backend, por exemplo:
  - Se o backend tiver domínio: `https://api.seudominio.com`
  - Se for pelo próprio EasyPanel (subdomínio): a URL do serviço backend que você expõe (ex.: `https://backend.seudominio.com`).

Sem isso o frontend não consegue chamar a API.

### Serviço **mcp-server**

- Nenhuma variável obrigatória.
- Opcional: `PORT=8000` se quiser deixar explícito.

---

## 4. Configuração de cada serviço no EasyPanel

Para **cada um dos 3 serviços** (backend, frontend, mcp-server), confira:

- **Repositório:** apontando para o mesmo repo do GitHub (com o código já em `main`).
- **Branch:** `main` (ou a que você usar).
- **Build context / Pasta:** a pasta do serviço (`backend`, `frontend`, `mcp-server`), para o Docker achar os arquivos.
- **Dockerfile:** `Dockerfile` (dentro da pasta do serviço) ou caminho relativo à raiz, ex.: `backend/Dockerfile`.
- **Porta:** backend **3000**, frontend **80**, mcp-server **8000**.

Salve e faça o **Deploy** (ou “Build and deploy”) de cada um.

---

## 5. Ordem recomendada

1. **PostgreSQL** — subir primeiro (se for no EasyPanel).
2. **Backend** — subir com `DATABASE_URL`; schema e seed rodam sozinhos na implantação.
3. **Frontend** — build com `VITE_API_URL` e subir.
4. **MCP Server** — subir.

---

## 6. Banco de dados (automático)

O **backend** aplica o schema e o seed **automaticamente** ao subir. Não é necessário rodar migração nem seed em shell ou comando.

- Na **primeira** subida do container, o entrypoint executa `migrate.mjs` (aplica `scripts/schema.sql`) e em seguida `seed.mjs` (insere os planos Corretor e Imobiliária).
- Em subidas seguintes, o script é idempotente (tabelas já existem, planos já existem → nada é duplicado).

---

## 7. Conferir se está no ar

- **Backend:** abrir `https://seu-backend/api/health` → deve retornar `{"status":"ok",...}`.
- **Frontend:** abrir a URL do frontend → deve carregar a página e (se `VITE_API_URL` estiver certo) mostrar “Backend: OK”.
- **MCP Server:** porta 8000 exposta; pode testar depois com um cliente MCP.

---

## Resumo rápido

| O quê              | Onde / Como |
|--------------------|-------------|
| Código no GitHub   | `git init`, `git add .`, `git commit`, `git remote add origin URL`, `git push -u origin main` |
| PostgreSQL         | Serviço no EasyPanel; anotar host, usuário, senha, nome do banco |
| Backend            | Variável `DATABASE_URL`; porta 3000; depois rodar schema + seed |
| Frontend           | Build arg `VITE_API_URL` = URL do backend; porta 80 |
| MCP Server         | Nada obrigatório; porta 8000 |
| Schema + seed      | Automático no startup do backend (nada a rodar em shell) |

Se algo falhar no build ou no deploy, confira os **logs** do serviço no EasyPanel (build e runtime).

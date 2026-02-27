# Visão da Plataforma — Base MCP + Apps Nichados

> Documento de estratégia e escopo. Expande o Projeto Agentes MCP com a ideia de uma **plataforma** operando no ramo imobiliário (e depois outros nichos), reutilizando o melhor dos projetos existentes e tendo o **Agente MCP** como núcleo.

---

## 📋 Metadados

| Campo | Valor |
|-------|-------|
| **Documento** | Visão da Plataforma |
| **Criado** | 2026-02-23 |
| **Relacionado** | PROJECT.md (Agentes MCP) |
| **Status** | Proposta — decisão de escopo |

---

## 🎯 A ideia em uma frase

Construir uma **plataforma** com **base sólida** (Agente MCP + núcleo compartilhado) e **produtos correlacionados** que transformem o negócio do cliente — começando pelo **ramo imobiliário**, onde as ferramentas que já temos se reforçam; depois, se fizer sentido, lançar **apps nichados** para outros setores (beleza, nutrição/saúde, etc.).

---

## ✅ É viável?

**Sim.** Os motivos principais:

1. **Base técnica já pensada** — O PROJECT.md já define MCP + LangGraph como núcleo desacoplado. Isso é exatamente o que permite: uma base de “agente” e **módulos/tools** que podem ser combinados por produto (imobiliário, beleza, etc.).
2. **Ativos reutilizáveis** — Você já tem:
   - **Agentes-SaaS:** multi-tenant, provisionamento, Evolution, ChatWoot, N8N, créditos, Stripe, painéis admin/cliente.
   - **CRM-Imobliaria:** pipeline, contatos, imóveis, tarefas, site de imóveis, modelo de dados imobiliário.
   - **Devocionais:** disparos em massa, blindagem, listas, tags, devocional/marketing, detecção de intenção + IA.
   - **Agente-Instagram:** fluxos N8N para Instagram (útil se o produto imobiliário quiser canal Instagram).
3. **Imobiliário como primeiro nicho faz sentido** — No imobiliário, tudo se conecta: **atendimento (agente)** + **CRM (leads, imóveis, visitas)** + **disparos (marketing/visitas)** + **site de imóveis**. Um único ecossistema entrega valor alto. Outros nichos podem esperar até a base + imobiliário estarem sólidos.
4. **Modelo “base + apps” já discutido** — No Agentes-SaaS (DISCUSSAO_REDIRECIONAMENTO_IMOBILIARIAS) já está desenhado: **core** (auth, tenants, planos, Evolution, ChatWoot, tools genéricas) + **app por vertical** (imobiliária, beleza, etc.) com tema e regras específicas. A diferença aqui é que a **base** passa a ser **Agente MCP** (LangGraph + MCP), não só N8N.

**Risco principal:** tentar fazer base + vários nichos ao mesmo tempo. Por isso a recomendação é **focar primeiro em base + imobiliário**.

---

## 🏗 Arquitetura alvo: Base + App Imobiliário

### Camada 1 — Núcleo (Agente MCP)

O que já está no PROJECT.md, como coração da plataforma:

- **Backend do agente:** LangGraph, recebendo mensagens (Evolution/ChatWoot), usando **tools via MCP**.
- **MCP Server:** FastMCP (Python), expondo tools que o agente chama (buscar imóveis, consultar agenda, RAG, etc.).
- **Canal:** WhatsApp via Evolution API + ChatWoot.
- **Persistência:** PostgreSQL (memória de conversa, estado), Redis se necessário (filas/cache).
- **Agentes como dados:** configuração no banco (persona, prompt, quais tools usar), não hardcoded.

Esse núcleo é **agnóstico de nicho**: as tools é que são “imobiliárias”, “beleza”, etc.

### Camada 2 — Módulos da plataforma (reuso dos projetos)

Não reescrever do zero. Extrair/conectar **módulos** dos projetos existentes e encaixá-los na plataforma:

| Módulo | Origem principal | O que aporta para a plataforma |
|--------|-------------------|----------------------------------|
| **Multi-tenant, auth, planos, Stripe** | Agentes-SaaS | Tenants, assinaturas, limites, billing. |
| **Provisionamento Evolution + ChatWoot** | Agentes-SaaS | Criar/conectar instância e inbox por agente/cliente. |
| **Créditos e consumo** | Agentes-SaaS | Controle de uso por plano/tenant. |
| **Disparos em massa + blindagem** | Devocionais | Campanhas marketing, listas, tags, delays, rotação, health check. |
| **Contatos, listas, tags** | Devocionais | Base para leads e segmentação (imobiliário e outros). |
| **Pipeline, imóveis, contatos, tarefas** | CRM-Imobliaria | CRM imobiliário: Kanban, imóveis, fotos, leads, tarefas. |
| **Site de imóveis** | CRM-Imobliaria | Vitrine pública e captação de leads. |
| **Detecção de intenção + IA** | Devocionais | Resposta a disparos (ex.: “quero saber mais”) → encaminhar para o agente ou fluxo. |
| **Automação Instagram** | Agente-Instagram | Canal extra (opcional) para o app imobiliário. |

A ideia é que a **plataforma** tenha um **backend único** (ou conjunto de serviços bem definidos) que incorpore esses módulos; o **Agente MCP** usa tools que falam com esse backend (ex.: “listar imóveis”, “registrar visita”, “consultar lead”).

### Camada 3 — Tools MCP “Imobiliário”

O MCP Server expõe tools que o agente usa no dia a dia. No app imobiliário, exemplos:

- **Imóveis:** buscar por bairro, tipo, faixa de preço; detalhe do imóvel.
- **Agenda:** horários disponíveis para visita; agendar visita.
- **Leads/CRM:** buscar contato; registrar interesse; criar tarefa.
- **RAG/Base de conhecimento:** FAQ da imobiliária, políticas, bairros.
- **Disparos (opcional):** disparar campanha para uma lista (chamando o módulo de disparos da plataforma).

Assim, o **mesmo núcleo** (LangGraph + MCP) serve qualquer nicho; mudam as **tools** e o **front (app)**.

### Camada 4 — Apps (nichos)

- **App Imobiliário (primeiro):** painel do cliente com: configuração do agente, CRM (pipeline, imóveis, contatos, tarefas), disparos (marketing/visitas), site de imóveis, relatórios. Tudo integrado ao agente via MCP.
- **Apps futuros (beleza, nutrição/saúde, etc.):** mesma base (tenant, agente, planos, Evolution, ChatWoot), mesmo padrão de “tools MCP + painel temático”. Não precisa definir agora; a base deve ser desenhada para que um novo app seja “novo conjunto de tools + novo tema de painel”.

---

## 📐 Estratégia recomendada: Base sólida + Imobiliário primeiro

1. **Focar em um nicho no início**  
   Fazer **só imobiliário** até a plataforma estar estável e vendável. No imobiliário, todas as peças (agente, CRM, disparos, site) se correlacionam e potencializam o produto.

2. **Desenhar a base para múltiplos nichos, mas implementar um**  
   - Modelo de dados e APIs pensados para “tenant + agente + módulos” genéricos.  
   - Primeira implementação concreta: **tools MCP + front 100% imobiliário**.  
   - Beleza, nutrição etc. entram depois como novos “apps” (novas tools + novo tema de painel).

3. **Reaproveitar, não reescrever**  
   - Onde der, **adaptar e integrar** (Agentes-SaaS, Devocionais, CRM-Imobliaria) em vez de recodar tudo.  
   - O que for **novo** é principalmente: **backend LangGraph + MCP**, **MCP Server** com tools imobiliárias, e **unificação** (um painel, um banco, um fluxo de provisionamento).

4. **Manter a regra de execução**  
   Cursor: commit + push. Fred: deploy no EasyPanel. Repos e serviços evoluem a partir do que está no PROJECT.md e neste documento.

---

## 🔀 Duas formas de “remodelar” o projeto

### Opção A — Projeto novo (recomendado para evitar misturar escopos)

- **Projeto-X** vira o guarda-chuva da **plataforma** (base MCP + app imobiliário).
- Novos repos: por exemplo `plataforma-backend` (LangGraph + API + webhooks), `plataforma-mcp-server` (FastMCP + tools), `plataforma-frontend` (admin + app imobiliário).
- Código dos outros projetos (Agentes-SaaS, CRM, Devocionais) é **referência e fonte de módulos**: trechos são migrados/adaptados para a nova base, não “misturados” no mesmo repo antigo.
- **Vantagem:** escopo claro, histórico limpo, menos risco de quebrar o que já funciona hoje (Agentes-SaaS, Devocionais) em produção.

### Opção B — Evoluir um projeto existente

- Por exemplo, **Agentes-SaaS** recebe: troca de orquestração (N8N → LangGraph + MCP), integração com “módulos” tipo CRM e disparos (inspirados no CRM-Imobliaria e no Devocionais).
- **Vantagem:** um único codebase. **Desvantagem:** refatoração grande, risco de regressão, e o Agentes-SaaS hoje já é “genérico”; misturar imobiliário dentro dele pode ficar confuso sem uma camada clara de “app”.

**Recomendação:** **Opção A** — tratar a plataforma como **projeto novo** (Projeto-X como referência de documentação e escopo), reutilizando **conceitos e código** dos outros projetos de forma planejada (módulos, tabelas, fluxos).

---

## 📅 Fases sugeridas (remodeladas)

### Fase 0 — Decisão e desenho (atual)
- [ ] Definir: projeto novo (Opção A) vs evoluir existente (Opção B).
- [ ] Listar módulos a “puxar” de cada projeto (tabela acima é o início).
- [ ] Desenhar modelo de dados unificado (tenant, agente, planos, imóveis, contatos, disparos, etc.) e APIs principais.
- [ ] Documentar no Projeto-X: repos, serviços EasyPanel, e como o MCP Server se conecta ao backend.

### Fase 1 — Base MCP + MVP atendimento imobiliário
- [ ] MCP Server (FastMCP) com tools mínimas imobiliárias (ex.: listar imóveis, buscar contato).
- [ ] Backend com LangGraph, webhook Evolution/ChatWoot, memória em PostgreSQL.
- [ ] Um fluxo completo: mensagem WhatsApp → agente → tools MCP → resposta.
- [ ] (Opcional) Integração mínima com um subconjunto do CRM (ex.: só imóveis + contatos) para as tools usarem.

### Fase 2 — Plataforma: tenant, planos, painel
- [ ] Multi-tenant, auth, planos (reuso/adaptação do Agentes-SaaS).
- [ ] Provisionamento Evolution + ChatWoot por agente/tenant.
- [ ] Painel do cliente: configurar agente (prompt, tools), conectar WhatsApp, ver conversas.
- [ ] Se fizer sentido já neste estágio: **créditos** e consumo (reuso Agentes-SaaS).

### Fase 3 — App Imobiliário completo
- [ ] CRM imobiliário no painel (pipeline, imóveis, contatos, tarefas) — reuso/adaptação CRM-Imobliaria.
- [ ] Tools MCP completas: imóveis, agenda, leads, RAG.
- [ ] Disparos (marketing/visitas) com blindagem — reuso/adaptação Devocionais.
- [ ] Site de imóveis (vitrine + leads) — reuso/adaptação CRM-Imobliaria.
- [ ] Detecção de intenção em disparos → encaminhar para o agente.

### Fase 4 — Escala e outros nichos (futuro)
- [ ] Billing (Stripe), onboarding, métricas.
- [ ] Desenhar “app Beleza” ou “app Nutrição/Saúde” como próximo conjunto de tools + tema, sem refazer a base.

---

## 📜 Regras de negócio (ampliadas)

1. **Agentes como dados** — definidos em banco; persona, prompt e tools configuráveis.
2. **MCP como contrato** — todas as capacidades “externas” do agente vêm de tools MCP; a base não acopla a um nicho.
3. **Base agnóstica, apps nichados** — a plataforma oferece tenant, agente, planos, canal (WhatsApp); cada **app** (imobiliário, beleza, etc.) traz suas **tools** e seu **painel**.
4. **Imobiliário primeiro** — primeiro produto completo é o app imobiliário; outros nichos só depois de validado.
5. **Reuso sobre reescrita** — sempre que possível, adaptar módulos dos projetos existentes em vez de reimplementar.
6. **Um documento, versionado** — PROJECT.md + este PLATAFORMA_VISAO.md como referência única de escopo e decisões.

---

## 📂 Estrutura de repositórios (proposta, Opção A)

| Repo | Conteúdo |
|------|----------|
| **Projeto-X** (doc) | PROJECT.md, PLATAFORMA_VISAO.md, decisões, histórico. |
| **plataforma-mcp-server** | Servidor MCP (FastMCP), tools por nicho (imobiliário primeiro). |
| **plataforma-backend** | LangGraph, API, webhooks, tenant/agente/planos, integração CRM/disparos (módulos). |
| **plataforma-frontend** | Painel admin + app imobiliário (e depois outros apps). |

Ou manter os nomes do PROJECT.md (`agentes-mcp-server`, `agentes-mcp-backend`, `agentes-mcp-frontend`) e tratar como “plataforma” na documentação — o importante é o **conteúdo** (base MCP + app imobiliário), não o nome do repo.

---

## 📝 Histórico de alterações (este documento)

| Data | Alteração |
|------|-----------|
| 2026-02-23 | Criação do documento. Visão da plataforma, viabilidade, reuso dos projetos (Agentes-SaaS, CRM-Imobliaria, Devocionais, Agente-Instagram), estratégia base + imobiliário primeiro, opções de remodelação, fases sugeridas. |

---

*Última atualização: 2026-02-23*

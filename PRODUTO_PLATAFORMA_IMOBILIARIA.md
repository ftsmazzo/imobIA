# Produto: Plataforma Imobiliária

> Definição do produto, regra imutável de desenvolvimento, módulos, público e sugestões de escopo. **Todo o código e evolução do produto ficam no Projeto-X.** Os demais projetos no workspace são apenas referência para reaplicar conceitos e lógica.

---

## ⚠️ REGRA IMUTÁVEL

| Regra | Descrição |
|-------|-----------|
| **Projeto único** | O **Projeto-X** é o nosso projeto. Todo código novo, alterações e evolução da Plataforma Imobiliária são feitos **apenas** nos repositórios e pastas do Projeto-X. |
| **Outros projetos = referência** | As pastas **Agentes-SaaS**, **CRM-Imobliaria**, **Devocionais** e **Agente-Instagram** foram incluídas no workspace para **conhecer e poder replicar**. |
| **Nenhuma alteração fora do Projeto-X** | **Nada deve ser alterado no código** desses projetos. Eles permanecem como estão. |
| **Reaplicar, não modificar** | Tudo que for útil nesses projetos deve ser **reaplicado** no Projeto-X: conceitos, fluxos, estruturas de dados e lógica de negócio são **reimplementados ou adaptados** dentro do Projeto-X, sem editar os projetos de origem. |

*Esta regra não será repetida em outros documentos do Projeto-X. É a base de todo desenvolvimento.*

---

## 📋 Metadados do documento

| Campo | Valor |
|-------|-------|
| **Produto** | Plataforma Imobiliária |
| **Criado** | 2026-02-23 |
| **Relacionado** | PROJECT.md, PLATAFORMA_VISAO.md |
| **Status** | Definição de produto e escopo |

---

## 🎯 Visão do produto

Uma **plataforma imobiliária** pensada para **imobiliárias e corretores**, com:

- **Acessibilidade** — Planos que incluam todo tipo de público (corretor autônomo, imobiliária pequena, rede).
- **Ferramentas integradas** — CRM, site, disparos, redes sociais e agente de IA trabalhando em conjunto.
- **Agente MCP no centro** — Atendimento via WhatsApp (e, no fluxo, conexão com Instagram) apoiado em LangGraph + MCP, com tools imobiliárias (imóveis, agenda, leads, qualificação).

O diferencial é o **ecossistema unificado**: desde a publicação de um imóvel ou empreendimento até o agendamento de visita e qualificação do lead, tudo conversando por **tags**, **listas** e **qualificação**, com o agente conduzindo a conversa e a operação no CRM.

---

## 👥 Público-alvo

| Perfil | Necessidade | Exemplo de plano |
|--------|-------------|-------------------|
| **Corretor autônomo** | CRM leve, site simples, um número WhatsApp, disparos controlados, agente único. | Plano Corretor |
| **Imobiliária pequena** | Vários corretores, pipeline compartilhado, site + Instagram + disparos, um ou mais agentes. | Plano Imobiliária |
| **Rede / franquia** | Multi-unidades, relatórios consolidados, marca única ou white-label. | Plano Enterprise (futuro) |

Planos devem ser **claros e escaláveis**: recursos (imóveis, leads, disparos, agentes) por faixa de preço, para que qualquer perfil encontre um plano adequado.

---

## 🧩 Módulos do produto

Cada módulo é **desenvolvido no Projeto-X**. Onde houver referência a outro projeto, a implementação é **reaplicada** (inspirada no referencial, sem alterar o projeto de origem).

### 1. CRM Imobiliário

**O que é:** Ferramentas de CRM para administrar **imóveis**, **contatos/leads**, **tarefas** e **negociações**.

**Funcionalidades principais (referência: CRM-Imobliaria — reaplicar no Projeto-X):**

- Cadastro de **imóveis** (fotos, endereço, tipo, valor, status, descrição).
- **Contatos e leads** (nome, telefone, e-mail, origem, interesses, histórico).
- **Pipeline / Kanban** (etapas: lead → qualificado → visita agendada → proposta → fechamento).
- **Tarefas e atividades** (ligar, visitar, enviar proposta, follow-up) vinculadas a contatos e imóveis.
- **Vínculo lead ↔ imóvel** (interesse em imóvel X, visita ao imóvel Y).
- Permissões por perfil (corretor vs gestor vs admin), quando houver mais de um usuário.

**Entregável:** Painel web no Projeto-X com todas as facilidades do CRM para gestão de imóveis e leads.

---

### 2. Site (template com um clique)

**O que é:** **Site de imóveis** criado e configurado a partir de um **template básico**, com **um clique** (ou fluxo guiado mínimo).

**Funcionalidades principais (referência: CRM-Imobliaria / site-imoveis — reaplicar no Projeto-X):**

- Escolha de template (inicialmente um template básico).
- Configuração: nome da imobiliária, cores, logo, contato/WhatsApp.
- Listagem de imóveis (dados do CRM).
- Página de detalhe do imóvel (fotos, descrição, botão “Fale no WhatsApp”).
- Formulário ou botão de lead (captura para o CRM).
- Domínio próprio ou subdomínio (ex.: `minhaimobiliaria.plataforma.com`) conforme plano.

**Entregável:** Geração e publicação do site a partir do CRM, sem precisar codar; dados do CRM alimentam o site.

---

### 3. Publicação automática no Instagram

**O que é:** Estrutura **web** para **publicação automática no Instagram**, usando como base as automações do **Agente-Instagram** (referência: reaplicar lógica e fluxos no Projeto-X).

**Funcionalidades principais:**

- **Vínculo com o CRM:** Imóveis e empreendimentos cadastrados no CRM podem ser selecionados para virar post.
- **Conteúdo da postagem:** Fotos e dados do imóvel (título, valor, bairro, link) formatados para Instagram (feed ou stories).
- **Agendamento ou fila:** Publicar em data/hora ou em sequência (ex.: um imóvel por dia).
- **Rastreamento:** Registrar qual imóvel foi publicado quando; opcional: link/campanha para associar leads ao post.

**Entregável:** No painel da plataforma, o usuário escolhe imóveis do CRM e configura publicações automáticas no Instagram, sem depender apenas de N8N externo; a lógica é parte do Projeto-X (API + worker ou integração com serviço de publicação).

---

### 4. Disparos (massivos) + Tags + Qualificação de leads

**O que é:** Uso da **potencialidade dos disparos** e todas as suas características (referência: Devocionais — reaplicar no Projeto-X) para o contexto imobiliário.

**Funcionalidades principais:**

- **Disparos por contexto:** Novos imóveis postados, lançamento de empreendimentos, campanhas por bairro ou faixa de preço, lembretes de visita, follow-up pós-visita.
- **Listas e segmentação:** Listas estáticas e dinâmicas com **TAGs** (ex.: “interesse-aluguel”, “visitou-empreendimento-x”, “lead-quente”).
- **Integração com qualificação:** Tags atualizadas conforme resposta (ex.: “quero saber mais” → tag “lead-quente”; “não tenho interesse” → tag “não-qualificado”). Pontuação ou estágio do lead no pipeline podem ser atualizados a partir do disparo e da resposta.
- **Blindagem:** Delays, limites por hora/dia, rotação de instâncias (referência: Devocionais — reaplicar).
- **Detecção de intenção:** Respostas positivas aos disparos podem acionar o **agente no WhatsApp** ou registrar ação no CRM (tarefa, mudança de etapa).

**Entregável:** Módulo de disparos dentro do Projeto-X, com tags e qualificação integrados ao CRM e ao agente.

---

### 5. Agente nas postagens (Instagram) → condução para WhatsApp

**O que é:** **Agente que interage com as postagens** (comentários, DMs no Instagram) e **conduz o contato para o WhatsApp**.

**Funcionalidades principais:**

- Respostas automáticas a comentários (ex.: “Chame no WhatsApp para mais informações: [link]”).
- Resposta a DMs no Instagram com mensagem padrão + link/numero WhatsApp.
- Opcional: breve qualificação por DM (tipo de imóvel, região) antes de enviar o link.
- Registro no CRM: lead originado “Instagram” + post/imóvel de interesse (quando houver dado disponível).

**Entregável:** Fluxo (no Projeto-X) que conecta interação em postagem ao CRM e ao canal WhatsApp; pode usar integração com Meta/Instagram + Evolution ou serviço equivalente.

---

### 6. Agente no WhatsApp (MCP + LangGraph)

**O que é:** **Agente de IA** no WhatsApp que pode ser **criado e configurado** para a imobiliária ou para o corretor, com **tools MCP** imobiliárias.

**Funcionalidades principais (núcleo do PROJECT.md + PLATAFORMA_VISAO — implementar no Projeto-X):**

- **Interagir** com o lead em linguagem natural.
- **Apresentar imóveis:** buscar no CRM por bairro, tipo, faixa de preço e enviar resumos/fotos/link.
- **Quebrar objeções:** respostas guiadas por persona e base de conhecimento (RAG).
- **Prospectar e qualificar:** perguntas curtas, registro de interesse e atualização de tags/etapa no CRM.
- **Agendar visitas:** consultar disponibilidade (agenda) e registrar visita no CRM; notificar corretor/imobiliária.
- **Configurável por cliente:** um agente por imobiliária ou por corretor; prompt e tools definidos no painel (dados no banco).
- **Canal:** Evolution API + ChatWoot (referência: Agentes-SaaS — reaplicar provisionamento e fluxo no Projeto-X).

**Entregável:** Backend LangGraph + MCP Server (FastMCP) no Projeto-X, com tools de imóveis, agenda, leads e RAG; atendimento completo no WhatsApp integrado ao CRM e aos disparos.

---

## 🔗 Como os módulos se conectam

```
[CRM] ←→ Imóveis, Contatos, Pipeline, Tarefas
   ↑
   │ alimenta
   ▼
[Site] ← Template 1 clique, listagem e detalhe de imóveis, captação de leads
   ↑
   │ mesmo conteúdo
   ▼
[Instagram] ← Publicação automática a partir do CRM; agente responde comentários/DMs e conduz ao WhatsApp
   ↑
   │ leads + tags
   ▼
[Disparos] ← Campanhas (novos imóveis, empreendimentos, tags); qualificação por resposta; blindagem
   ↑
   │ intenção / encaminhamento
   ▼
[Agente WhatsApp] ← Apresenta imóveis, agenda visitas, qualifica, quebra objeções; tools MCP (CRM, agenda, RAG)
   ↑
   └── Tudo registrado e qualificado no [CRM]
```

- **Tags** e **listas** são o fio condutor: disparo marca lead com tag → agente e CRM usam a mesma tag para segmentação e próximos passos.
- **Qualificação** é única: feita por disparo (resposta), por agente (conversa) e por uso do CRM (etapa no pipeline), tudo no mesmo banco do Projeto-X.

---

## 💡 Sugestões adicionais (escopo profissional)

### 1. Pipeline e qualificação unificados

- **Pipeline único** no CRM (lead → qualificado → visita → proposta → fechamento) com possibilidade de etapas customizáveis por imobiliária.
- **Lead scoring** simples (ex.: pontos por abrir disparo, responder, pedir visita) atualizado por disparos e pelo agente; exibição no CRM.
- **Tags** como complemento ao pipeline (ex.: “interesse-aluguel”, “empreendimento-x”) para filtros e disparos.

### 2. Planos por perfil

- **Corretor:** 1 usuário, X imóveis, Y leads, Z disparos/mês, 1 agente WhatsApp, 1 site.
- **Imobiliária:** N usuários (corretores), mais imóveis/leads/disparos, 1 ou mais agentes, site, opção de Instagram.
- **Enterprise:** Multi-unidades, relatórios, white-label (futuro).

Preços e limites devem ser definidos em produto; a arquitetura deve suportar limites por tenant/plano.

### 3. Dashboard único

- **Um painel** onde o corretor ou a imobiliária vê: imóveis em destaque, leads recentes, visitas do dia, desempenho de disparos, conversas ativas no WhatsApp.
- Métricas simples: leads por origem (site, Instagram, disparo, WhatsApp), taxa de visita agendada, imóveis mais visualizados.

### 4. LGPD e consentimento

- **Opt-in** explícito para disparos (armazenar data e origem).
- **Opt-out** em toda mensagem de disparo e fácil no WhatsApp (ex.: “digite SAIR”).
- Campos no CRM para consentimento e preferência de canal; relatório básico de base para campanhas (quem pode receber disparo).

### 5. API e webhooks (fase posterior)

- **API** para listar/criar imóveis, contatos e tarefas (integração com portais ou outros sistemas).
- **Webhooks** para eventos (novo lead, visita agendada, etapa alterada) para integrações e automações externas.

### 6. Agenda de visitas

- **Agenda** no backend (referência: PLATAFORMA_VISAO — agenda própria no banco): horários disponíveis por corretor ou por imobiliária; o agente consulta e agenda; o CRM exibe e permite reagendar/cancelar.

---

## 📐 Princípios de arquitetura (Projeto-X)

1. **Um código, um produto** — Toda a Plataforma Imobiliária vive no Projeto-X (repos: backend, MCP server, frontend, conforme definido no PROJECT.md e na PLATAFORMA_VISAO).
2. **Referência sem alteração** — Nenhuma alteração em Agentes-SaaS, CRM-Imobliaria, Devocionais, Agente-Instagram; apenas leitura e reaplicação no Projeto-X.
3. **Agente MCP no centro** — LangGraph + MCP com tools imobiliárias (imóveis, agenda, leads, RAG); Evolution + ChatWoot para WhatsApp.
4. **Dados unificados** — Um modelo de dados (tenant, usuários, imóveis, contatos, pipeline, disparos, tags, conversas) no Projeto-X; CRM, site, disparos e agente consomem o mesmo banco.
5. **Escalável por plano** — Limites (imóveis, leads, disparos, agentes, usuários) por plano; billing (Stripe ou outro) em fase posterior.

---

## 📅 Fases sugeridas (visão de alto nível)

| Fase | Foco | Entregas principais |
|------|------|----------------------|
| **0** | Decisão e desenho | Modelo de dados unificado, lista de endpoints, definição de repos e serviços (Projeto-X). |
| **1** | Núcleo MCP + CRM mínimo | Backend + MCP Server com tools imobiliárias básicas; CRM (imóveis, contatos, pipeline); agente WhatsApp funcionando. |
| **2** | Site + Disparos | Site template 1 clique; módulo de disparos com tags e blindagem; integração disparo → qualificação no CRM. |
| **3** | Instagram + Agente postagens | Publicação automática Instagram a partir do CRM; agente nas postagens conduzindo para WhatsApp. |
| **4** | Planos, dashboard e polish | Planos e limites; dashboard; LGPD (opt-in/opt-out); API/webhooks (se escopo aprovado). |

---

## 📝 Histórico de alterações (este documento)

| Data | Alteração |
|------|-----------|
| 2026-02-23 | Criação do documento. Regra imutável (Projeto-X único; outros projetos referência; reaplicar sem alterar). Visão do produto, público, 6 módulos (CRM, Site, Instagram, Disparos, Agente postagens, Agente WhatsApp), conexão entre módulos, sugestões (pipeline, planos, dashboard, LGPD, API, agenda), princípios de arquitetura e fases sugeridas. |

---

*Última atualização: 2026-02-23*

# MCP Server — Plataforma Imobiliária

Servidor MCP (FastMCP) com **tools imobiliárias**. Chamado pelo backend/agente. Todo código aqui faz parte do **Projeto-X**.

## Responsabilidade

- Expor tools via MCP: buscar imóveis, buscar contato, agendar visita, RAG (base de conhecimento)
- Ser invocado pelo backend (LangGraph) quando o agente precisar de dados ou ações

## Stack prevista

- Python 3.11+
- FastMCP

## Tools (escopo Fase 1)

- `search_properties` — filtros (bairro, tipo, faixa de preço)
- `get_property` — detalhe de um imóvel
- `get_contact` — dados de um contato/lead
- `schedule_visit` — registrar visita agendada (contato + imóvel + data)
- (Futuro) RAG: consultar base de conhecimento da imobiliária

## Desenho

Ver `../docs/DESENHO_FASE_0.md`.

## Como iniciar desenvolvimento

```bash
cd mcp-server
pip install -r requirements.txt
python server.py
# Servidor HTTP em http://0.0.0.0:8000
```

## Docker

```bash
docker build -t mcp-server .
docker run -p 8000:8000 mcp-server
```

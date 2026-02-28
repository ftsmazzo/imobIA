# MCP Server — Plataforma Imobiliária
# Servidor de tools para o agente. HTTP na porta 8000.
# Contexto: raiz do repo (EasyPanel). Caminhos com prefixo mcp-server/

FROM python:3.12-slim

WORKDIR /app

COPY mcp-server/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY mcp-server/server.py ./
COPY mcp-server/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENV PORT=8000
EXPOSE 8000

# Uvicorn como processo principal (PID 1) via entrypoint; PORT lido do ambiente
ENTRYPOINT ["/entrypoint.sh"]

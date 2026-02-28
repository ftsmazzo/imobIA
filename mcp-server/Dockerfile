# MCP Server — Plataforma Imobiliária
# Contexto: raiz do repo (EasyPanel). Caminhos com prefixo mcp-server/

FROM python:3.12-slim

WORKDIR /app

COPY mcp-server/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY mcp-server/server.py ./

ENV PORT=8000
EXPOSE 8000

# Processo único: python server.py (uvicorn roda dentro, bloqueia). -u = stdout sem buffer.
CMD ["python", "-u", "server.py"]

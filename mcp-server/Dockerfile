# MCP Server — Plataforma Imobiliária
# Contexto: raiz do repo (EasyPanel). Caminhos com prefixo mcp-server/

FROM python:3.12-slim

WORKDIR /app

COPY mcp-server/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY mcp-server/server.py ./

ENV PORT=8000
EXPOSE 8000

# Docker: start-period 40s = não falhar nos primeiros 40s; depois GET / a cada 30s
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD ["python", "-c", "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/')"]

CMD ["python", "-u", "server.py"]

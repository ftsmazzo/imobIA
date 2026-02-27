# MCP Server — Plataforma Imobiliária
# Servidor de tools para o agente. HTTP na porta 8000.

FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY server.py ./

ENV PORT=8000
EXPOSE 8000

CMD ["python", "server.py"]

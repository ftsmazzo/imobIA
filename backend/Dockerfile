# Backend — Plataforma Imobiliária
# Build e execução para EasyPanel / Docker
# Contexto: raiz do repo (EasyPanel). Caminhos com prefixo backend/

FROM node:22-alpine AS builder

WORKDIR /app

COPY backend/package.json backend/package-lock.json* ./
RUN npm ci 2>/dev/null || npm install

COPY backend/tsconfig.json ./
COPY backend/src ./src

RUN npm run build

# Imagem final
FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY backend/package.json backend/package-lock.json* ./
RUN npm ci --omit=dev 2>/dev/null || npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY backend/scripts ./scripts
RUN chmod +x scripts/entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/bin/sh", "scripts/entrypoint.sh"]

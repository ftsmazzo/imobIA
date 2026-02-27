#!/bin/sh
set -e
echo "[entrypoint] Aplicando schema..."
node scripts/migrate.mjs
echo "[entrypoint] Verificando seed..."
node scripts/seed.mjs
echo "[entrypoint] Iniciando servidor..."
exec node dist/index.js

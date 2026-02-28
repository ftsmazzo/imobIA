#!/bin/sh
# Gera config.js em runtime a partir da env (EasyPanel: variável de ambiente do container).
# Assim a URL do backend não precisa estar no build — só configurar no painel e reiniciar.
API_URL="${VITE_API_URL:-}"
# Remove barra final se existir
case "$API_URL" in */) API_URL="${API_URL%/)}" ;; esac
# Escapa aspas e backslash para uso dentro de string JS
API_URL_ESC=$(echo "$API_URL" | sed 's/\\/\\\\/g; s/"/\\"/g')
echo "window.__API_URL__=\"$API_URL_ESC\";" > /usr/share/nginx/html/config.js
exec nginx -g "daemon off;"

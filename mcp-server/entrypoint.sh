#!/bin/sh
# Uvicorn como processo principal; PORT vindo do ambiente (EasyPanel).
PORT="${PORT:-8000}"
exec uvicorn server:_asgi_app --host 0.0.0.0 --port "$PORT"

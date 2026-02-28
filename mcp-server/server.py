"""
MCP Server — Plataforma Imobiliária
Inicia em ~0.5s: responde GET / com 200 antes de carregar FastMCP.
FastMCP é carregado na primeira requisição POST /mcp (evita timeout de health check).
"""

import sys
import traceback
import warnings
warnings.filterwarnings("ignore", category=DeprecationWarning, module="websockets")

# Resposta de health (sem importar FastMCP ainda)
HEALTH_PATHS = frozenset({"/", "/health", "/healthz", "/ready", "/readyz"})
HEALTH_BODY = b"ok"
HEALTH_HEADERS = [[b"content-type", b"text/plain"], [b"content-length", b"2"]]

_mcp_asgi = None


def _get_mcp_app():
    global _mcp_asgi
    if _mcp_asgi is not None:
        return _mcp_asgi
    from fastmcp import FastMCP
    # stateless_http=True: aceita tools/call sem sessão (ideal para webhook/backend server-to-server)
    mcp = FastMCP("Plataforma Imobiliária MCP")

    @mcp.tool()
    def search_properties(neighborhood: str = "", property_type: str = "", max_value: float | None = None) -> str:
        return (
            f"Busca: bairro={neighborhood or 'qualquer'}, tipo={property_type or 'qualquer'}, "
            f"valor_max={max_value or 'não informado'}. Nenhum imóvel cadastrado ainda (conectar ao backend)."
        )

    @mcp.tool()
    def get_property(property_id: int) -> str:
        return f"Imóvel id={property_id}: detalhes não disponíveis (conectar ao backend)."

    _mcp_asgi = mcp.http_app(stateless_http=True)
    return _mcp_asgi


async def _send_health(send):
    await send({"type": "http.response.start", "status": 200, "headers": HEALTH_HEADERS})
    await send({"type": "http.response.body", "body": HEALTH_BODY})


async def _asgi_app(scope, receive, send):
    if scope.get("type") != "http":
        await _get_mcp_app()(scope, receive, send)
        return

    path = (scope.get("path") or "").split("?")[0].rstrip("/") or "/"
    method = scope.get("method", "")

    if path in HEALTH_PATHS and method == "GET":
        await _send_health(send)
        return

    # Garantir path=/mcp (FastMCP registra rota em /mcp)
    if path == "/mcp" or path == "mcp":
        scope = {**scope, "path": "/mcp"}

    try:
        await _get_mcp_app()(scope, receive, send)
    except Exception as e:
        traceback.print_exc()
        sys.stderr.flush()
        try:
            await send({"type": "http.response.start", "status": 500, "headers": [[b"content-type", b"text/plain"]]})
            await send({"type": "http.response.body", "body": b"Internal Server Error"})
        except Exception:
            pass


def main():
    import os
    import uvicorn
    port = int(os.environ.get("PORT", "8000"))
    print("MCP starting 0.0.0.0:%s (health ready)" % port, flush=True)
    sys.stdout.flush()
    uvicorn.run(_asgi_app, host="0.0.0.0", port=port, log_level="info")


if __name__ == "__main__":
    main()

"""
MCP Server — Plataforma Imobiliária
Tools imobiliárias para o backend. HTTP na porta PORT (default 8000).
Rotas GET /, /health, /healthz, /ready retornam 200 para health check.
"""

import sys
import warnings

# Evitar deprecation warnings do websockets que podem afetar algumas plataformas
warnings.filterwarnings("ignore", category=DeprecationWarning, module="websockets")

from fastmcp import FastMCP

mcp = FastMCP("Plataforma Imobiliária MCP")


@mcp.tool()
def search_properties(
    neighborhood: str = "",
    property_type: str = "",
    max_value: float | None = None,
) -> str:
    """Busca imóveis por bairro, tipo e valor máximo."""
    return (
        f"Busca: bairro={neighborhood or 'qualquer'}, tipo={property_type or 'qualquer'}, "
        f"valor_max={max_value or 'não informado'}. "
        "Nenhum imóvel cadastrado ainda (conectar ao backend)."
    )


@mcp.tool()
def get_property(property_id: int) -> str:
    """Retorna os detalhes de um imóvel pelo ID."""
    return f"Imóvel id={property_id}: detalhes não disponíveis (conectar ao backend)."


_mcp_asgi = mcp.http_app()

HEALTH_PATHS = frozenset({"/", "/health", "/healthz", "/ready", "/readyz"})
HEALTH_BODY = b"ok"
HEALTH_HEADERS = [[b"content-type", b"text/plain"], [b"content-length", str(len(HEALTH_BODY)).encode()]]


async def _send_health(send):
    await send({"type": "http.response.start", "status": 200, "headers": HEALTH_HEADERS})
    await send({"type": "http.response.body", "body": HEALTH_BODY})


async def _asgi_app(scope, receive, send):
    if scope.get("type") != "http":
        await _mcp_asgi(scope, receive, send)
        return

    path = (scope.get("path") or "").split("?")[0].rstrip("/") or "/"
    method = scope.get("method", "")

    if path in HEALTH_PATHS and method == "GET":
        await _send_health(send)
        return

    try:
        await _mcp_asgi(scope, receive, send)
    except Exception:
        await send({"type": "http.response.start", "status": 500, "headers": [[b"content-type", b"text/plain"]]})
        await send({"type": "http.response.body", "body": b"Internal Server Error"})


def main():
    import os
    import uvicorn

    port = int(os.environ.get("PORT", "8000"))
    # stdout unbuffered para o orchestrator ver que o processo iniciou
    print("MCP server starting on 0.0.0.0:%s" % port, flush=True)
    sys.stdout.flush()
    sys.stderr.flush()
    uvicorn.run(
        _asgi_app,
        host="0.0.0.0",
        port=port,
        log_level="info",
    )


if __name__ == "__main__":
    main()

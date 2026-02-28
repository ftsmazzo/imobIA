"""
MCP Server — Plataforma Imobiliária
Tools imobiliárias para o agente (LangGraph). Exposto via HTTP para o backend.
GET / e GET /health retornam 200 para health check (EasyPanel/load balancer).
"""

import os
from fastmcp import FastMCP

mcp = FastMCP("Plataforma Imobiliária MCP")


@mcp.tool()
def search_properties(
    neighborhood: str = "",
    property_type: str = "",
    max_value: float | None = None,
) -> str:
    """
    Busca imóveis por bairro, tipo e valor máximo.
    Retorna uma lista resumida de imóveis (em produção virá do banco/API).
    """
    return (
        f"Busca: bairro={neighborhood or 'qualquer'}, tipo={property_type or 'qualquer'}, "
        f"valor_max={max_value or 'não informado'}. "
        "Nenhum imóvel cadastrado ainda (conectar ao backend)."
    )


@mcp.tool()
def get_property(property_id: int) -> str:
    """
    Retorna os detalhes de um imóvel pelo ID.
    """
    return f"Imóvel id={property_id}: detalhes não disponíveis (conectar ao backend)."


# ASGI app do MCP (rota /mcp)
_mcp_asgi = mcp.http_app()


async def _health_response(send):
    await send({"type": "http.response.start", "status": 200, "headers": [[b"content-type", b"text/plain"]]})
    await send({"type": "http.response.body", "body": b"ok"})


async def _asgi_app(scope, receive, send):
    if scope.get("type") != "http":
        await _mcp_asgi(scope, receive, send)
        return
    path = scope.get("path", "")
    if path in ("/", "/health") and scope.get("method") == "GET":
        await _health_response(send)
        return
    await _mcp_asgi(scope, receive, send)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8000"))
    import uvicorn
    # 0.0.0.0 para aceitar conexões de outros containers; GET / e GET /health = 200 para health check
    uvicorn.run(_asgi_app, host="0.0.0.0", port=port)

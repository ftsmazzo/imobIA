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


def _backend_fetch(path: str, params: dict, key: str) -> tuple[int, dict | list]:
    """GET no backend interno. Retorna (status, body)."""
    import httpx
    base = (__import__("os").environ.get("BACKEND_API_URL") or "").rstrip("/")
    if not base or not key:
        return 0, {}
    url = f"{base}{path}"
    try:
        r = httpx.get(url, params=params, headers={"X-Internal-Key": key}, timeout=15.0)
        return r.status_code, r.json() if r.content else {}
    except Exception:
        return 0, {}


def _fmt_property(p: dict) -> str:
    """Formata um imóvel para texto."""
    title = p.get("title") or "Sem título"
    addr = p.get("addressNeighborhood") or p.get("addressCity") or ""
    if addr:
        addr = f" — {addr}"
    v_sale = p.get("valueSale")
    v_rent = p.get("valueRent")
    vals = []
    if v_sale and float(v_sale) > 0:
        vals.append(f"Venda R$ {float(v_sale):,.2f}".replace(",", "X").replace(".", ",").replace("X", "."))
    if v_rent and float(v_rent) > 0:
        vals.append(f"Aluguel R$ {float(v_rent):,.2f}".replace(",", "X").replace(".", ",").replace("X", "."))
    price = " | ".join(vals) if vals else ""
    return f"• {title}{addr} {price}".strip()


def _get_mcp_app():
    global _mcp_asgi
    if _mcp_asgi is not None:
        return _mcp_asgi
    import os
    from fastmcp import FastMCP

    backend_url = os.environ.get("BACKEND_API_URL", "").rstrip("/")
    internal_key = os.environ.get("BACKEND_INTERNAL_KEY", "")
    use_backend = bool(backend_url and internal_key)

    mcp = FastMCP("Plataforma Imobiliária MCP")

    @mcp.tool()
    def search_properties(
        tenant_id: int = 1,
        neighborhood: str = "",
        property_type: str = "",
        max_value: float | None = None,
    ) -> str:
        if not use_backend:
            return (
                f"Busca: bairro={neighborhood or 'qualquer'}, tipo={property_type or 'qualquer'}, "
                "valor_max=não informado. Backend não configurado (BACKEND_API_URL e BACKEND_INTERNAL_KEY)."
            )
        params = {"tenant_id": tenant_id, "limit": 15}
        if neighborhood:
            params["neighborhood"] = neighborhood
        if property_type:
            params["type"] = property_type
        if max_value is not None and max_value > 0:
            params["max_value"] = max_value
        status, data = _backend_fetch("/api/internal/properties", params, internal_key)
        if status != 200:
            return f"Erro ao buscar imóveis (status {status})."
        if not isinstance(data, list):
            return "Nenhum imóvel encontrado."
        if not data:
            return "Nenhum imóvel encontrado com os filtros informados."
        lines = [_fmt_property(p) for p in data]
        return "Imóveis encontrados:\n" + "\n".join(lines)

    @mcp.tool()
    def get_property(property_id: int, tenant_id: int = 1) -> str:
        if not use_backend:
            return f"Imóvel id={property_id}: Backend não configurado (BACKEND_API_URL e BACKEND_INTERNAL_KEY)."
        status, data = _backend_fetch(
            f"/api/internal/properties/{property_id}",
            {"tenant_id": tenant_id},
            internal_key,
        )
        if status == 404:
            return f"Imóvel {property_id} não encontrado."
        if status != 200 or not isinstance(data, dict):
            return f"Erro ao buscar imóvel (status {status})."
        p = data
        title = p.get("title") or "Sem título"
        desc = (p.get("description") or "").strip() or "Sem descrição."
        addr_parts = [
            p.get("addressStreet"),
            p.get("addressNumber"),
            p.get("addressNeighborhood"),
            p.get("addressCity"),
            p.get("addressState"),
        ]
        addr = ", ".join(str(x) for x in addr_parts if x)
        v_sale = p.get("valueSale")
        v_rent = p.get("valueRent")
        vals = []
        if v_sale and float(v_sale) > 0:
            vals.append(f"Venda: R$ {float(v_sale):,.2f}".replace(",", "X").replace(".", ",").replace("X", "."))
        if v_rent and float(v_rent) > 0:
            vals.append(f"Aluguel: R$ {float(v_rent):,.2f}".replace(",", "X").replace(".", ",").replace("X", "."))
        price = "\n".join(vals) if vals else "Valor não informado."
        rooms = []
        if p.get("bedrooms"):
            rooms.append(f"{p['bedrooms']} quartos")
        if p.get("bathrooms"):
            rooms.append(f"{p['bathrooms']} banheiros")
        if p.get("parkingSpaces"):
            rooms.append(f"{p['parkingSpaces']} vagas")
        if p.get("areaM2"):
            rooms.append(f"{float(p['areaM2']):.0f} m²")
        extra = " | ".join(rooms) if rooms else ""
        return f"{title}\n\n{desc}\n\nEndereço: {addr or 'Não informado'}\n{price}\n{extra}".strip()

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

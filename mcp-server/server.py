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


def _backend_post(path: str, json_body: dict, key: str) -> tuple[int, dict | list]:
    """POST no backend interno. Retorna (status, body)."""
    import httpx
    base = (__import__("os").environ.get("BACKEND_API_URL") or "").rstrip("/")
    if not base or not key:
        return 0, {}
    url = f"{base}{path}"
    try:
        r = httpx.post(url, json=json_body, headers={"X-Internal-Key": key}, timeout=15.0)
        return r.status_code, r.json() if r.content else {}
    except Exception:
        return 0, {}


def _backend_patch(path: str, json_body: dict, key: str) -> tuple[int, dict | list]:
    """PATCH no backend interno. Retorna (status, body)."""
    import httpx
    base = (__import__("os").environ.get("BACKEND_API_URL") or "").rstrip("/")
    if not base or not key:
        return 0, {}
    url = f"{base}{path}"
    try:
        r = httpx.patch(url, json=json_body, headers={"X-Internal-Key": key}, timeout=15.0)
        return r.status_code, r.json() if r.content else {}
    except Exception:
        return 0, {}


def _get(p: dict, *keys: str):
    """Retorna o primeiro valor presente (camel ou snake_case)."""
    for k in keys:
        if p.get(k) is not None:
            return p.get(k)
        sk = "".join("_" + c.lower() if c.isupper() else c for c in k).lstrip("_")
        if p.get(sk) is not None:
            return p.get(sk)
    return None


def _fmt_property(p: dict) -> str:
    """Formata um imóvel para texto."""
    title = _get(p, "title") or "Sem título"
    addr = _get(p, "addressNeighborhood") or _get(p, "addressCity") or ""
    if addr:
        addr = f" — {addr}"
    v_sale = _get(p, "valueSale")
    v_rent = _get(p, "valueRent")
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
        n = len(lines)
        return f"Imóveis encontrados ({n}):\n" + "\n".join(lines)

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
        title = _get(p, "title") or "Sem título"
        desc = (_get(p, "description") or "").strip() or "Sem descrição."
        addr_parts = [
            _get(p, "addressStreet"),
            _get(p, "addressNumber"),
            _get(p, "addressNeighborhood"),
            _get(p, "addressCity"),
            _get(p, "addressState"),
        ]
        addr = ", ".join(str(x) for x in addr_parts if x)
        v_sale = _get(p, "valueSale")
        v_rent = _get(p, "valueRent")
        vals = []
        if v_sale and float(v_sale) > 0:
            vals.append(f"Venda: R$ {float(v_sale):,.2f}".replace(",", "X").replace(".", ",").replace("X", "."))
        if v_rent and float(v_rent) > 0:
            vals.append(f"Aluguel: R$ {float(v_rent):,.2f}".replace(",", "X").replace(".", ",").replace("X", "."))
        price = "\n".join(vals) if vals else "Valor não informado."
        rooms = []
        if _get(p, "bedrooms"):
            rooms.append(f"{_get(p, 'bedrooms')} quartos")
        if _get(p, "bathrooms"):
            rooms.append(f"{_get(p, 'bathrooms')} banheiros")
        if _get(p, "parkingSpaces"):
            rooms.append(f"{_get(p, 'parkingSpaces')} vagas")
        if _get(p, "areaM2"):
            rooms.append(f"{float(_get(p, 'areaM2')):.0f} m²")
        extra = " | ".join(rooms) if rooms else ""
        return f"{title}\n\n{desc}\n\nEndereço: {addr or 'Não informado'}\n{price}\n{extra}".strip()

    @mcp.tool()
    def list_contacts(tenant_id: int = 1, limit: int = 15) -> str:
        """Lista contatos/leads do tenant (nome, telefone, email)."""
        if not use_backend:
            return "Backend não configurado (BACKEND_API_URL e BACKEND_INTERNAL_KEY)."
        status, data = _backend_fetch(
            "/api/internal/contacts",
            {"tenant_id": tenant_id, "limit": min(limit, 30)},
            internal_key,
        )
        if status != 200:
            return f"Erro ao listar contatos (status {status})."
        if not isinstance(data, list):
            return "Nenhum contato encontrado."
        if not data:
            return "Nenhum contato cadastrado ainda."
        lines = []
        for c in data:
            name = _get(c, "name") or "Sem nome"
            phone = _get(c, "phone") or ""
            email = _get(c, "email") or ""
            parts = [f"• {name}"]
            if phone:
                parts.append(f"tel: {phone}")
            if email:
                parts.append(f"email: {email}")
            lines.append(" — ".join(parts))
        n = len(lines)
        return f"Contatos ({n}):\n" + "\n".join(lines)

    @mcp.tool()
    def get_contact(contact_id: int, tenant_id: int = 1) -> str:
        """Retorna detalhes de um contato (nome, telefone, email, origem, notas)."""
        if not use_backend:
            return "Backend não configurado (BACKEND_API_URL e BACKEND_INTERNAL_KEY)."
        status, data = _backend_fetch(
            f"/api/internal/contacts/{contact_id}",
            {"tenant_id": tenant_id},
            internal_key,
        )
        if status == 404:
            return f"Contato {contact_id} não encontrado."
        if status != 200 or not isinstance(data, dict):
            return f"Erro ao buscar contato (status {status})."
        c = data
        name = _get(c, "name") or "Sem nome"
        phone = _get(c, "phone") or ""
        email = _get(c, "email") or ""
        source = _get(c, "source") or ""
        notes = (_get(c, "notes") or "").strip()
        lines = [f"{name}", f"Telefone: {phone}", f"Email: {email}" if email else ""]
        if source:
            lines.append(f"Origem: {source}")
        if notes:
            lines.append(f"Observações: {notes}")
        return "\n".join(filter(None, lines))

    @mcp.tool()
    def list_tasks(tenant_id: int = 1, limit: int = 15) -> str:
        """Lista tarefas do tenant (título, tipo, data, concluída ou não)."""
        if not use_backend:
            return "Backend não configurado (BACKEND_API_URL e BACKEND_INTERNAL_KEY)."
        status, data = _backend_fetch(
            "/api/internal/tasks",
            {"tenant_id": tenant_id, "limit": min(limit, 30)},
            internal_key,
        )
        if status != 200:
            return f"Erro ao listar tarefas (status {status})."
        if not isinstance(data, list):
            return "Nenhuma tarefa encontrada."
        if not data:
            return "Nenhuma tarefa cadastrada."
        lines = []
        for t in data:
            title = _get(t, "title") or "Sem título"
            typ = _get(t, "type") or ""
            due = _get(t, "dueAt")
            done = _get(t, "completedAt")
            status_str = "✓" if done else "○"
            due_str = ""
            if due:
                try:
                    from datetime import datetime
                    dt = datetime.fromisoformat(str(due).replace("Z", "+00:00"))
                    due_str = dt.strftime("%d/%m %H:%M")
                except Exception:
                    due_str = str(due)
            extra = " | ".join(filter(None, [typ, due_str]))
            lines.append(f"{status_str} {title}" + (f" — {extra}" if extra else ""))
        n = len(lines)
        return f"Tarefas ({n}):\n" + "\n".join(lines)

    @mcp.tool()
    def create_task(
        tenant_id: int = 1,
        title: str = "Tarefa",
        type: str = "",
        contact_id: int | None = None,
        property_id: int | None = None,
        due_at: str = "",
        notes: str = "",
    ) -> str:
        """Cria uma tarefa no CRM (ex.: lembrete, visita, ligar)."""
        if not use_backend:
            return "Backend não configurado (BACKEND_API_URL e BACKEND_INTERNAL_KEY)."
        body = {"tenant_id": tenant_id, "title": (title or "Tarefa").strip()[:255]}
        if type and type.strip():
            body["type"] = type.strip()
        if contact_id and contact_id > 0:
            body["contact_id"] = contact_id
        if property_id and property_id > 0:
            body["property_id"] = property_id
        if due_at and due_at.strip():
            body["due_at"] = due_at.strip()
        if notes and notes.strip():
            body["notes"] = notes.strip()
        status, data = _backend_post("/api/internal/tasks", body, internal_key)
        if status not in (200, 201):
            return f"Erro ao criar tarefa (status {status})."
        if isinstance(data, dict) and data.get("id"):
            return f"Tarefa criada: \"{_get(data, 'title') or title}\" (id={data['id']})."
        return "Tarefa criada."

    @mcp.tool()
    def complete_task(task_id: int, tenant_id: int = 1) -> str:
        """Marca uma tarefa como concluída."""
        if not use_backend:
            return "Backend não configurado (BACKEND_API_URL e BACKEND_INTERNAL_KEY)."
        status, data = _backend_patch(
            f"/api/internal/tasks/{task_id}",
            {"tenant_id": tenant_id},
            internal_key,
        )
        if status == 404:
            return f"Tarefa {task_id} não encontrada."
        if status != 200:
            return f"Erro ao concluir tarefa (status {status})."
        title = _get(data, "title") if isinstance(data, dict) else ""
        return f"Tarefa concluída: \"{title}\"." if title else "Tarefa concluída."

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

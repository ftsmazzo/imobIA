"""
MCP Server — Plataforma Imobiliária
Tools imobiliárias para o agente (LangGraph). Exposto via HTTP para o backend.
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
    # Placeholder: em produção o backend/banco será consultado
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


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8000"))
    # host="0.0.0.0" para aceitar conexões de outros containers (backend)
    mcp.run(transport="http", host="0.0.0.0", port=port)

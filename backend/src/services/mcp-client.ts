/**
 * Cliente para chamar tools do MCP Server via HTTP (JSON-RPC 2.0).
 * Variável de ambiente: MCP_SERVER_URL (ex.: http://mcp-server:8000)
 */

const MCP_SERVER_URL = process.env.MCP_SERVER_URL || "http://localhost:8000";

export type McpToolResult = {
  text: string;
  isError: boolean;
};

/**
 * Chama uma tool no MCP server. Retorna o texto da resposta ou lança em caso de falha.
 */
export async function callMcpTool(
  name: string,
  args: Record<string, unknown> = {}
): Promise<McpToolResult> {
  const url = MCP_SERVER_URL.replace(/\/$/, "");
  const body = {
    jsonrpc: "2.0",
    id: Date.now(),
    method: "tools/call",
    params: { name, arguments: args },
  };

  const res = await fetch(`${url}/mcp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch((err) => {
    throw new Error(`MCP server inacessível (${url}): ${(err as Error).message}`);
  });

  if (!res.ok) {
    throw new Error(`MCP server retornou ${res.status}`);
  }

  const data = (await res.json()) as {
    jsonrpc?: string;
    id?: number;
    error?: { code: number; message: string };
    result?: { content?: Array<{ type: string; text?: string }>; isError?: boolean };
  };

  if (data.error) {
    throw new Error(data.error.message || "Erro ao chamar tool MCP");
  }

  const content = data.result?.content;
  const firstText = Array.isArray(content)
    ? content.find((c) => c.type === "text")?.text ?? ""
    : "";
  const isError = data.result?.isError ?? false;

  return { text: firstText, isError };
}

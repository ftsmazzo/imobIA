/**
 * Cliente para chamar tools do MCP Server via HTTP (JSON-RPC 2.0).
 * Transport: Streamable HTTP (2025-03-26) — exige initialize antes de tools/call.
 * Variável de ambiente: MCP_SERVER_URL (ex.: http://mcp-server:8000)
 */

const MCP_SERVER_URL = process.env.MCP_SERVER_URL || "http://localhost:8000";

const MCP_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json, text/event-stream",
} as const;

/** Sessão em memória por base URL (evita initialize a cada request). */
let cachedSessionId: string | null = null;

export type McpToolResult = {
  text: string;
  isError: boolean;
};

/**
 * Envia um request JSON-RPC ao endpoint /mcp. Retorna resposta parseada e headers.
 */
async function mcpPost(
  url: string,
  body: object,
  sessionId: string | null
): Promise<{ res: Response; data: unknown }> {
  const headers: Record<string, string> = { ...MCP_HEADERS };
  if (sessionId) headers["Mcp-Session-Id"] = sessionId;

  const res = await fetch(`${url}/mcp/`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  }).catch((err) => {
    throw new Error(`MCP server inacessível (${url}): ${(err as Error).message}`);
  });

  const text = await res.text();
  let data: unknown;
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("text/event-stream")) {
    data = parseSSE(text);
  } else {
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      if (!res.ok) throw new Error(`MCP retornou ${res.status}: ${text.slice(0, 200)}`);
      throw new Error(`MCP resposta inválida (não JSON): ${text.slice(0, 200)}`);
    }
  }
  return { res, data };
}

/** Extrai JSON-RPC de resposta SSE (event: message \\n data: {...}). */
function parseSSE(text: string): unknown {
  const lines = text.split(/\r?\n/);
  let last: unknown = null;
  for (const line of lines) {
    if (line.startsWith("data:")) {
      const raw = line.slice(5).trim();
      if (raw === "[DONE]" || !raw) continue;
      try {
        last = JSON.parse(raw);
      } catch {
        // ignora linha data inválida
      }
    }
  }
  return last;
}

/**
 * Faz handshake initialize e retorna o Mcp-Session-Id (ou null se servidor não enviar).
 */
async function ensureSession(url: string): Promise<string | null> {
  if (cachedSessionId) return cachedSessionId;

  const initBody = {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2025-03-26",
      capabilities: {},
      clientInfo: { name: "backend-webhook", version: "0.1" },
    },
  };

  const { res, data } = await mcpPost(url, initBody, null);

  const rpcError = (data as { error?: { message?: string } })?.error;
  if (!res.ok) {
    throw new Error(`MCP initialize falhou (${res.status}): ${rpcError?.message ?? res.statusText}`);
  }
  if (rpcError) {
    throw new Error(`MCP initialize: ${rpcError.message}`);
  }

  const sessionId = res.headers.get("mcp-session-id") ?? res.headers.get("Mcp-Session-Id") ?? null;
  if (sessionId) cachedSessionId = sessionId;

  return sessionId;
}

/**
 * Chama uma tool no MCP server. Retorna o texto da resposta ou lança em caso de falha.
 * Faz initialize na primeira chamada e reutiliza Mcp-Session-Id; em 404 limpa sessão e repete uma vez.
 */
export async function callMcpTool(
  name: string,
  args: Record<string, unknown> = {}
): Promise<McpToolResult> {
  const url = MCP_SERVER_URL.replace(/\/$/, "");
  const sessionId = await ensureSession(url);

  const body = {
    jsonrpc: "2.0",
    id: Date.now(),
    method: "tools/call",
    params: { name, arguments: args },
  };

  let { res, data } = await mcpPost(url, body, sessionId);

  if (res.status === 404 && sessionId) {
    cachedSessionId = null;
    const newSessionId = await ensureSession(url);
    const retry = await mcpPost(url, body, newSessionId);
    res = retry.res;
    data = retry.data;
  }

  if (!res.ok) {
    const msg = (data as { error?: { message?: string } })?.error?.message ?? "";
    throw new Error(`MCP retornou ${res.status}${msg ? ": " + msg : ""}`);
  }

  const parsed = data as {
    jsonrpc?: string;
    id?: number;
    error?: { code: number; message: string };
    result?: { content?: Array<{ type: string; text?: string }>; isError?: boolean };
  };

  if (parsed.error) {
    throw new Error(parsed.error.message || "Erro ao chamar tool MCP");
  }

  const content = parsed.result?.content;
  const firstText = Array.isArray(content)
    ? content.find((c) => c.type === "text")?.text ?? ""
    : "";
  const isError = parsed.result?.isError ?? false;

  return { text: firstText, isError };
}

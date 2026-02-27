declare global {
  interface Window {
    __API_URL__?: string;
  }
}

export function getApiUrl(): string {
  const fromRuntime = (typeof window !== "undefined" && window.__API_URL__) || "";
  const fromBuild = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
  return (fromRuntime || fromBuild).replace(/\/$/, "");
}

export function apiFetch(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<Response> {
  const { token, ...init } = options;
  const base = getApiUrl();
  if (!base) {
    return Promise.reject(new Error("API URL não configurada"));
  }
  const headers = new Headers(init.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (init.body && typeof init.body === "string" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(`${base}${path.startsWith("/") ? path : `/${path}`}`, { ...init, headers });
}

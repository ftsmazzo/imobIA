import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";

type Contact = {
  id: number;
  name: string | null;
  phone: string;
  email: string | null;
  source: string | null;
  pipelineStageId: number | null;
};

export default function Contatos() {
  const { token } = useAuth();
  const [list, setList] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch("/api/contacts", { token: token ?? undefined })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Erro ao carregar"))))
      .then(setList)
      .catch(() => setError("Erro ao carregar contatos"))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <p>Carregando…</p>;
  if (error) return <p style={{ color: "#c00" }}>{error}</p>;

  return (
    <div>
      <h1 style={{ margin: "0 0 1rem", fontSize: "1.5rem" }}>Contatos</h1>
      {list.length === 0 ? (
        <p style={{ color: "#666" }}>Nenhum contato cadastrado.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {list.map((c) => (
            <div
              key={c.id}
              style={{
                padding: "1rem 1.25rem",
                background: "#fff",
                borderRadius: 8,
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
              }}
            >
              <strong>{c.name || c.phone}</strong>
              <p style={{ margin: "0.25rem 0 0", fontSize: "0.9rem", color: "#666" }}>
                {c.phone}
                {c.email && ` · ${c.email}`}
              </p>
              {c.source && (
                <p style={{ margin: "0.25rem 0 0", fontSize: "0.85rem", color: "#888" }}>
                  Origem: {c.source}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { getApiUrl } from "../lib/api";

type Plan = {
  id: number;
  name: string;
  description: string | null;
  priceMonthly: number;
  maxProperties: number | null;
  maxContacts: number | null;
  maxAgents: number | null;
  maxUsers: number | null;
};

export default function Planos() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const base = getApiUrl();
    if (!base) {
      setError("API não configurada");
      setLoading(false);
      return;
    }
    fetch(`${base}/api/plans`)
      .then((r) => r.json())
      .then((data) => {
        setPlans(Array.isArray(data) ? data : []);
      })
      .catch(() => setError("Erro ao carregar planos"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Carregando…</p>;
  if (error) return <p style={{ color: "#c00" }}>{error}</p>;

  return (
    <div>
      <h1 style={{ margin: "0 0 1rem", fontSize: "1.5rem" }}>Planos</h1>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {plans.map((p) => (
          <div
            key={p.id}
            style={{
              padding: "1rem 1.25rem",
              background: "#fff",
              borderRadius: 8,
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            }}
          >
            <strong style={{ fontSize: "1.1rem" }}>{p.name}</strong>
            {p.description && (
              <p style={{ margin: "0.5rem 0 0", color: "#666", fontSize: "0.95rem" }}>
                {p.description}
              </p>
            )}
            <p style={{ margin: "0.5rem 0 0", fontSize: "0.9rem", color: "#888" }}>
              R$ {(p.priceMonthly / 100).toFixed(2)}/mês · Imóveis: {p.maxProperties ?? "—"} ·
              Contatos: {p.maxContacts ?? "—"} · Agentes: {p.maxAgents ?? "—"} · Usuários:{" "}
              {p.maxUsers ?? "—"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

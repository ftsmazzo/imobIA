import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";

type Property = {
  id: number;
  type: string;
  title: string | null;
  addressCity: string | null;
  addressState: string | null;
  valueSale: string | null;
  valueRent: string | null;
  status: string;
};

export default function Imoveis() {
  const { token } = useAuth();
  const [list, setList] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch("/api/properties", { token: token ?? undefined })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Erro ao carregar"))))
      .then(setList)
      .catch(() => setError("Erro ao carregar imóveis"))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <p>Carregando…</p>;
  if (error) return <p style={{ color: "#c00" }}>{error}</p>;

  return (
    <div>
      <h1 style={{ margin: "0 0 1rem", fontSize: "1.5rem" }}>Imóveis</h1>
      {list.length === 0 ? (
        <p style={{ color: "#666" }}>Nenhum imóvel cadastrado.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {list.map((p) => (
            <div
              key={p.id}
              style={{
                padding: "1rem 1.25rem",
                background: "#fff",
                borderRadius: 8,
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
              }}
            >
              <strong>{p.title || `Imóvel #${p.id}`}</strong>
              <span style={{ marginLeft: "0.5rem", fontSize: "0.85rem", color: "#888" }}>
                {p.type} · {p.status}
              </span>
              {(p.addressCity || p.addressState) && (
                <p style={{ margin: "0.25rem 0 0", fontSize: "0.9rem", color: "#666" }}>
                  {[p.addressCity, p.addressState].filter(Boolean).join(" — ")}
                </p>
              )}
              {(p.valueSale || p.valueRent) && (
                <p style={{ margin: "0.25rem 0 0", fontSize: "0.9rem", color: "#555" }}>
                  {p.valueSale && `Venda: R$ ${p.valueSale}`}
                  {p.valueSale && p.valueRent && " · "}
                  {p.valueRent && `Aluguel: R$ ${p.valueRent}`}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

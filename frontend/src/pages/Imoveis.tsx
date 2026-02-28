import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import Button from "../components/Button";

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

const TIPOS = [
  { value: "", label: "Todos os tipos" },
  { value: "apartment", label: "Apartamento" },
  { value: "house", label: "Casa" },
  { value: "land", label: "Terreno" },
  { value: "commercial", label: "Comercial" },
];

export default function Imoveis() {
  const { token } = useAuth();
  const [list, setList] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tipo, setTipo] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({
    type: "apartment",
    title: "",
    addressCity: "",
    addressState: "",
    valueSale: "",
    valueRent: "",
    status: "available",
  });

  useEffect(() => {
    const url = tipo ? `/api/properties?type=${encodeURIComponent(tipo)}` : "/api/properties";
    setLoading(true);
    setError(null);
    apiFetch(url, { token: token ?? undefined })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Erro ao carregar"))))
      .then(setList)
      .catch(() => setError("Erro ao carregar imóveis"))
      .finally(() => setLoading(false));
  }, [token, tipo]);

  async function handleSubmitImovel(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setFormError(null);
    setSaving(true);
    try {
      const r = await apiFetch("/api/properties", {
        method: "POST",
        token,
        body: JSON.stringify({
          type: form.type,
          title: form.title || null,
          addressCity: form.addressCity || null,
          addressState: form.addressState || null,
          valueSale: form.valueSale || null,
          valueRent: form.valueRent || null,
          status: form.status,
        }),
      });
      if (!r.ok) throw new Error("Erro ao cadastrar");
      setShowForm(false);
      setForm({ type: "apartment", title: "", addressCity: "", addressState: "", valueSale: "", valueRent: "", status: "available" });
      const url = tipo ? `/api/properties?type=${encodeURIComponent(tipo)}` : "/api/properties";
      const res = await apiFetch(url, { token });
      if (res.ok) setList(await res.json());
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Erro ao cadastrar");
    } finally {
      setSaving(false);
    }
  }

  if (error) return <p style={{ color: "#c00" }}>{error}</p>;

  return (
    <div>
      <h1 style={{ margin: "0 0 0.5rem", fontSize: "1.5rem" }}>Imóveis</h1>
      <div style={{ background: "#e8eef4", padding: "1rem 1.25rem", borderRadius: 10, marginBottom: "1.25rem", border: "1px solid #c5d5e8" }}>
        <Button variant="primary" onClick={() => { setShowForm(!showForm); setFormError(null); }}>
          {showForm ? "Cancelar" : "+ Novo imóvel"}
        </Button>
      </div>
      {showForm && (
        <form onSubmit={handleSubmitImovel} style={{ background: "#fff", padding: "1.25rem", borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: "1rem", maxWidth: 480 }}>
          <h3 style={{ margin: "0 0 1rem", fontSize: "1.1rem" }}>Cadastrar imóvel</h3>
          {formError && <p style={{ color: "#c00", margin: "0 0 0.5rem", fontSize: "0.9rem" }}>{formError}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.9rem" }}>Tipo</label>
              <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} style={{ width: "100%", padding: "0.5rem", borderRadius: 6, border: "1px solid #ccc" }}>
                {TIPOS.filter((t) => t.value).map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.9rem" }}>Título</label>
              <input type="text" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Ex: Apartamento 2 quartos" style={{ width: "100%", padding: "0.5rem", borderRadius: 6, border: "1px solid #ccc" }} />
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.9rem" }}>Cidade</label>
                <input type="text" value={form.addressCity} onChange={(e) => setForm((f) => ({ ...f, addressCity: e.target.value }))} style={{ width: "100%", padding: "0.5rem", borderRadius: 6, border: "1px solid #ccc" }} />
              </div>
              <div style={{ width: 60 }}>
                <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.9rem" }}>UF</label>
                <input type="text" value={form.addressState} onChange={(e) => setForm((f) => ({ ...f, addressState: e.target.value.slice(0, 2).toUpperCase() }))} maxLength={2} placeholder="SP" style={{ width: "100%", padding: "0.5rem", borderRadius: 6, border: "1px solid #ccc" }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.9rem" }}>Valor venda (R$)</label>
                <input type="text" value={form.valueSale} onChange={(e) => setForm((f) => ({ ...f, valueSale: e.target.value }))} placeholder="Ex: 450000" style={{ width: "100%", padding: "0.5rem", borderRadius: 6, border: "1px solid #ccc" }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.9rem" }}>Valor aluguel (R$)</label>
                <input type="text" value={form.valueRent} onChange={(e) => setForm((f) => ({ ...f, valueRent: e.target.value }))} placeholder="Ex: 2500" style={{ width: "100%", padding: "0.5rem", borderRadius: 6, border: "1px solid #ccc" }} />
              </div>
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.9rem" }}>Status</label>
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} style={{ width: "100%", padding: "0.5rem", borderRadius: 6, border: "1px solid #ccc" }}>
                <option value="available">Disponível</option>
                <option value="reserved">Reservado</option>
                <option value="sold">Vendido</option>
                <option value="rented">Alugado</option>
              </select>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
              <Button type="submit" variant="primary" disabled={saving}>{saving ? "Salvando…" : "Cadastrar"}</Button>
              <Button type="button" variant="secondary" onClick={() => { setShowForm(false); setFormError(null); }}>Cancelar</Button>
            </div>
          </div>
        </form>
      )}
      <div style={{ marginBottom: "1rem" }}>
        <label style={{ marginRight: "0.5rem", fontSize: "0.9rem", color: "#666" }}>Tipo: </label>
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          style={{ padding: "0.4rem 0.75rem", borderRadius: 6, border: "1px solid #ccc", fontSize: "0.95rem" }}
        >
          {TIPOS.map((opt) => (
            <option key={opt.value || "all"} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      {loading ? (
        <p>Carregando…</p>
      ) : list.length === 0 ? (
        <p style={{ color: "#666" }}>Nenhum imóvel cadastrado.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {list.map((p) => (
            <Link
              key={p.id}
              to={`/imoveis/${p.id}`}
              style={{
                display: "block",
                padding: "1rem 1.25rem",
                background: "#fff",
                borderRadius: 8,
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                textDecoration: "none",
                color: "inherit",
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
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

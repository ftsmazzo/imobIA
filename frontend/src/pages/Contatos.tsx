import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import Button from "../components/Button";

type Contact = {
  id: number;
  name: string | null;
  phone: string;
  email: string | null;
  source: string | null;
  pipelineStageId: number | null;
};

type Stage = { id: number; name: string; slug: string };

export default function Contatos() {
  const { token } = useAuth();
  const [list, setList] = useState<Contact[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [stageId, setStageId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", source: "", pipelineStageId: "" });

  useEffect(() => {
    if (!token) return;
    apiFetch("/api/pipeline-stages", { token })
      .then((r) => (r.ok ? r.json() : []))
      .then(setStages)
      .catch(() => setStages([]));
  }, [token]);

  useEffect(() => {
    const url = stageId ? `/api/contacts?pipelineStageId=${encodeURIComponent(stageId)}` : "/api/contacts";
    setLoading(true);
    setError(null);
    apiFetch(url, { token: token ?? undefined })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Erro ao carregar"))))
      .then(setList)
      .catch(() => setError("Erro ao carregar contatos"))
      .finally(() => setLoading(false));
  }, [token, stageId]);

  const stageMap = Object.fromEntries(stages.map((s) => [s.id, s.name]));

  async function handleSubmitContato(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    if (!form.phone.trim()) { setFormError("Telefone é obrigatório"); return; }
    setFormError(null);
    setSaving(true);
    try {
      const r = await apiFetch("/api/contacts", {
        method: "POST",
        token,
        body: JSON.stringify({
          name: form.name || null,
          phone: form.phone.trim(),
          email: form.email || null,
          source: form.source || null,
          pipelineStageId: form.pipelineStageId ? Number(form.pipelineStageId) : null,
        }),
      });
      if (!r.ok) throw new Error("Erro ao cadastrar");
      setShowForm(false);
      setForm({ name: "", phone: "", email: "", source: "", pipelineStageId: "" });
      const url = stageId ? `/api/contacts?pipelineStageId=${encodeURIComponent(stageId)}` : "/api/contacts";
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
      <h1 style={{ margin: "0 0 0.5rem", fontSize: "1.5rem" }}>Contatos</h1>
      <div style={{ background: "#e8eef4", padding: "1rem 1.25rem", borderRadius: 10, marginBottom: "1.25rem", border: "1px solid #c5d5e8" }}>
        <Button variant="primary" onClick={() => { setShowForm(!showForm); setFormError(null); }}>
          {showForm ? "Cancelar" : "+ Novo contato"}
        </Button>
      </div>
      {showForm && (
        <form onSubmit={handleSubmitContato} style={{ background: "#fff", padding: "1.25rem", borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: "1rem", maxWidth: 400 }}>
          <h3 style={{ margin: "0 0 1rem", fontSize: "1.1rem" }}>Cadastrar contato</h3>
          {formError && <p style={{ color: "#c00", margin: "0 0 0.5rem", fontSize: "0.9rem" }}>{formError}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.9rem" }}>Nome</label>
              <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Nome do contato" style={{ width: "100%", padding: "0.5rem", borderRadius: 6, border: "1px solid #ccc" }} />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.9rem" }}>Telefone *</label>
              <input type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="(11) 99999-9999" required style={{ width: "100%", padding: "0.5rem", borderRadius: 6, border: "1px solid #ccc" }} />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.9rem" }}>E-mail</label>
              <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="email@exemplo.com" style={{ width: "100%", padding: "0.5rem", borderRadius: 6, border: "1px solid #ccc" }} />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.9rem" }}>Origem</label>
              <input type="text" value={form.source} onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))} placeholder="Ex: Site, WhatsApp" style={{ width: "100%", padding: "0.5rem", borderRadius: 6, border: "1px solid #ccc" }} />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.9rem" }}>Etapa do pipeline</label>
              <select value={form.pipelineStageId} onChange={(e) => setForm((f) => ({ ...f, pipelineStageId: e.target.value }))} style={{ width: "100%", padding: "0.5rem", borderRadius: 6, border: "1px solid #ccc" }}>
                <option value="">— Nenhuma —</option>
                {stages.map((s) => (
                  <option key={s.id} value={String(s.id)}>{s.name}</option>
                ))}
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
        <label style={{ marginRight: "0.5rem", fontSize: "0.9rem", color: "#666" }}>Etapa: </label>
        <select
          value={stageId}
          onChange={(e) => setStageId(e.target.value)}
          style={{ padding: "0.4rem 0.75rem", borderRadius: 6, border: "1px solid #ccc", fontSize: "0.95rem" }}
        >
          <option value="">Todas as etapas</option>
          {stages.map((s) => (
            <option key={s.id} value={String(s.id)}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      {loading ? (
        <p>Carregando…</p>
      ) : list.length === 0 ? (
        <p style={{ color: "#666" }}>Nenhum contato cadastrado.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {list.map((c) => (
            <Link
              key={c.id}
              to={`/contatos/${c.id}`}
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
              <strong>{c.name || c.phone}</strong>
              {c.pipelineStageId && stageMap[c.pipelineStageId] && (
                <span style={{ marginLeft: "0.5rem", fontSize: "0.8rem", color: "#888", background: "#eee", padding: "0.2rem 0.5rem", borderRadius: 4 }}>
                  {stageMap[c.pipelineStageId]}
                </span>
              )}
              <p style={{ margin: "0.25rem 0 0", fontSize: "0.9rem", color: "#666" }}>
                {c.phone}
                {c.email && ` · ${c.email}`}
              </p>
              {c.source && (
                <p style={{ margin: "0.25rem 0 0", fontSize: "0.85rem", color: "#888" }}>
                  Origem: {c.source}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

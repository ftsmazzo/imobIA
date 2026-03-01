import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import Button from "../components/Button";

type Task = {
  id: number;
  title: string;
  type: string | null;
  dueAt: string | null;
  completedAt: string | null;
  notes: string | null;
  contactId: number | null;
  propertyId: number | null;
};

function formatDate(s: string | null): string {
  if (!s) return "";
  try {
    const d = new Date(s);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return s;
  }
}

export default function Tarefas() {
  const { token } = useAuth();
  const [list, setList] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", dueAt: "", notes: "" });

  const loadTasks = () => {
    setLoading(true);
    setError(null);
    apiFetch("/api/tasks", { token: token ?? undefined })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Erro ao carregar"))))
      .then(setList)
      .catch(() => setError("Erro ao carregar tarefas"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTasks();
  }, [token]);

  async function handleComplete(id: number) {
    if (!token) return;
    try {
      const r = await apiFetch(`/api/tasks/${id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ completedAt: new Date().toISOString() }),
      });
      if (r.ok) setList((prev) => prev.map((t) => (t.id === id ? { ...t, completedAt: new Date().toISOString() } : t)));
      else loadTasks();
    } catch {
      loadTasks();
    }
  }

  async function handleSubmitTarefa(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !form.title.trim()) {
      setFormError("Título é obrigatório");
      return;
    }
    setFormError(null);
    setSaving(true);
    try {
      const r = await apiFetch("/api/tasks", {
        method: "POST",
        token,
        body: JSON.stringify({
          title: form.title.trim(),
          ...(form.dueAt ? { dueAt: new Date(form.dueAt).toISOString() } : {}),
          ...(form.notes.trim() ? { notes: form.notes.trim() } : {}),
        }),
      });
      if (!r.ok) throw new Error("Erro ao criar");
      setShowForm(false);
      setForm({ title: "", dueAt: "", notes: "" });
      loadTasks();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Erro ao criar tarefa");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p>Carregando…</p>;
  if (error) return <p style={{ color: "#c00" }}>{error}</p>;

  return (
    <div>
      <h1 style={{ margin: "0 0 0.5rem", fontSize: "1.5rem" }}>Tarefas</h1>
      <div style={{ background: "#e8eef4", padding: "1rem 1.25rem", borderRadius: 10, marginBottom: "1rem", border: "1px solid #c5d5e8", display: "flex", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
        <Button variant="primary" onClick={() => { setShowForm(!showForm); setFormError(null); }}>
          {showForm ? "Cancelar" : "+ Nova tarefa"}
        </Button>
        <span style={{ fontSize: "0.95rem", color: "#333" }}>Ou crie pelo chat: &quot;criar tarefa: Ligar para João&quot;</span>
      </div>
      {showForm && (
        <form onSubmit={handleSubmitTarefa} style={{ background: "#fff", padding: "1.25rem", borderRadius: 10, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: "1.25rem", maxWidth: 420 }}>
          <h3 style={{ margin: "0 0 1rem", fontSize: "1.1rem" }}>Nova tarefa</h3>
          {formError && <p style={{ color: "#c00", margin: "0 0 0.5rem", fontSize: "0.9rem" }}>{formError}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.9rem" }}>Título *</label>
              <input type="text" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Ex: Ligar para o cliente" required style={{ width: "100%", padding: "0.5rem", borderRadius: 6, border: "1px solid #ccc" }} />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.9rem" }}>Data limite (opcional)</label>
              <input type="datetime-local" value={form.dueAt} onChange={(e) => setForm((f) => ({ ...f, dueAt: e.target.value }))} style={{ width: "100%", padding: "0.5rem", borderRadius: 6, border: "1px solid #ccc" }} />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.9rem" }}>Observações (opcional)</label>
              <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Detalhes da tarefa" style={{ width: "100%", padding: "0.5rem", borderRadius: 6, border: "1px solid #ccc", resize: "vertical" }} />
            </div>
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.25rem" }}>
              <Button type="submit" variant="primary" disabled={saving}>{saving ? "Salvando…" : "Criar tarefa"}</Button>
              <Button type="button" variant="secondary" onClick={() => { setShowForm(false); setFormError(null); }}>Cancelar</Button>
            </div>
          </div>
        </form>
      )}
      {list.length === 0 ? (
        <div style={{ background: "#fff", padding: "1.5rem", borderRadius: 10, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", textAlign: "center" }}>
          <p style={{ color: "#666", margin: "0 0 1rem" }}>Nenhuma tarefa cadastrada.</p>
          <p style={{ color: "#888", fontSize: "0.9rem", margin: 0 }}>Clique em &quot;+ Nova tarefa&quot; acima ou crie pelo chat.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {list.map((t) => (
            <div
              key={t.id}
              style={{
                padding: "1rem 1.25rem",
                background: "#fff",
                borderRadius: 8,
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                opacity: t.completedAt ? 0.85 : 1,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                <span style={{ color: t.completedAt ? "#0a0" : "#666", fontSize: "1.1rem" }}>
                  {t.completedAt ? "✓" : "○"}
                </span>
                <strong>{t.title}</strong>
                {t.type && (
                  <span style={{ fontSize: "0.8rem", color: "#888", background: "#eee", padding: "0.2rem 0.5rem", borderRadius: 4 }}>
                    {t.type}
                  </span>
                )}
                {!t.completedAt && (
                  <Button
                    variant="primary"
                    onClick={() => handleComplete(t.id)}
                    style={{ marginLeft: "auto" }}
                  >
                    Concluir
                  </Button>
                )}
              </div>
              {(t.dueAt || t.notes) && (
                <p style={{ margin: "0.35rem 0 0", fontSize: "0.9rem", color: "#666" }}>
                  {t.dueAt && `📅 ${formatDate(t.dueAt)}`}
                  {t.dueAt && t.notes && " · "}
                  {t.notes && t.notes.slice(0, 80)}
                  {t.notes && t.notes.length > 80 ? "…" : ""}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


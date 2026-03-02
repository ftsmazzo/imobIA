import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
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
  assignedToId: number | null;
};

type Contact = { id: number; name: string | null; phone: string };
type UserItem = { id: number; name: string | null; email: string };

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
  const [searchParams] = useSearchParams();
  const contactIdFromUrl = searchParams.get("contactId") ?? "";
  const { token, user } = useAuth();
  const [list, setList] = useState<Task[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", contactId: "", assignedToId: "", dueAt: "", notes: "" });
  const [filterContactId, setFilterContactId] = useState("");
  const [filterAssignedToId, setFilterAssignedToId] = useState("");

  useEffect(() => {
    if (contactIdFromUrl) setFilterContactId(contactIdFromUrl);
  }, [contactIdFromUrl]);

  const contactMap = Object.fromEntries(contacts.map((c) => [c.id, c.name || c.phone]));
  const userMap = Object.fromEntries(users.map((u) => [u.id, u.name || u.email]));

  const loadTasks = () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (filterContactId) params.set("contactId", filterContactId);
    if (filterAssignedToId) params.set("assignedToId", filterAssignedToId);
    const qs = params.toString();
    const url = qs ? `/api/tasks?${qs}` : "/api/tasks";
    apiFetch(url, { token: token ?? undefined })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Erro ao carregar"))))
      .then(setList)
      .catch(() => setError("Erro ao carregar tarefas"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTasks();
  }, [token, filterContactId, filterAssignedToId]);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      apiFetch("/api/contacts", { token }).then((r) => (r.ok ? r.json() : [])),
      apiFetch("/api/users", { token }).then((r) => (r.ok ? r.json() : [])),
    ]).then(([c, u]) => {
      setContacts(Array.isArray(c) ? c : []);
      setUsers(Array.isArray(u) ? u : []);
    });
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
    if (!form.contactId) {
      setFormError("Lead (contato) é obrigatório");
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
          contactId: Number(form.contactId),
          assignedToId: form.assignedToId ? Number(form.assignedToId) : (user?.id ?? null),
          ...(form.dueAt ? { dueAt: new Date(form.dueAt).toISOString() } : {}),
          ...(form.notes.trim() ? { notes: form.notes.trim() } : {}),
        }),
      });
      if (!r.ok) throw new Error("Erro ao criar");
      setShowForm(false);
      setForm({ title: "", contactId: "", assignedToId: user?.id ? String(user.id) : "", dueAt: "", notes: "" });
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
        <Button variant="primary" onClick={() => { setShowForm(!showForm); setFormError(null); if (!showForm && user?.id) setForm((f) => ({ ...f, assignedToId: String(user.id) })); }}>
          {showForm ? "Cancelar" : "+ Nova tarefa"}
        </Button>
        <span style={{ fontSize: "0.95rem", color: "#333" }}>Ou crie pelo chat: &quot;criar tarefa: Ligar para João&quot;</span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center", marginBottom: "1rem" }}>
        <label style={{ fontSize: "0.9rem", color: "#666" }}>
          Filtrar por lead:
          <select value={filterContactId} onChange={(e) => setFilterContactId(e.target.value)} style={{ marginLeft: "0.35rem", padding: "0.4rem 0.5rem", borderRadius: 6, border: "1px solid #ccc" }}>
            <option value="">Todos</option>
            {contacts.map((c) => (
              <option key={c.id} value={String(c.id)}>{c.name || c.phone}</option>
            ))}
          </select>
        </label>
        <label style={{ fontSize: "0.9rem", color: "#666" }}>
          Filtrar por responsável:
          <select value={filterAssignedToId} onChange={(e) => setFilterAssignedToId(e.target.value)} style={{ marginLeft: "0.35rem", padding: "0.4rem 0.5rem", borderRadius: 6, border: "1px solid #ccc" }}>
            <option value="">Todos</option>
            {users.map((u) => (
              <option key={u.id} value={String(u.id)}>{u.name || u.email}</option>
            ))}
          </select>
        </label>
      </div>
      {showForm && (
        <form onSubmit={handleSubmitTarefa} style={{ background: "#fff", padding: "1.25rem", borderRadius: 10, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: "1.25rem", maxWidth: 420 }}>
          <h3 style={{ margin: "0 0 1rem", fontSize: "1.1rem" }}>Nova tarefa</h3>
          {formError && <p style={{ color: "#c00", margin: "0 0 0.5rem", fontSize: "0.9rem" }}>{formError}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.9rem" }}>Lead (contato) *</label>
              <select value={form.contactId} onChange={(e) => setForm((f) => ({ ...f, contactId: e.target.value }))} required style={{ width: "100%", padding: "0.5rem", borderRadius: 6, border: "1px solid #ccc" }}>
                <option value="">— Selecione o lead —</option>
                {contacts.map((c) => (
                  <option key={c.id} value={String(c.id)}>{c.name || c.phone} ({c.phone})</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.9rem" }}>Responsável (quem executa)</label>
              <select value={form.assignedToId} onChange={(e) => setForm((f) => ({ ...f, assignedToId: e.target.value }))} style={{ width: "100%", padding: "0.5rem", borderRadius: 6, border: "1px solid #ccc" }}>
                <option value="">— Eu (usuário logado) —</option>
                {users.map((u) => (
                  <option key={u.id} value={String(u.id)}>{u.name || u.email}</option>
                ))}
              </select>
            </div>
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
                {t.contactId && contactMap[t.contactId] && (
                  <Link to={`/contatos/${t.contactId}`} style={{ fontSize: "0.85rem", color: "#0f3460", textDecoration: "none" }}>
                    👤 {contactMap[t.contactId]}
                  </Link>
                )}
                {t.assignedToId && userMap[t.assignedToId] && (
                  <span style={{ fontSize: "0.8rem", color: "#666" }}>→ {userMap[t.assignedToId]}</span>
                )}
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


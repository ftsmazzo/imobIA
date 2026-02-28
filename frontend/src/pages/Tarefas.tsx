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

  if (loading) return <p>Carregando…</p>;
  if (error) return <p style={{ color: "#c00" }}>{error}</p>;

  return (
    <div>
      <h1 style={{ margin: "0 0 0.5rem", fontSize: "1.5rem" }}>Tarefas</h1>
      <div style={{ background: "#e8eef4", padding: "1rem 1.25rem", borderRadius: 10, marginBottom: "1.25rem", border: "1px solid #c5d5e8" }}>
        <span style={{ fontSize: "0.95rem", color: "#333", marginRight: "0.75rem" }}>Tarefas pendentes aparecem aqui. Para criar, use o chat: &quot;criar tarefa: Ligar para João&quot;</span>
      </div>
      {list.length === 0 ? (
        <div style={{ background: "#fff", padding: "1.5rem", borderRadius: 10, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", textAlign: "center" }}>
          <p style={{ color: "#666", margin: "0 0 1rem" }}>Nenhuma tarefa cadastrada.</p>
          <p style={{ color: "#888", fontSize: "0.9rem", margin: 0 }}>Crie pelo atendimento (webhook/chat): &quot;criar tarefa: Ligar para João&quot;</p>
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


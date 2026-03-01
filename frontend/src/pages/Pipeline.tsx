import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";

type Stage = { id: number; name: string; slug: string; sortOrder: number };

type Contact = {
  id: number;
  name: string | null;
  phone: string;
  email: string | null;
  pipelineStageId: number | null;
};

export default function Pipeline() {
  const { token } = useAuth();
  const [stages, setStages] = useState<Stage[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [movingId, setMovingId] = useState<number | null>(null);
  const [dragOverColumnKey, setDragOverColumnKey] = useState<string | null>(null);

  const load = () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    Promise.all([
      apiFetch("/api/pipeline-stages", { token }).then((r) => (r.ok ? r.json() : [])),
      apiFetch("/api/contacts", { token }).then((r) => (r.ok ? r.json() : Promise.reject(new Error("Erro")))),
    ])
      .then(([s, c]) => {
        setStages(Array.isArray(s) ? s : []);
        setContacts(Array.isArray(c) ? c : []);
      })
      .catch(() => setError("Erro ao carregar pipeline"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [token]);

  async function moveTo(contactId: number, stageId: number | null) {
    if (!token) return;
    setMovingId(contactId);
    try {
      const r = await apiFetch(`/api/contacts/${contactId}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ pipelineStageId: stageId }),
      });
      if (r.ok) {
        setContacts((prev) =>
          prev.map((c) => (c.id === contactId ? { ...c, pipelineStageId: stageId } : c))
        );
      } else {
        load();
      }
    } catch {
      load();
    } finally {
      setMovingId(null);
    }
  }

  function handleDragStart(e: React.DragEvent, contactId: number) {
    e.dataTransfer.setData("application/json", JSON.stringify({ contactId }));
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.dropEffect = "move";
  }

  function handleDragOver(e: React.DragEvent, columnKey: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumnKey(columnKey);
  }

  function handleDragLeave() {
    setDragOverColumnKey(null);
  }

  function handleDrop(e: React.DragEvent, targetStageId: number | null) {
    e.preventDefault();
    setDragOverColumnKey(null);
    try {
      const { contactId } = JSON.parse(e.dataTransfer.getData("application/json"));
      if (typeof contactId === "number") moveTo(contactId, targetStageId);
    } catch {
      // ignore
    }
  }

  const columns: { key: string; label: string; stageId: number | null }[] = [
    { key: "none", label: "Sem etapa", stageId: null },
    ...stages.map((s) => ({ key: String(s.id), label: s.name, stageId: s.id as number })),
  ];

  const contactsByStage = columns.reduce<Record<string, Contact[]>>((acc, col) => {
    acc[col.key] = contacts.filter((c) =>
      col.stageId === null ? c.pipelineStageId == null : c.pipelineStageId === col.stageId
    );
    return acc;
  }, {} as Record<string, Contact[]>);

  if (loading) return <p>Carregando…</p>;
  if (error) return <p style={{ color: "#c00" }}>{error}</p>;

  return (
    <div style={{ width: "100%", minWidth: 0 }}>
      <h1 style={{ margin: "0 0 0.5rem", fontSize: "1.5rem" }}>Pipeline</h1>
      <p style={{ margin: "0 0 1rem", color: "#666", fontSize: "0.95rem" }}>
        Arraste os cards com o mouse e solte na coluna desejada para mudar a etapa.
      </p>
      <div
        style={{
          width: "100%",
          minWidth: 0,
          overflowX: "auto",
          overflowY: "hidden",
          paddingBottom: "0.5rem",
          marginBottom: "1rem",
        }}
      >
        <div style={{ display: "flex", gap: "1rem", minHeight: 320, width: "max-content" }}>
          {columns.map((col) => (
            <div
              key={col.key}
              onDragOver={(e) => handleDragOver(e, col.key)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.stageId)}
              style={{
                flex: "0 0 260px",
                background: dragOverColumnKey === col.key ? "#d0dce8" : "#e8eef4",
                borderRadius: 10,
                border: dragOverColumnKey === col.key ? "2px dashed #0f3460" : "1px solid #c5d5e8",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                transition: "background 0.15s, border 0.15s",
              }}
            >
              <div style={{ padding: "0.75rem 1rem", background: "#0f3460", color: "#fff", fontWeight: 600, fontSize: "0.95rem" }}>
                {col.label}
                <span style={{ marginLeft: "0.5rem", opacity: 0.9, fontWeight: 400 }}>
                  ({contactsByStage[col.key]?.length ?? 0})
                </span>
              </div>
              <div style={{ flex: 1, padding: "0.5rem", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.5rem", minHeight: 200 }}>
                {(contactsByStage[col.key] ?? []).map((c) => (
                  <div
                    key={c.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, c.id)}
                    style={{
                      background: "#fff",
                      borderRadius: 8,
                      padding: "0.75rem",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                      cursor: "grab",
                    }}
                    onMouseDown={(e) => e.currentTarget.style.cursor = "grabbing"}
                    onMouseUp={(e) => { e.currentTarget.style.cursor = "grab"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.cursor = "grab"; }}
                  >
                    <Link
                      to={`/contatos/${c.id}`}
                      style={{ textDecoration: "none", color: "inherit", display: "block" }}
                    >
                      <strong style={{ fontSize: "0.95rem" }}>{c.name || c.phone}</strong>
                      <div style={{ fontSize: "0.85rem", color: "#666" }}>{c.phone}</div>
                    </Link>
                    <div style={{ marginTop: "0.5rem" }}>
                      <span style={{ fontSize: "0.75rem", color: "#888" }}>Ou use o select: </span>
                      <select
                        value={c.pipelineStageId ?? ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          moveTo(c.id, v === "" ? null : Number(v));
                        }}
                        disabled={movingId === c.id}
                        style={{ width: "100%", padding: "0.35rem", fontSize: "0.85rem", borderRadius: 6, border: "1px solid #ccc", marginTop: "0.2rem" }}
                      >
                        <option value="">Sem etapa</option>
                        {stages.map((s) => (
                          <option key={s.id} value={String(s.id)}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <p style={{ marginTop: "0.5rem" }}>
        <Link to="/contatos" style={{ display: "inline-block", padding: "0.6rem 1.2rem", fontSize: "1rem", fontWeight: 600, color: "#0f3460", border: "2px solid #0f3460", borderRadius: 8, textDecoration: "none" }}>
          Ver lista de contatos
        </Link>
      </p>
    </div>
  );
}

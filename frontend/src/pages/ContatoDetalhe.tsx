import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import Button from "../components/Button";

type Tag = { id: number; name: string; slug: string | null; color: string | null };

type ContactDetail = {
  id: number;
  name: string | null;
  phone: string;
  email: string | null;
  source: string | null;
  pipelineStageId: number | null;
  leadScore: number;
  notes: string | null;
  tags?: Tag[];
};

type Stage = { id: number; name: string; slug: string };

export default function ContatoDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [data, setData] = useState<ContactDetail | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingStage, setSavingStage] = useState(false);

  useEffect(() => {
    if (!token) return;
    apiFetch("/api/pipeline-stages", { token })
      .then((r) => (r.ok ? r.json() : []))
      .then(setStages)
      .catch(() => setStages([]));
  }, [token]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    apiFetch(`/api/contacts/${id}`, { token: token ?? undefined })
      .then((r) => {
        if (!r.ok) throw new Error("Contato não encontrado");
        return r.json();
      })
      .then(setData)
      .catch(() => setError("Contato não encontrado"))
      .finally(() => setLoading(false));
  }, [id, token]);

  const handleChangeStage = (stageId: string) => {
    if (!id || !token) return;
    const value = stageId === "" ? null : Number(stageId);
    setSavingStage(true);
    apiFetch(`/api/contacts/${id}`, {
      token,
      method: "PATCH",
      body: JSON.stringify({ pipelineStageId: value }),
    })
      .then((r) => {
        if (!r.ok) throw new Error("Erro ao atualizar");
        return r.json();
      })
      .then((updated) => setData((prev) => (prev ? { ...prev, pipelineStageId: updated.pipelineStageId } : prev)))
      .catch(() => {})
      .finally(() => setSavingStage(false));
  };

  if (loading) return <p>Carregando…</p>;
  if (error || !data) return <p style={{ color: "#c00" }}>{error || "Não encontrado"}</p>;

  return (
    <div>
      <div style={{ marginBottom: "1rem" }}>
        <Button variant="secondary" onClick={() => navigate("/contatos")}>← Voltar aos contatos</Button>
      </div>
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          padding: "1.5rem 2rem",
        }}
      >
        <h1 style={{ margin: "0 0 0.5rem", fontSize: "1.5rem" }}>{data.name || data.phone}</h1>
        <p style={{ margin: "0 0 1rem", fontSize: "1rem", color: "#555" }}>
          {data.phone}
          {data.email && ` · ${data.email}`}
        </p>
        {data.source && (
          <p style={{ margin: "0 0 1rem", fontSize: "0.9rem", color: "#888" }}>
            Origem: {data.source}
          </p>
        )}
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", marginBottom: "0.35rem", fontSize: "0.9rem", color: "#666" }}>
            Etapa do pipeline
          </label>
          <select
            value={data.pipelineStageId ?? ""}
            onChange={(e) => handleChangeStage(e.target.value)}
            disabled={savingStage}
            style={{ padding: "0.4rem 0.75rem", borderRadius: 6, border: "1px solid #ccc", fontSize: "0.95rem", minWidth: 200 }}
          >
            <option value="">— Nenhuma —</option>
            {stages.map((s) => (
              <option key={s.id} value={String(s.id)}>
                {s.name}
              </option>
            ))}
          </select>
          {savingStage && <span style={{ marginLeft: "0.5rem", fontSize: "0.85rem", color: "#888" }}>Salvando…</span>}
        </div>
        {data.leadScore !== 0 && (
          <p style={{ margin: "0 0 1rem", fontSize: "0.9rem", color: "#666" }}>
            Score: {data.leadScore}
          </p>
        )}
        {data.tags && data.tags.length > 0 && (
          <div style={{ marginBottom: "1rem" }}>
            <strong style={{ fontSize: "0.9rem" }}>Tags</strong>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginTop: "0.35rem" }}>
              {data.tags.map((t) => (
                <span
                  key={t.id}
                  style={{
                    fontSize: "0.8rem",
                    padding: "0.2rem 0.5rem",
                    borderRadius: 4,
                    background: t.color || "#eee",
                    color: t.color ? "#fff" : "#333",
                  }}
                >
                  {t.name}
                </span>
              ))}
            </div>
          </div>
        )}
        {data.notes && (
          <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #eee" }}>
            <strong style={{ fontSize: "0.9rem" }}>Observações</strong>
            <p style={{ margin: "0.5rem 0 0", fontSize: "0.95rem", color: "#555", whiteSpace: "pre-wrap" }}>
              {data.notes}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

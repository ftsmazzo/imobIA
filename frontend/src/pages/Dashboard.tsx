import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { apiFetch } from "../lib/api";

type Stats = { properties: number; contacts: number; tasksPending: number } | null;

export default function Dashboard() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState<Stats>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch("/api/dashboard", { token: token ?? undefined })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Erro ao carregar"))))
      .then(setStats)
      .catch(() => setError("Erro ao carregar resumo"));
  }, [token]);

  return (
    <div>
      <h1 style={{ margin: "0 0 0.5rem", fontSize: "1.5rem" }}>Dashboard</h1>
      <p style={{ color: "#666", margin: 0 }}>
        Olá, {user?.name || user?.email}. Bem-vindo à Plataforma Imobiliária.
      </p>

      {error && <p style={{ color: "#c00", marginTop: "1rem" }}>{error}</p>}

      {stats && (
        <div style={styles.cards}>
          <div style={styles.card}>
            <span style={styles.cardNumber}>{stats.properties}</span>
            <span style={styles.cardLabel}>Imóveis</span>
            <Link to="/imoveis" style={styles.cardBtn}>Ver imóveis</Link>
          </div>
          <div style={styles.card}>
            <span style={styles.cardNumber}>{stats.contacts}</span>
            <span style={styles.cardLabel}>Contatos</span>
            <Link to="/contatos" style={styles.cardBtn}>Ver contatos</Link>
          </div>
          <div style={styles.card}>
            <span style={styles.cardNumber}>{stats.tasksPending}</span>
            <span style={styles.cardLabel}>Tarefas pendentes</span>
            <Link to="/tarefas" style={styles.cardBtn}>Ver tarefas</Link>
          </div>
        </div>
      )}

      <p style={{ marginTop: "1.5rem", color: "#555", fontSize: "0.95rem" }}>
        Use o menu para acessar Planos, Imóveis, Contatos e Tarefas. O atendimento via chat (webhook) aceita comandos como &quot;buscar imóveis&quot;, &quot;contatos&quot;, &quot;tarefas&quot;.
      </p>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  cards: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
    gap: "1rem",
    marginTop: "1.5rem",
  },
  card: {
    background: "#fff",
    padding: "1.25rem 1.5rem",
    borderRadius: 10,
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    display: "flex",
    flexDirection: "column",
    gap: "0.35rem",
  },
  cardNumber: {
    fontSize: "1.75rem",
    fontWeight: 700,
    color: "#0f3460",
  },
  cardLabel: {
    fontSize: "0.9rem",
    color: "#666",
  },
  cardBtn: {
    display: "block",
    marginTop: "0.5rem",
    padding: "0.5rem 1rem",
    fontSize: "0.95rem",
    fontWeight: 600,
    color: "#0f3460",
    border: "2px solid #0f3460",
    borderRadius: 8,
    textAlign: "center" as const,
    textDecoration: "none",
  },
};

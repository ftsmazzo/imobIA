import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function App() {
  const [health, setHealth] = useState<{ status?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!API_URL) {
      setError("VITE_API_URL não configurada");
      return;
    }
    fetch(`${API_URL}/api/health`)
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => setError("Backend inacessível"));
  }, []);

  return (
    <div style={{ padding: "2rem", maxWidth: 600, margin: "0 auto" }}>
      <h1>Plataforma Imobiliária</h1>
      <p>Frontend — Projeto-X</p>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      {health && (
        <p style={{ color: "green" }}>
          Backend: {health.status === "ok" ? "OK" : health.status}
        </p>
      )}
    </div>
  );
}

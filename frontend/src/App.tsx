import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function App() {
  const [health, setHealth] = useState<{ status?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!API_URL) {
      setError("VITE_API_URL não configurada. No deploy, use a URL pública do backend (ex.: https://api.seudominio.com).");
      return;
    }
    fetch(`${API_URL}/api/health`)
      .then((r) => r.json())
      .then(setHealth)
      .catch(() =>
        setError(
          "Backend inacessível. Confira se VITE_API_URL no build é a URL pública do backend (não use host interno como backend:3000)."
        )
      );
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

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Button from "../components/Button";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { login, loading, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? "/";

  useEffect(() => {
    if (token) navigate(from, { replace: true });
  }, [token, navigate, from]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no login");
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Plataforma Imobiliária</h1>
        <p style={styles.subtitle}>Entre com seu e-mail e senha</p>
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            style={styles.input}
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            style={styles.input}
          />
          {error && <p style={styles.error}>{error}</p>}
          <Button type="submit" variant="primary" disabled={loading} style={{ width: "100%", padding: "0.85rem" }}>
            {loading ? "Entrando…" : "Entrar"}
          </Button>
        </form>
        <p style={styles.demoHint}>Demo: <code>admin@demo.com</code> / <code>admin123</code></p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
  },
  card: {
    background: "#fff",
    padding: "2rem 2.5rem",
    borderRadius: 12,
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
    width: "100%",
    maxWidth: 380,
  },
  title: {
    margin: "0 0 0.25rem",
    fontSize: "1.5rem",
    color: "#1a1a2e",
  },
  subtitle: {
    margin: "0 0 1.5rem",
    color: "#666",
    fontSize: "0.95rem",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  input: {
    padding: "0.75rem 1rem",
    border: "1px solid #ddd",
    borderRadius: 8,
    fontSize: "1rem",
  },
  error: {
    margin: 0,
    color: "#c00",
    fontSize: "0.9rem",
  },
  demoHint: {
    margin: "1.25rem 0 0",
    padding: "0.75rem",
    background: "#f5f5f5",
    borderRadius: 8,
    fontSize: "0.85rem",
    color: "#555",
  },
};

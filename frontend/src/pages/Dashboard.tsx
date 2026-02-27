import { useAuth } from "../contexts/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div>
      <h1 style={{ margin: "0 0 0.5rem", fontSize: "1.5rem" }}>Dashboard</h1>
      <p style={{ color: "#666", margin: 0 }}>
        Olá, {user?.name || user?.email}. Bem-vindo à Plataforma Imobiliária.
      </p>
      <p style={{ marginTop: "1.5rem", color: "#555" }}>
        Use o menu para acessar Planos, Imóveis e Contatos.
      </p>
    </div>
  );
}

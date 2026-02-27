import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const NAV = [
  { to: "/", label: "Dashboard" },
  { to: "/planos", label: "Planos" },
  { to: "/imoveis", label: "Imóveis" },
  { to: "/contatos", label: "Contatos" },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div style={styles.wrapper}>
      <aside style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <span style={styles.logo}>Plataforma</span>
        </div>
        <nav style={styles.nav}>
          {NAV.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              style={{
                ...styles.navLink,
                ...(location.pathname === to ? styles.navLinkActive : {}),
              }}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div style={styles.sidebarFooter}>
          <span style={styles.userName}>{user?.name || user?.email}</span>
          <button type="button" onClick={logout} style={styles.logoutBtn}>
            Sair
          </button>
        </div>
      </aside>
      <main style={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: "flex",
    minHeight: "100vh",
  },
  sidebar: {
    width: 220,
    background: "#1a1a2e",
    color: "#eee",
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
  },
  sidebarHeader: {
    padding: "1.25rem 1rem",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  logo: {
    fontSize: "1.1rem",
    fontWeight: 700,
    letterSpacing: "0.02em",
  },
  nav: {
    flex: 1,
    padding: "1rem 0",
  },
  navLink: {
    display: "block",
    padding: "0.6rem 1rem",
    color: "rgba(255,255,255,0.75)",
    textDecoration: "none",
    fontSize: "0.95rem",
  },
  navLinkActive: {
    color: "#fff",
    background: "rgba(255,255,255,0.1)",
    borderLeft: "3px solid #0f3460",
    paddingLeft: "calc(1rem - 3px)",
  },
  sidebarFooter: {
    padding: "1rem",
    borderTop: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  userName: {
    fontSize: "0.85rem",
    color: "rgba(255,255,255,0.7)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  logoutBtn: {
    padding: "0.5rem",
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.2)",
    color: "#eee",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: "0.9rem",
  },
  main: {
    flex: 1,
    padding: "1.5rem 2rem",
    overflow: "auto",
    background: "#f5f5f5",
  },
};

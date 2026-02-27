import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "plataforma_imobiliaria_token";
const USER_KEY = "plataforma_imobiliaria_user";

export type User = {
  id: number;
  email: string;
  name: string | null;
  role: string;
  tenantId: number;
  tenant: { id: number; companyName: string } | null;
};

type AuthContextValue = {
  token: string | null;
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null
  );
  const [user, setUserState] = useState<User | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  const setUser = useCallback((u: User | null) => {
    setUserState(u);
    if (typeof window !== "undefined") {
      if (u) localStorage.setItem(USER_KEY, JSON.stringify(u));
      else localStorage.removeItem(USER_KEY);
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      try {
        const { getApiUrl } = await import("../lib/api");
        const base = getApiUrl();
        if (!base) throw new Error("API URL não configurada");
        const res = await fetch(`${base}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Falha no login");
        setToken(data.token);
        setUser(data.user);
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEY, data.token);
          localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        }
      } finally {
        setLoading(false);
      }
    },
    [setUser]
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(USER_KEY);
    }
  }, [setUser]);

  const value: AuthContextValue = {
    token,
    user,
    loading,
    login,
    logout,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@/src/types";
import api from "@/src/lib/api";
import { getToken, setToken as saveToken, clearToken } from "@/src/lib/utils";

// Cleanup safety: if an older session stored "demo-dev-token", purge it
const LEGACY_DEMO_TOKEN = "demo-dev-token";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => {
    const t = getToken();
    if (t === LEGACY_DEMO_TOKEN) {
      clearToken();
      return null;
    }
    return t;
  });
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    const t = getToken();
    return !!t && t !== LEGACY_DEMO_TOKEN;
  });

  useEffect(() => {
    const existingToken = getToken();
    if (!existingToken || existingToken === LEGACY_DEMO_TOKEN) {
      if (existingToken === LEGACY_DEMO_TOKEN) {
        clearToken();
      }
      setIsLoading(false);
      return;
    }

    // Validate token and hydrate user
    api
      .get<{ user?: User; id?: string; email?: string; createdAt?: string }>("/api/auth/me")
      .then((res) => {
        const userData: User = res.data.user
          ? res.data.user
          : {
              id: res.data.id || "",
              email: res.data.email || "",
              createdAt: res.data.createdAt || "",
            };
        setUser(userData);
        setTokenState(existingToken);
      })
      .catch(() => {
        clearToken();
        setTokenState(null);
        setUser(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const login = (newToken: string, newUser: User) => {
    saveToken(newToken);
    setTokenState(newToken);
    setUser(newUser);
  };

  const logout = () => {
    clearToken();
    setTokenState(null);
    setUser(null);
    window.location.replace("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@/src/types";
import api from "@/src/lib/api";
import { getToken, setToken as saveToken, clearToken } from "@/src/lib/utils";

import { DEMO_TOKEN, MOCK_USER } from "@/src/lib/mockData";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => getToken());
  const [user, setUser] = useState<User | null>(() => (getToken() === DEMO_TOKEN ? MOCK_USER : null));
  const [isLoading, setIsLoading] = useState<boolean>(() => getToken() !== DEMO_TOKEN && !!getToken());

  useEffect(() => {
    const existingToken = getToken();
    if (!existingToken) {
      setIsLoading(false);
      return;
    }

    if (existingToken === DEMO_TOKEN) {
      setUser(MOCK_USER);
      setTokenState(DEMO_TOKEN);
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

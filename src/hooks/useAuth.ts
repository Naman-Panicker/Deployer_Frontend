import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import api from "@/src/lib/api";
import { useAuthContext } from "@/src/context/AuthContext";
import type { User } from "@/src/types";

interface AuthResponse {
  token: string;
  user: User;
}

export function useLogin() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { login: setAuth } = useAuthContext();
  const navigate = useNavigate();

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.post<AuthResponse>("/api/auth/login", {
        email,
        password,
      });
      setAuth(res.data.token, res.data.user);
      navigate("/dashboard");
      return true;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const msg =
          err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to sign in. Please check your credentials.";
        setError(msg);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { login, isLoading, error };
}

export function useSignup() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { login: setAuth } = useAuthContext();
  const navigate = useNavigate();

  const signup = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.post<AuthResponse>("/api/auth/signup", {
        email,
        password,
      });
      setAuth(res.data.token, res.data.user);
      navigate("/dashboard");
      return true;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const msg =
          err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to create account. Please try again.";
        setError(msg);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { signup, isLoading, error };
}

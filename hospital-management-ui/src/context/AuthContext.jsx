import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { authApi } from "../api/authApi";
import { extractErrorMessage } from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem("mc_token");
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await authApi.me();
      setUser(res.data);
      localStorage.setItem("mc_user", JSON.stringify(res.data));
    } catch (e) {
      localStorage.removeItem("mc_token");
      localStorage.removeItem("mc_user");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email, password) => {
    try {
      const res = await authApi.login(email, password);
      localStorage.setItem("mc_token", res.data.access_token);
      const meRes = await authApi.me();
      setUser(meRes.data);
      localStorage.setItem("mc_user", JSON.stringify(meRes.data));
      return { success: true };
    } catch (e) {
      return { success: false, message: extractErrorMessage(e) };
    }
  };

  const logout = () => {
    localStorage.removeItem("mc_token");
    localStorage.removeItem("mc_user");
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

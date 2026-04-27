import { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../api/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      authAPI.me()
        .then(({ data }) => setUser(data.data))
        .catch(() => localStorage.clear())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credentials) => {
    const { data } = await authAPI.login(credentials);
    localStorage.setItem("accessToken", data.data.accessToken);
    localStorage.setItem("refreshToken", data.data.refreshToken);
    setUser(data.data.user);
    return data.data.user;
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    try { await authAPI.logout(refreshToken); } catch {}
    localStorage.clear();
    setUser(null);
  };

  const register = async (formData) => {
    const { data } = await authAPI.register(formData);
    localStorage.setItem("accessToken", data.data.accessToken);
    localStorage.setItem("refreshToken", data.data.refreshToken);
    setUser(data.data.user);
    return data.data.user;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, isAdmin: user?.role === "ADMIN", isStaff: user?.role === "STAFF" || user?.role === "ADMIN" }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
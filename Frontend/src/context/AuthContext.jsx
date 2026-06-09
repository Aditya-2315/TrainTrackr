import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getMe } from "../api/auth.api";
import { getToken, setToken, removeToken } from "../utils/tokenStorage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) { setLoading(false); return; }
    getMe()
      .then((data) => setUser(data.user))
      .catch(() => removeToken())
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback((token, userData) => {
    setToken(token);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    removeToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
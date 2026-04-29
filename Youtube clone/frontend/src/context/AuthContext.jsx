import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { loginApi, meApi, registerApi } from "../api/authApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return setLoading(false);
    meApi()
      .then((res) =>
        setUser({
          ...res.data,
          // Normalize id field for convenience.
          id: res.data.id || res.data._id
        })
      )
      .finally(() => setLoading(false));
  }, []);

  const login = async (payload) => {
    const res = await loginApi(payload);
    localStorage.setItem("token", res.data.token);
    setUser({
      ...res.data.user,
      id: res.data.user.id || res.data.user._id
    });
  };

  const register = async (payload) => {
    const res = await registerApi(payload);
    localStorage.setItem("token", res.data.token);
    setUser({
      ...res.data.user,
      id: res.data.user.id || res.data.user._id
    });
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

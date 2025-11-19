// src/auth/AuthProvider.tsx
import React, {
    createContext,
    useContext,
    useEffect,
    useState,
  } from "react";
  
  import { fetchMe, login as apiLogin, logout as apiLogout } from "src/api/client";
  
  type User = { id: number; username: string; role: string } | null;
  
  type AuthContextValue = {
    user: User;
    loading: boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
  };
  
  const AuthContext = createContext<AuthContextValue | undefined>(undefined);
  
  // ----------------------------------------------------------------------
  
  export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User>(null);
    const [loading, setLoading] = useState(true);
  
    useEffect(() => {
      console.log("[AuthProvider] mount -> check session");
      let active = true;
  
      (async () => {
        try {
          const me = await fetchMe();
          if (!active) return;
          console.log("[AuthProvider] /api/auth/me success", me);
          setUser(me);
        } catch (err) {
          console.log("[AuthProvider] /api/auth/me failed", err);
          setUser(null);
        } finally {
          if (active) setLoading(false);
        }
      })();
  
      return () => {
        active = false;
        console.log("[AuthProvider] unmount");
      };
    }, []);
  
    useEffect(() => {
      console.log("[AuthProvider] user state changed", user);
    }, [user]);
  
    const login = async (username: string, password: string) => {
      console.log("[AuthProvider] login attempt", { username });
      const me = await apiLogin(username, password);
      console.log("[AuthProvider] login success", me);
      setUser(me);
    };
  
    const logout = async () => {
      console.log("[AuthProvider] logout");
      await apiLogout();
      setUser(null);
    };
  
    const value: AuthContextValue = { user, loading, login, logout };
  
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
  }
  
  // ----------------------------------------------------------------------
  
  export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) {
      console.error("[useAuth] used outside AuthProvider");
      throw new Error("useAuth must be used inside AuthProvider");
    }
    return ctx;
  }
  
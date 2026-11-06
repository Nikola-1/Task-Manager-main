"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { UserType } from "@/types/UserType";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: UserType | null;
  setUser: (user: UserType | null) => void;
  loggedIn: boolean;
  setLoggedIn: (loggedIn: boolean) => void;
  logout: () => void;
  DisplayTasks: boolean;
  setDisplayTasks: (displayTasks: boolean) => void;
  authLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserType | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [DisplayTasks, setDisplayTasks] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    let active = true;
    fetch('/api/session', { cache: 'no-store' }).then(async response => {
      if (!response.ok) throw new Error('Sign in again.');
      const saved: UserType = await response.json();
      if (active) { setUser(saved); setLoggedIn(true); localStorage.setItem('user', JSON.stringify(saved)); }
    }).catch(() => { if (active) localStorage.removeItem('user'); })
      .finally(() => { if (active) setAuthLoading(false); });
    return () => { active = false; };
  }, []);

  const logout = async () => {
    try {
    const response = await fetch('/api/session', { method: 'DELETE' });
    if (!response.ok) throw new Error('Could not sign out. Please try again.');
    localStorage.removeItem("user");

    setUser(null);
    setLoggedIn(false);

    router.push("/");
    } catch { window.alert('Could not sign out. Check your connection and try again.'); }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loggedIn,
        setLoggedIn,
        DisplayTasks,
        setDisplayTasks,
        logout,
        authLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth mora biti korišćen unutar AuthProvider-a");
  }

  return context;
}

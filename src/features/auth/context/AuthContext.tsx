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
    try {
      const savedUser = localStorage.getItem("user");

      if (savedUser) {
        const parsedUser: UserType = JSON.parse(savedUser);

        setUser(parsedUser);
        setLoggedIn(true);
      }
    } catch (error) {
      console.error("Greška pri učitavanju korisnika:", error);
      localStorage.removeItem("user");
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const logout = () => {
    localStorage.removeItem("user");

    setUser(null);
    setLoggedIn(false);

    router.push("/login");
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
"use client";

import Nav from "@/components/layout/nav";
import LoginComponent from "@/features/auth/components/Login/LoginComponent";
import { useState } from "react";
import { useAuth } from '@/features/auth/context/AuthContext';
import MessageNotifications from '@/features/chat/components/MessageNotifications';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { user, loggedIn, setLoggedIn, authLoading } = useAuth();
  const [, setUser] = useState<object>({});

  if (authLoading) return <p role="status" className="p-6 text-blue-900">Loading account...</p>;

  if (!loggedIn) {
    return <LoginComponent setLoginProps={setLoggedIn} setUserProps={setUser}  />;
  }

  return (
    <div className="flex md:flex-row flex-col justify-center md:justify-start w-dvw">
      <Nav />
      {user && <MessageNotifications key={user.id} userId={user.id} />}
      
      {children}
    </div>
  );
}


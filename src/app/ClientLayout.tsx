"use client";

import Nav from "@/components/layout/nav";
import LoginComponent from "@/features/auth/components/Login/LoginComponent";
import { useState, useEffect } from "react";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [User,setUser] = useState<object>();
  useEffect(() => {
    // primer: proveri localStorage ili Supabase auth
    const token = localStorage.getItem("user");
    setLoggedIn(!!token);
    console.log(User);
  }, []);

  if (!loggedIn) {
    return <LoginComponent setLoginProps={setLoggedIn} setUserProps={setUser}  />;
  }

  return (
    <div className="flex md:flex-row flex-col justify-center md:justify-start w-dvw">
      <Nav />
      
      {children}
    </div>
  );
}


'use client'
import { useRouter } from "next/navigation";
import Task from "@/features/tasks/components/TaskComponent";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useEffect } from "react";


const TaskPage=()=>{
 const { loggedIn, authLoading } = useAuth();
  const router = useRouter();
      useEffect(() => {
    if (!authLoading && !loggedIn) {
      router.replace("/login");
    }
  }, [authLoading, loggedIn, router]);

  if (authLoading || !loggedIn) {
    return <p>Loading...</p>;
  }
    return(
    
        <Task></Task>
        
    )
}
export default TaskPage;
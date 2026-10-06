/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useScope } from "@/features/groups/context/ScopeContext";
import { useEffect, useRef, useState } from "react";

export default function useFilterTasks(
  filter: string,
  isCategory: boolean | null,
  
  category_id: number | null,
  isTag:boolean | null,
  TagId:number | null,
  
  
) {

  const [tasks, setTasks] = useState<any[]>([]); // state koji cuva niz taskova 
  const [loading, setLoading] = useState(true); // state za loading 
  const { user } = useAuth(); // radi provere Userovih taskova
  const { groupId } = useScope(); // u slucaju ako je grupa u pitanju
  const reqRef = useRef(0); // 
  const fetchData = async () => {
      const reqId = ++reqRef.current; //  zbog preklapanja starih rezultata sa novim 
    setLoading(true);
 
    let data, error;

    try {
     


      if (isCategory === true && category_id !== null && category_id > 0) { // ako je kategorija u pitanju
        let q = supabase  // pronadji sve taskove sa datom kategorijom a da nisu deleteovani
          .from("Users_Tasks")
          .select("tasks(*,tags_tasks(*,Tags(*)))")
          .eq("tasks.category_id", category_id)
          .eq("tasks.Deleted", false)
          .eq("User_id", user?.id)
            if (groupId != null) q = q.eq("tasks.Group_id", groupId);
            else q = q.is("tasks.Group_id", null);
          ({data,error} = await q.order("Task_id", { ascending: true })
        );
      }

   
      else {
        const localDateString = (date: Date) =>
          `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
        const date = new Date();
        const today = localDateString(date);

        if (filter === "Today") {
          let q = supabase
            .from("Users_Tasks")
            .select("tasks(*,tags_tasks(*,Tags(*)))")
            .eq("tasks.date", today)
            .eq("tasks.Deleted", false)
            .eq("User_id", user?.id);
            if (groupId != null) q = q.eq("tasks.Group_id", groupId);
            else q = q.is("tasks.Group_id", null);
          ({ data, error } = await q.order("Task_id", { ascending: true }));
        }

        else if (filter === "7Days") {
          const next7 = localDateString(new Date(date.getFullYear(), date.getMonth(), date.getDate() + 7));

          let q = supabase
            .from("Users_Tasks")
            .select("tasks(*,tags_tasks(*,Tags(*)))")
            .gte("tasks.date", today)
            .lte("tasks.date", next7)
            .eq("tasks.Deleted", false)
            .eq("User_id", user?.id);
            if (groupId != null) q = q.eq("tasks.Group_id", groupId);
            else q = q.is("tasks.Group_id", null);
          ({ data, error } = await q.order("Task_id", { ascending: true }));
        }

        else if (filter === "Completed") {
          let q = supabase
            .from("Users_Tasks")
            .select("tasks(*,tags_tasks(*,Tags(*)))")
            .eq("tasks.Completed", true)
            .eq("tasks.Deleted", false)
            .eq("User_id", user?.id);
            if (groupId != null) q = q.eq("tasks.Group_id", groupId);
            else q = q.is("tasks.Group_id", null);
          ({ data, error } = await q.order("Task_id", { ascending: true }));
          
        }
     
        else if (filter === "Deleted") {
        
           let q = supabase
            .from("Users_Tasks")
            .select("tasks(*,tags_tasks(*,Tags(*)))")
            .eq("tasks.Deleted", true)
            .eq("User_id", user?.id);
            if (groupId != null) q = q.eq("tasks.Group_id", groupId);
            else q = q.is("tasks.Group_id", null);
          ({ data, error } = await q.order("Task_id", { ascending: true }));
         console.log("FILTER","DELETED")
        }
        
        else {
          
          ({ data, error } = await supabase
            .from("Users_Tasks")
            .select("tasks(*,tags_tasks(*,Tags(*)))")
            .eq("User_id", user?.id));
        }
      }

      if(isTag === true && TagId !== null){
         let q =  supabase
          .from("tags_tasks")
          .select("tasks(*,tags_tasks(*,Tags(*)))")
          .eq("tasks.Deleted", false)
          .eq("id_tag", TagId)
          .eq("user_id", user?.id)
          if (groupId != null) q = q.eq("tasks.Group_id", groupId);
            else q = q.is("tasks.Group_id", null);
          ({data,error} = await q.order("id_task", { ascending: true }));
        
        console.log(data);
      }
      

      
//Today false 0 0 null null
//Parameters: Today false null null false null
      if (error) {
        console.error("Supabase error:", error.message);
        setTasks([]);
      } else {
        console.log("Parameters:",filter, isCategory, category_id,TagId,isTag,groupId)
       console.log("RAW fetched data:", data);
       const extracted = (data ?? [])
  .map((row: any) => row.tasks)
  .filter(Boolean)
  .map((t: any) => ({
    ...t,
    // OSTAVLJAMO ISTO IME koje Task komponenta koristi
    tags_tasks: (t.tags_tasks ?? []).filter(
      (jt: any) => jt.Tags != null
    ),
  }));
  if (reqId !== reqRef.current) return; // ignoriši zastareo rezultat
        setTasks(extracted);
          setLoading(false);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setTasks([]);
    }
    
  
    setLoading(false);
  };

  
  useEffect(() => {
    fetchData();
    
    const subscription = supabase
      .channel("custom-all-channel")
      .on("postgres_changes",
        { event: "UPDATE", schema: "public", table: "tasks" },
        (payload) => {
          setTasks((prev) => //koristi prethodno stanje taskova 
            prev.map((t) =>
             t.id === payload.new.id ? { ...t, ...payload.new } : t //kada pronadje task zamenjuje ga sa novim stanjem 
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
    
  }, [filter, isCategory, category_id,TagId,isTag,groupId]);

  return {
    tasks,
    loading,
    refresh: fetchData,
  };
}

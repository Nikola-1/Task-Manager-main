import { supabase } from '@/lib/supabase/client';
import type { UserType as Usertype } from '@/types/UserType';
import type { TaskType } from '@/types/TaskType';

export async function saveContent(id:number,html:string){
    
          
          
          const {data:updatedTask, error} = await supabase.from('tasks').update({content:html}).eq("id",id).select().single();
         
      
           if (!error && updatedTask) {
      
        console.log("Uspeh")
      
        return updatedTask;
          
          
        
         
         
            
        
      } else {
        console.error("Save failed:", error?.message);
        return;
      }
      }

export async function AddTask(
        name: string,
        fullDate: Date,
        groupId:number | null,
        user:Usertype,
        categoryId?: number,
        tagId?: number,
       

      ){
        // DATE kolona → šaljemo YYYY-MM-DD
        const dateStr = `${fullDate.getFullYear()}-${String(fullDate.getMonth() + 1).padStart(2, "0")}-${String(fullDate.getDate()).padStart(2, "0")}`;
      
        // 1️⃣ INSERT TASK (SAMO JEDNOM)
        const taskPayload: any = {
          name,
          date: dateStr,
          user_id: user?.id,
          ...(groupId != null ? { Group_id: groupId } : { Group_id: null }),
        };
      
        if (categoryId && categoryId !== 0) {
          taskPayload.category_id = categoryId;
        }
      
        const { data: taskData, error: taskError } = await supabase
          .from("tasks")
          .insert(taskPayload)
          .select("*")
          .single();
      
        if (taskError || !taskData) {
          console.error("Task insert failed:", taskError?.message);
          return;
        }
      
        const taskId = taskData.id;
      
        // 2️⃣ LINK USER ↔ TASK
        const { error: userTaskError } = await supabase
          .from("Users_Tasks")
          .insert({
            User_id: user?.id,
            Task_id: taskId,
          });
      
        if (userTaskError) {
          console.error("Users_Tasks insert failed:", userTaskError.message);
        }
      
        // 3️⃣ LINK TAG ↔ TASK (OPCIONO)
        if (tagId && tagId !== null) {
          const { error: tagTaskError } = await supabase
            .from("tags_tasks")
            .insert({
              id_tag: tagId,
              id_task: taskId,
              user_id: user?.id,
            });
      
          if (tagTaskError) {
            console.error("tags_tasks insert failed:", tagTaskError.message);
          }
        }
      
       
      }

export async function deleteDeleted(tasksArray:Array<TaskType>){
      
       tasksArray.forEach(async (e)=>await supabase.from("tasks").delete().eq("id", e.id));
      
    }

export async function DeleteData(id:number){
              
              const { error } = await supabase.from("tasks").update({Deleted:"TRUE"}).eq("id", id);
        if (!error) {
          console.log(error)
        } else {
          console.error("Delete failed:", error.message);
        }
        
          }

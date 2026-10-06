
import { supabase } from '@/app/connection/supabaseclient';
import { Usertype } from '@/app/components/Types/UserType';
import { Editor } from '@tiptap/core';
import { TaskType } from '../components/Types/TaskType';



 export async function sendEmailNotification(user:any){
 
  const numbers = [Math.floor(Math.random()*10), Math.floor(Math.random()*10), Math.floor(Math.random()*10), Math.floor(Math.random()*10)];
  const letternumbers = numbers.splice(0,4).toString().replace(/,/g,'');
  localStorage.setItem("verificationCode",letternumbers);
  fetch("/api/send-email", {
  method: "POST",
  body: JSON.stringify({
    to: user.email,
    subject: "Dobrodošao",
    text: `Dear ${user?.Username}, your verification code is: ${letternumbers}`,
  }),
});
}


export async function getGroups(user:Usertype) {
    console.log("Fetching groups for user:", user);
            const {data,error} = await supabase.from('Groups').select('*,Users_Groups(*)');
            if(error){
                console.log("Error fetching groups:",error);
            }else{
                console.log("Fetched groups:",data);
                return data || [];
            }

    }


export async function  saveChanges(Name:string | undefined,Surname:string,Username:string,user:Usertype) {
   //logic for saving changes to user profile
   const {data,error} = await supabase.from('Users').update({Name:Name,Surname:Surname,Username:Username}).eq('id',user?.id).select().single();
   if(error){
    console.log("Error updating user:",error);
    }else{
    console.log("User updated successfully:",data);
    return data;
    }
  }

  export async function Register(Username:string | null, Name:string | null, Email:string | null, Password:string | null,Surname:string | null){
            if(Username != null && Name != null && Surname != null && Email != null && Password != null){
                const {error} = await supabase.from("Users").insert({Name:Name,Surname:Surname,Password:Password,email:Email,Username:Username});
                
                if(!error){
                      console.log("Uspesno ste se registrovali");
                     return true;
                     
                }
                else{
                  console.log(error);
                }
            }
    }
   export async function Login(Username:string | null,Password:string | null){
    
      if(Username != null && Password != null){
                const {data,error} = await supabase.from("Users").select("*").eq("Username",Username).eq("Password",Password).single();
                
                if(!error && data != null){
                      console.log("Uspesno ste se ulogovali");
                    
                    console.log(data);
                         return data;
                }
                else{
                  if(error?.code === 'PGRST116'){
                    console.log("Nije pronadjen korisnik");
                  }
                  console.log(data);
                  console.log("Pogresni kredencijali");
                  console.log(error);
                }
            }
    }

    export async function setUserAfterDisplay(user:object | null){
      console.log(user);
            const {data,error} = await supabase.from("Users").select("*").eq("id",user?.id).single();
             
            return data;
           
            
      }
       export async function saveContent(id:number,editor:Editor | null){
          const html = editor?.getHTML() || "";
    
          
          
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
        const dateStr = fullDate.toISOString().slice(0, 10);
      
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
      
       
      };


       export async function deleteDeleted(tasksArray:Array<TaskType>){
      
       tasksArray.forEach(async (e)=>await supabase.from("tasks").delete().eq("id", e.id));
      
    }

    export async function getStickers(){
            const {data,error} = await supabase.from('Stickers').select('*');
    
            if(!error){
                return data;
            }
            else{
                console.log(error.message);
            }
    
        }


         export async function GetTags(user:Usertype,groupId:number | null){
                if(groupId != null){
                    const {data,error} = await supabase.from("Tags").select("*").eq("group_id",groupId).order("id",{ascending:true});
                    if(error){
                      
                        console.log(error);
                          return [];
                    } 
                    
                    return data || [];
                }

                const {data,error} = await supabase.from("Tags").select("*").eq("User_id",user?.id).is("group_id",null).order("id",{ascending:true});
        
                if(error){
                    console.log(error);
                    return null;
                }
                else{
                    
                    return data || [];
                    console.log(data);
                    
                }
        
            }


            export async function UpdateTag(name:string,parentTag:number | null,color:string | null,user:Usertype,selectedTag:object | null){
               console.log(selectedTag);
                    const {data,error} = await supabase.from("Tags").update({name:name,color:color,parent_id:parentTag,User_id:user?.id}).eq("User_id",user?.id).eq("id",selectedTag?.id);
            
                    if(error){
                        console.log(error)
                    }
                    else{
                        
                      return {data,error};
                       
                    }
                }

            export async function AddTag(name:string,groupId:number | null,parentTag:number | null, user:Usertype,color:string | null){
                    let data,error;
                    if(groupId != null){
                        ({data, error} = await supabase.from("Tags").insert({name:name,color:color,parent_id:parentTag,User_id:user?.id,group_id:groupId}));
                    }
                    else{
                        ({data, error} = await supabase.from("Tags").insert({name:name,color:color,parent_id:parentTag,User_id:user?.id}));
                    }
                    
            
                    if(error){
                        console.log(error)
                    }
                    else{
                      return data;
                        
                    }
                }


                export async function NoChild(selectedTag:object | null,groupId:number | null){
                  console.log(selectedTag);
        const {data,error } = await supabase.from("Tags").select("*").eq("group_id",groupId).eq("parent_id",selectedTag?.id);

        if(error){
            console.log(error);
            return false;
        }
        else{
            if(data.length > 0){
                    return true;
            }
           else{
            return false;
           }
        }
    }

    export async function getGroupById(groupId:number){
        const {data,error} = await supabase.from("Groups").select("*").eq("id",groupId);
        return data;
    }

    export async function deleteGroup(groupId:number){
        const {data,error} = await supabase.from("Groups").delete().eq("id",groupId);
        if(error){
            console.log(error);
        }
        else{
            return data;
        }
    }
    export async function updateGroup(groupId:number,Name:string,Admin:number){
        const {data,error} = await supabase.from("Groups").update({name:Name,Admin:Admin}).eq("id",groupId);
        if(error){
            console.log(error);
        }
        else{
            return data;
        }
    }

    export async function getUsersByGroup(groupId:number){
        const {data,error} = await supabase.from("Users_Groups").select("Users(*)").eq("id_group",groupId);
        if(error){

            console.log(error);
        }
        else{
         console.log("Users in group:", data);
            return data?.map((item) => item.Users) || [];
        }
           
        
      }

      export async function getUsers(){
        const {data,error} = await supabase.from("Users").select("*");
        if(error){
            console.log(error);

        }
        else{
            return data;
        }
      }
      export async function addUsersToGroup(groupId:number,userId:Array<number>){
        const {data,error} = await supabase.from("Users_Groups").insert(userId.map(id => ({id_group: groupId, id_user: id})));
        if(error){
            console.log(error);
        }
        else{
            return data;
        }
      }
      export async function deleteUsersFromGroup(groupId:number,userId:number){
        const {data,error} = await supabase.from("Users_Groups").delete().eq("id_group",groupId).eq("id_user",userId);
        if(error){

            console.log(error);
        }
        else{
            return data;
        }
      }
    export async function Search(search:string){
        const {data,error} = await supabase.from("Users").select("*").ilike("Username",`%${search}%`);
        if(error){
            console.log(error);
        }
        else{
            return data;
        }
    }
    export async function addGroup(Name:string,sticker_path:string | null,Admin:number){
        const {data,error} = await supabase.from("Groups").insert({Name:Name,image_path:sticker_path,Admin:Admin}).select().single();
        if(error){
            console.log(error);
        }
        else{
         
          if(data != null){
          const groupId = data.id;
          await supabase.from("Users_Groups").insert({id_group: groupId, id_user: Admin});
          }
          return data;
        }
      }
      
      export async function getFriends(user:Usertype){
        const {data,error} = await supabase.from("Friends").select(`friend:Users!Friends_id_friend_fkey(*),created_at,accepted_at`).eq("id_user",user.id);
        if(error){
          console.log(error);
          return [];
        }
        else{
          
          return data;
        }
      }
       export async function DeleteData(id:number){
              
              const { error } = await supabase.from("tasks").update({Deleted:"TRUE"}).eq("id", id);
        if (!error) {
          console.log(error)
        } else {
          console.error("Delete failed:", error.message);
        }
        
          }

          
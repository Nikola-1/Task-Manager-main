import { supabase } from '@/lib/supabase/client';
import type { UserType as Usertype } from '@/types/UserType';

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

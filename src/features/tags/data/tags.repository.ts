import { supabase } from '@/lib/supabase/client';
import type { UserType as Usertype } from '@/types/UserType';

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

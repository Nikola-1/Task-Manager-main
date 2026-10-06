import { supabase } from '@/lib/supabase/client';
import type { UserType as Usertype } from '@/types/UserType';

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

import { supabase } from '@/lib/supabase/client';

export async function getStickers(){
            const {data,error} = await supabase.from('Stickers').select('*');
    
            if(!error){
                return data;
            }
            else{
                console.log(error.message);
            }
    
        }

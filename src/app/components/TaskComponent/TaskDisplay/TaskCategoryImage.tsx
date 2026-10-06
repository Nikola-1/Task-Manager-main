import { supabase } from "@/app/connection/supabaseclient";
import { useEffect, useState } from "react";



interface TaskCategoryImageProps{
               
                id:number
                refreshFlag:boolean
}
export default function TaskCategoryImage({id,refreshFlag}:TaskCategoryImageProps){
           const [imageUrl,setImageUrl] = useState<string | null>(null);
            useEffect(()=>{
                async function  getImage(){
                   
                const {data,error} = await supabase.from("Categories").select("Stickers(sticker_path)").eq('id',id).single();

                if(!error && data){
                    setImageUrl(data.Stickers?.sticker_path)
                }
                else{
                    return;
                }
                
            }
            getImage();
            },[id,refreshFlag])
           
    return(
      
        <>
   
        { imageUrl ? <img  src={"/img/"+imageUrl+".png"} height={20} width={20}></img> : <></>}
        </>
    )

}
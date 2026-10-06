import { faSmile } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import icon from "@/assets/img/3d-briefcase.png"
import { useEffect, useState } from "react";
import { getStickers } from '@/lib/supabase/stickers.repository';
interface ModalProps{
    setActive:React.Dispatch<React.SetStateAction<boolean>>;
    isActive:boolean
    setActiveStickerProp:React.Dispatch<React.SetStateAction<object | null | undefined>>;
    ActiveStickerProp:object | null | undefined;
}
export default function SmileModal({isActive,setActive,setActiveStickerProp,ActiveStickerProp}: ModalProps){
    const [stickers,setStickers] = useState<object[]>();
   
    const [name,setName] = useState<string>();
    async function getStickersFunc(){
        const stickers = await getStickers();
        setStickers(stickers);
    }
    useEffect(()=>{
        getStickersFunc();
    },[])
    useEffect(()=>{
        console.log(ActiveStickerProp);
    },[ActiveStickerProp])
    return(
         <div className={isActive == true ? "flex absolute   w-full     top-4/4   shadow-md rounded-md bg-white   m-auto h-48  " : " hidden"} >
                <div className=" inset-0 flex items-center align-middle justify-center w-full">
                    
                <div className="flex flex-col p-3 relative w-full h-full ">
                  
                    <div className="grid xl:grid-cols-12 grid-cols-5  gap-4 h-32 mb-3 overflow-y-scroll">
                        {stickers?.map((e)=> <Image className={ActiveStickerProp?.id == e.id ? "bg-blue-300 p-1 transition-all rounded-md cursor-pointer" : "p-1 cursor-pointer"} onClick={()=>setActiveStickerProp(e)} src={"/img/"+e.sticker_path+".png"} alt="category image" key={e.id} height={40} width={40}/>)}
                              
                    </div>
                   
                   
                    <div onClick={()=> setActive(!isActive)} className="hover:bg-blue-300  hover:text-white hover:cursor-pointer float-right w-fit  bottom-0 p-2 m-1 border-2 text-blue-300 border-blue-300 rounded-md ">
                        <p className="">Close</p>
                    </div>
                </div>
                   
               
                </div>
                </div>
    )
}
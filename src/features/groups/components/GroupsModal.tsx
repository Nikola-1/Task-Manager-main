'use client'
import { faSmile } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import { useEffect, useState } from "react";
import SmileModal from "@/components/ui/SmileModalComponent/SmileModal";
import { supabase } from "@/lib/supabase/client";
import { randInt } from "three/src/math/MathUtils.js";
import { GroupType } from "@/types/GroupType";
import { addGroup } from '@/features/groups/data/groups.repository';
import toast from "react-hot-toast";
import { useAuth } from "@/features/auth/context/AuthContext";



interface GroupsModalProps{
    setActiveGroup:React.Dispatch<React.SetStateAction<boolean>>;
    isActiveGroup:boolean
    onUpdate: ()=>void;
    setTaskFilter:React.Dispatch<React.SetStateAction<string>>;
    setFilterImage:React.Dispatch<React.SetStateAction<string>>;
    editListItem:object | null;
    setEditListItem:React.Dispatch<React.SetStateAction<object | null>>;
    Mode:string | undefined;
    nameGroup:string | undefined;
    setNameGroup:React.Dispatch<React.SetStateAction<string | undefined>>;
    refreshFlagGroups:()=>void,
}
interface GroupStateProps{
                EditOn:boolean,
                setEditOn:React.Dispatch<React.SetStateAction<boolean>>;
                Group:GroupType | null,
                setGroup:React.Dispatch<React.SetStateAction<GroupType | null>>;
                AddUserOn:boolean,
                setAddUserOn:React.Dispatch<React.SetStateAction<boolean>>;
}
type GroupsModalAllProps = GroupsModalProps & GroupStateProps;
export default function GroupsModal({ isActiveGroup,
  setActiveGroup,
  onUpdate,
  editListItem,
  setEditListItem,
  Mode,
  nameGroup,
  setNameGroup,
  setFilterImage,
  setTaskFilter,
  Group,
  setGroup,
  setAddUserOn,
  AddUserOn,
  refreshFlagGroups
  }: GroupsModalAllProps
){
    const [toggleModalCalendar,setToggleModalCalendar] = useState(false); 
  
    const [ActiveSticker,setActiveSticker] = useState<object | null>();
    const [picture,setPicture] = useState<object>();
    const {user} = useAuth();
    
    
    
    
    async function GetPicture(){
       const {data,error} = await supabase.from("ModalPictures").select("*");
    
       if(!error){
            setPicture(data[randInt(0,data.length-1)]);
            
       }
       else{
        console.log(error.message);
       }
    }
    useEffect(()=>{
        GetPicture();
       
    },[])
    useEffect(()=>{
        console.log("EDIT LIST ITEM",editListItem);
        setActiveSticker(editListItem?.sticker);
        
    },[editListItem])
    useEffect(()=>{
        console.log(Mode)
    },[Mode]);
    return(
        <div className={isActiveGroup == true ? "fixed inset-0 z-50 flex items-center justify-center bg-blue-950/40 p-4 backdrop-blur-sm" : " hidden"} >
        <div className="flex w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex min-h-72 w-full justify-between relative">
        <div className="flex min-w-0 flex-1 flex-col gap-5 p-6 relative">
            <h3 className="text-lg font-semibold text-blue-950">{Mode === "Update" ? "Edit group" : "Create group"}</h3>
            <div className="flex flex-col w-full">
                <div className="flex w-full">
                {ActiveSticker != null ? <Image onClick={()=> toggleModalCalendar ? setToggleModalCalendar(false) : setToggleModalCalendar(true)} src={"/img/"+ActiveSticker?.sticker_path+".png"} width={30} height={30}  className="cursor-pointer hover:bg-blue-900 hover:border-blue-900 text-white bg-blue-300 border-blue-300 border-2  p-1 rounded-l-md" alt="Sticker_image" />  : <FontAwesomeIcon icon={faSmile} onClick={()=> toggleModalCalendar ? setToggleModalCalendar(false) : setToggleModalCalendar(true)} className="cursor-pointer hover:bg-blue-900 hover:border-blue-900 text-white bg-blue-300 border-blue-300 border-2  p-1 rounded-l-md" width={20} height={20}></FontAwesomeIcon> }
               <input
  onChange={(e) => setNameGroup(e.currentTarget.value)}
  value={nameGroup ?? ""}
  type="text"
  className="min-w-0 w-full rounded-r-lg border border-blue-200 px-3 py-3 text-sm text-blue-950 outline-none focus:border-blue-400"
/>
                </div>
                <div className="relative">
                <SmileModal ActiveStickerProp={ActiveSticker} setActiveStickerProp={setActiveSticker} isActive={toggleModalCalendar} setActive={setToggleModalCalendar}></SmileModal>
                </div>
            </div>
           
            
            <div onClick={()=>{
                setActiveGroup(!isActiveGroup);
                setActiveSticker(null);
                GetPicture();
                setGroup(null)
                
                setNameGroup("");
            } } className="hover:bg-blue-300  hover:text-white hover:cursor-pointer float-right absolute bottom-0 p-2 m-1 border-2 text-blue-300 border-blue-300 rounded-md ">
                <p className="">Close</p>
            </div>
            <div onClick={async () => {
  if (Mode === "Insert") {
    await addGroup(nameGroup ?? "", ActiveSticker?.sticker_path ?? null,user?.id ?? 0);
    toast.success(`Successfully added group ${nameGroup}`);
    setActiveGroup(false);
    setNameGroup("");
    setActiveSticker(null);
    refreshFlagGroups();
        
  }
  if (Mode === "Update") {
    
    //await createGroup(nameGroup ?? "", ActiveSticker?.sticker_path ?? null);
   
    setActiveGroup(false);
    setNameGroup("");
    setActiveSticker(null);
    refreshFlagGroups();
    toast.success("Successfully edited group");
  }
  
}} className="hover:bg-blue-300  hover:text-white hover:cursor-pointer float-right w-fit bottom-0 p-2 m-1 border-2 text-blue-300 border-blue-300 rounded-md ">
                {Mode == "Update" ? <p>Update</p> : <p className="">Add</p>}
            </div>
        </div>
            <div className="hidden w-2/5 shrink-0 sm:block">
                    <Image src={"/img/" + picture?.picture_path + ".jpg"} alt={""} width={840} height={840}  className="h-full w-full object-cover" />
            </div>
          
        </div>
        </div>
        </div>
    )
}
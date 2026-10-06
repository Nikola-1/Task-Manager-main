'use client'
import { faSmile } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import { useEffect, useState } from "react";
import SmileModal from "../SmileModalComponent/SmileModal";
import { supabase } from "@/app/connection/supabaseclient";
import { randInt } from "three/src/math/MathUtils.js";
import { GroupType } from "@/app/Types/GroupType";
import { addGroup } from "@/app/api/supabase";
import toast from "react-hot-toast";
import { useAuth } from "@/app/context/AuthContext";



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
        <div className={isActiveGroup == true ? "flex absolute w-8/12 translate-x-1/4  top-2/4 left-0 shadow-md rounded-md bg-white  bottom-2/4 m-auto h-2/4  " : " hidden"} >
        <div className=" inset-0 flex items-center align-middle justify-center w-full">
            <div className="flex  justify-between w-full h-full relative">
        <div className="flex flex-col p-3 relative  xl:w-full ">
            <h3>Add list</h3>
            <div className="flex flex-col w-full">
                <div className="flex w-full">
                {ActiveSticker != null ? <Image onClick={()=> toggleModalCalendar ? setToggleModalCalendar(false) : setToggleModalCalendar(true)} src={"/img/"+ActiveSticker?.sticker_path+".png"} width={30} height={30}  className="cursor-pointer hover:bg-blue-900 hover:border-blue-900 text-white bg-blue-300 border-blue-300 border-2  p-1 rounded-l-md" alt="Sticker_image" />  : <FontAwesomeIcon icon={faSmile} onClick={()=> toggleModalCalendar ? setToggleModalCalendar(false) : setToggleModalCalendar(true)} className="cursor-pointer hover:bg-blue-900 hover:border-blue-900 text-white bg-blue-300 border-blue-300 border-2  p-1 rounded-l-md" width={20} height={20}></FontAwesomeIcon> }
               <input
  onChange={(e) => setNameGroup(e.currentTarget.value)}
  value={nameGroup ?? ""}
  type="text"
  className="border-blue-300 border-2 rounded-r-md border-l-0 outline-none indent-1 w-full"
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
            <div className="w-2/4 h-full rounded-r-md">
                    <Image src={"/img/" + picture?.picture_path + ".jpg"} alt={""} width={840} height={840}  className="w-full h-full rounded-md" />
            </div>
          
        </div>
        </div>
        </div>
    )
}
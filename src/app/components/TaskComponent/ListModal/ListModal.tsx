
import { faSmile } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import { useEffect, useState } from "react";
import SmileModal from "../../SmileModalComponent/SmileModal";
import { supabase } from "@/app/connection/supabaseclient";
import { useAuth } from "@/app/context/AuthContext";
import { randInt } from "three/src/math/MathUtils.js";
import { useScope } from "@/app/context/ScopeContext";


interface ModalProps{
    setActive:React.Dispatch<React.SetStateAction<boolean>>;
    isActive:boolean
    onUpdate: React.Dispatch<React.SetStateAction<void>>;
    setTaskFilter:React.Dispatch<React.SetStateAction<string>>;
    setFilterImage:React.Dispatch<React.SetStateAction<string>>;
    editListItem:object | null;
    setEditListItem:React.Dispatch<React.SetStateAction<object | null>>;
    Mode:string | undefined;
    nameCategory:string | undefined;
    setnameCategory:React.Dispatch<React.SetStateAction<string | undefined>>;
}
export default function ListModal({isActive,setActive,onUpdate,editListItem,setEditListItem,Mode,nameCategory,setnameCategory,setFilterImage,setTaskFilter}: ModalProps){
    const [toggleModalCalendar,setToggleModalCalendar] = useState(false); 
    
    const [ActiveSticker,setActiveSticker] = useState<object | null>();
    const [picture,setPicture] = useState<object>();
    
    const {user} = useAuth();
    const {groupId} = useScope();
      const handleSave = () => {
    
    onUpdate(); 
  };
    async function AddListItem(){
        let data,error;
        if(groupId != null){
            ({data, error} = await supabase.from('Categories').insert({sticker_id:ActiveSticker?.id,name:nameCategory,user_id:user?.id,group_id:groupId}));
        }
        else{
            ({data, error} = await supabase.from('Categories').insert({sticker_id:ActiveSticker?.id,name:nameCategory,user_id:user?.id}));
        }
        
        if(error){
            console.log(error);
            
        }
        else{
            
            handleSave();
        }
    }
    async function UpdateListItem(){
        let data,error;
        if(groupId != null){
            ({data, error} = await supabase.from('Categories').update({sticker_id:ActiveSticker?.id,name:nameCategory,group_id:groupId}).eq("id",editListItem?.id));
        }
        else{
            ({data, error} = await supabase.from('Categories').update({sticker_id:ActiveSticker?.id,name:nameCategory}).eq("id",editListItem?.id));
        }
        
        if(error){
            console.log(error);
            
        }
        else{
            console.log(ActiveSticker);
            
            setFilterImage(ActiveSticker?.sticker_path);
            setTaskFilter(nameCategory);
            handleSave();
        }
    }
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
        
        setActiveSticker(editListItem?.Stickers);
        
    },[editListItem])
    useEffect(()=>{
        console.log(Mode)
    },[Mode]);
    return(
        <div className={isActive == true ? "flex absolute w-8/12 translate-x-1/4  top-2/4 left-0 shadow-md rounded-md bg-white  bottom-2/4 m-auto h-2/4  " : " hidden"} >
        <div className=" inset-0 flex items-center align-middle justify-center w-full">
            <div className="flex  justify-between w-full h-full relative">
        <div className="flex flex-col p-3 relative  xl:w-full ">
            <h3>Add list</h3>
            <div className="flex flex-col w-full">
                <div className="flex w-full">
                {ActiveSticker != null ? <Image onClick={()=> toggleModalCalendar ? setToggleModalCalendar(false) : setToggleModalCalendar(true)} src={"/img/"+ActiveSticker?.sticker_path+".png"} width={30} height={30}  className="cursor-pointer hover:bg-blue-900 hover:border-blue-900 text-white bg-blue-300 border-blue-300 border-2  p-1 rounded-l-md" alt="Sticker_image" />  : <FontAwesomeIcon icon={faSmile} onClick={()=> toggleModalCalendar ? setToggleModalCalendar(false) : setToggleModalCalendar(true)} className="cursor-pointer hover:bg-blue-900 hover:border-blue-900 text-white bg-blue-300 border-blue-300 border-2  p-1 rounded-l-md" width={20} height={20}></FontAwesomeIcon> }
                <input onChange={(e)=>setnameCategory(e.currentTarget.value)} value={nameCategory} type="text" className=" border-blue-300 border-2 rounded-r-md border-l-0 outline-none indent-1  w-full"></input>
                </div>
                <div className="relative">
                <SmileModal ActiveStickerProp={ActiveSticker} setActiveStickerProp={setActiveSticker} isActive={toggleModalCalendar} setActive={setToggleModalCalendar}></SmileModal>
                </div>
            </div>
           
            <div className="flex w-max">
                <p>Folder</p>
                <select>
                    <option>None</option>
                </select>
            </div>
            <div className=" flex w-max ">
                <p>Type</p>
                <select>
                    <option>None</option>
                </select>
            </div>
            <div onClick={()=>{
                setActive(!isActive);
                setActiveSticker(null);
                GetPicture();
                setEditListItem(null);
                setnameCategory("");
            } } className="hover:bg-blue-300  hover:text-white hover:cursor-pointer float-right absolute bottom-0 p-2 m-1 border-2 text-blue-300 border-blue-300 rounded-md ">
                <p className="">Close</p>
            </div>
            <div onClick={async()=>{
                if(Mode && Mode == "Insert"){
                        AddListItem();
                        setActive(!isActive);
                }
                else if(Mode && Mode == "Update"){
                    UpdateListItem()
                }
               
            } } className="hover:bg-blue-300  hover:text-white hover:cursor-pointer float-right w-fit bottom-0 p-2 m-1 border-2 text-blue-300 border-blue-300 rounded-md ">
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
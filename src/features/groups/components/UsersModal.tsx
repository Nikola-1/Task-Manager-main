'use client'
import { faUser } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import { useEffect, useState } from "react";
import SmileModal from "@/components/ui/SmileModalComponent/SmileModal";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/features/auth/context/AuthContext";
import { randInt } from "three/src/math/MathUtils.js";
import { useScope } from "@/features/groups/context/ScopeContext";
import { addUsersToGroup, deleteUsersFromGroup, getUsersByGroup } from '@/features/groups/data/groups.repository';
import { getUsers, Search } from '@/features/auth/data/auth.repository';
import { GroupType } from "@/types/GroupType";
import { UserType } from "@/types/UserType";
import toast from "react-hot-toast";




interface GroupsModalProps{

    onUpdate: ()=>void;
    setTaskFilter:React.Dispatch<React.SetStateAction<string>>;
    editListItem:object | null;
    Mode:string | undefined;
    setMode:React.Dispatch<React.SetStateAction<string | undefined>>;
    nameCategory?:string;
     isActiveUser:boolean,
    setActiveUser:React.Dispatch<React.SetStateAction<boolean>>;
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
export default function UsersModal({ 
  
  onUpdate,
  editListItem,
 
  Mode,
  setMode,
  nameCategory,
 
  setTaskFilter,
  Group,
  setGroup,
  setAddUserOn,
  AddUserOn,
  isActiveUser,
  setActiveUser,
  refreshFlagGroups,
  }: GroupsModalAllProps
){
    const [toggleModalCalendar,setToggleModalCalendar] = useState(false); 
  
    const [ActiveSticker,setActiveSticker] = useState<object | null>();
    const [picture,setPicture] = useState<object>();
    const [UsersIdArray,setUsersIdArray] = useState<Array<number>>([]);
    const [Users,setUsers] = useState<Array<UserType>>([]);
    const [searchUser,setSearchUser] = useState<string>("");
    const {user} = useAuth();
    const {groupId} = useScope();
    
function toggleUserId(userId: number) {
  setUsersIdArray(prev =>
    prev.includes(userId)
      ? prev.filter(id => id !== userId)
      : [...prev, userId]
  );
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
        console.log("EDIT LIST ITEM",editListItem);
        setActiveSticker(editListItem?.sticker);
        
    },[editListItem])
    useEffect(()=>{
        console.log(Mode)
    },[Mode]);

    useEffect(() => {
  async function GetUsersToModal() {
    if (!Group?.id) return;

    let usersData: UserType[] = [];

    if (Mode === "Insert") {
      usersData = await getUsers();
      console.log("All users:", usersData);
    }

    if (Mode === "Delete") {
      usersData = await getUsersByGroup(Group.id);
      console.log("Users in group:", usersData);
    }

    setUsers(usersData);
    setUsersIdArray([]);
  }

  GetUsersToModal();
}, [Group, Mode]);
    useEffect(()=>{
        console.log(UsersIdArray,Group?.id)
    },[UsersIdArray])
    useEffect(()=>{
      async function search() {
        let data:Array<UserType> = [];
        try{
          data  = await Search(searchUser); 
        }
          catch(err){
              toast.error(err.message);
          }
          
          setUsers(data);
      }

      search();
    },[searchUser])
    return(
        <div className={isActiveUser == true ? "fixed inset-0 z-50 flex items-center justify-center bg-blue-950/40 p-4 backdrop-blur-sm" : " hidden"} >
        <div className="flex h-[min(600px,85dvh)] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex  justify-stretch w-full h-full relative">
        <div className="flex min-w-0 flex-1 flex-col p-5 relative">
            <h3>{Mode == "Insert" && "Add users"}{Mode == "Delete" && "Delete users"}</h3>
            <div className="flex flex-col w-full">
                <div className="flex w-full">
                
                <h1 className="bg-blue-600 text-white font-bold p-3 flex justify-center items-center"><Image className="m-1" src={"/img/"+Group?.image_path+".png"} alt="group image" width={20} height={20}/>{Group?.Name}</h1>
                </div>
                <div className="relative">
              
                </div>
            </div>
           
            
            <div onClick={()=>{
                setActiveUser(!isActiveUser);
                setActiveSticker(null);
                GetPicture();
                setGroup(null)
                setUsersIdArray([]);
                
            } } className="hover:bg-blue-300  hover:text-white max-h-full hover:cursor-pointer float-right absolute bottom-0 p-2 m-1 border-2 text-blue-300 border-blue-300 rounded-md ">
                <p className="">Close</p>
            </div>
            <input onChange={async(e)=>{setSearchUser(e.currentTarget.value);}} className="my-4 rounded-xl border border-blue-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400" placeholder="search user" type="text"></input>
                <ul className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pb-14 w-full">
                   {Users.map((x)=>
                            <li key={x.id}
  onClick={() => toggleUserId(x.id)}
  className={
    UsersIdArray.includes(x.id) 
      ? "w-11/12 p-2 flex justify-between grow flex-1 items-stretch m-1 rounded-md   bg-blue-300 cursor-pointer transition-all"
      : "w-11/12  p-2 flex justify-between items-stretch flex-1 m-1 hover:bg-blue-300 hover:rounded-md cursor-pointer  transition-all"
  }
>
    <div className="flex">
  <FontAwesomeIcon icon={faUser} width={30} height={30} />
  <h1>{x.username}</h1>
  </div>
  <h1>{x.email}</h1>
</li>
                   )} 
                    
                </ul>
             <div
  onClick={async () => {
  if (!Group?.id) return;
  if (UsersIdArray.length === 0) return;

  if (Mode === "Insert") {
     try {
  const data = await addUsersToGroup(Group.id, UsersIdArray);
  toast.success(data.message);
} catch (err) {
  toast.error((err as Error).message);
}
  }

  if (Mode === "Delete") {
    try {
  const data = await deleteUsersFromGroup(Group.id, UsersIdArray);
  toast.success(data.message);
} catch (err) {
  toast.error((err as Error).message);
}
  }
  
  setActiveUser(false);
  setUsersIdArray([]);

  setGroup(null);
  refreshFlagGroups();
 
  setMode(undefined);
   
}}
  className="hover:bg-blue-300 hover:text-white hover:cursor-pointer float-right w-fit bottom-0 p-2 m-1 border-2 text-blue-300 border-blue-300 rounded-md"
>
  {Mode === "Delete" ? <p>Remove</p> : <p>Add</p>}
</div>
        </div>
            <div className="hidden h-full w-1/3 shrink-0 sm:block">
                    <Image src={"/img/" + picture?.picture_path + ".jpg"} alt={""} width={840} height={840}  className="h-full w-full object-cover" />
            </div>
          
        </div>
        </div>
        </div>
    )
}
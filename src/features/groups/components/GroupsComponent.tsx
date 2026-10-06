'use client'
import { deleteGroup, getGroups } from '@/features/groups/data/groups.repository';

import { useAuth } from "@/features/auth/context/AuthContext";

import { GroupType } from "@/types/GroupType";
import { group } from 'console';
import Image from 'next/image';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import { faCross, faPlus, faX } from '@fortawesome/free-solid-svg-icons';
import { useRouter } from 'next/navigation';

import React, { useEffect } from 'react'
//import toast from 'react-hot-toast';
interface GroupStateProps{
                EditOn:boolean,
                setEditOn:React.Dispatch<React.SetStateAction<boolean>>;
                Group:GroupType,
                setGroup:React.Dispatch<React.SetStateAction<GroupType>>;
                AddUserOn:boolean,
                setAddUserOn:React.Dispatch<React.SetStateAction<boolean>>;
                DeleteOn:boolean,
                setDeleteOn:React.Dispatch<React.SetStateAction<boolean>>;
}
interface GroupsModalProps{
    setActiveGroup:React.Dispatch<React.SetStateAction<boolean>>;
    isActiveGroup:boolean
    onUpdate: ()=>void;
    setTaskFilter:React.Dispatch<React.SetStateAction<string>>;
    setFilterImage:React.Dispatch<React.SetStateAction<string>>;
    editListItem:object | null;
    setEditListItem:React.Dispatch<React.SetStateAction<object | null>>;
    Mode:string | undefined;
    nameCategory:string | undefined;
    setnameCategory:React.Dispatch<React.SetStateAction<string | undefined>>;
     isActiveUser:boolean,
    setActiveUser:React.Dispatch<React.SetStateAction<boolean>>;
    refreshFlagGroups:()=>void
}
type GroupsModalAllProps = GroupsModalProps & GroupStateProps;
const GroupsComponent = ({Group,Mode,DeleteOn,setDeleteOn,setGroup,EditOn,setActiveGroup,setEditOn,setAddUserOn,refreshFlagGroups,AddUserOn,setActiveUser}:GroupsModalAllProps) => {
    const [groups,setGroups] =React.useState<any[] | undefined>([]);
    const router = useRouter()
    const {user} =useAuth();
    const getGroupsFunc = async () => {
        console.log(user);
            const groupsData = await getGroups(user);
            console.log(groupsData);
             console.log(user);
            console.log(groupsData);
             setGroups(groupsData);
            

    }
    
    useEffect(()=>{
        getGroupsFunc();
        console.log(groups);
    },[refreshFlagGroups])
     
   
     
     useEffect(()=>{
        console.log(EditOn);
        
    },[EditOn])
       async function ToggleOthers(){
        setAddUserOn(false);
        setEditOn(false);
        setDeleteOn(false);
        
    }
  return (

   
    <div className= "grid *:grid-cols-1 md:grid-cols-2 lg:grid-cols-4  gap-4 w-fit h-fit overflow-y-auto p-4">
        
        {groups.map((group:any)=>(
            <div onClick={async()=>{
                if(!EditOn && !AddUserOn && !DeleteOn){
                    
                         router.push(`/pages/Task/${group.id}`); 
                }
                else{
                        
                          if(EditOn){
                            setGroup(group);
                           
                                 setActiveGroup(true);
                                 setAddUserOn(false);
                          }
                         if(AddUserOn){
                            setGroup(group);
                             console.log(group);
                                setActiveUser(true);
                                   setEditOn(false);
                         }
                         if(DeleteOn){
                            console.log(Group);
                                await deleteGroup(group?.id);
                                refreshFlagGroups();
                                //toast.success(`Successfully removed Group ${group?.name}`)
                         }
                         
                         
                }
                
               
                
                }} key={group.id} className={'border p-4 m-4 rounded  cursor-pointer relative hover:bg-blue-400 hover:scale-105' }>
                <div className='w-full h-4'></div>
                {user?.id == group.ownerId && <p className='absolute top-0 right-0  w-fit px-2 bg-yellow-600 text-white text-center'>Owner</p>}
                {EditOn && <p className='absolute top-0 right-0  w-fit px-2 bg-blue-600 text-white text-center'>Edit</p>}
                {AddUserOn && Mode == "Insert" && <p className='absolute top-0 right-0  w-fit px-2 bg-blue-600 text-white text-center'>Add User</p>}
                   {AddUserOn && Mode == "Delete" && <p className='absolute top-0 right-0  w-fit px-2 bg-blue-600 text-white text-center'>Remove User</p>}
                    {DeleteOn && Mode == "Delete" && <p className='absolute top-0 right-0  w-fit px-2 bg-red-600 text-white text-center'>Delete</p>}
                <h2 className='text-xl font-bold mb-2'>{group.Name} { group.image_path && <Image src={"/img/"+group.image_path+".png"} alt="Group Sticker" width={32} height={32} className="w-8 h-8 inline-block ml-2" /> }</h2>
                
                <p>{group.Users_Groups.length || 0} members</p>
                <p className=' top-0 right-0  w-fit px-2 bg-green-600 text-white text-center'>New message</p>
                
            </div>
        ))}
    {
            DeleteOn == true   &&
   <button onClick={()=>ToggleOthers()} className="bg-red-500 text-white w-fit h-fit p-3 rounded-md"><FontAwesomeIcon icon={faX} /></button>
        } 
        {        AddUserOn == true   &&
   <button onClick={()=>ToggleOthers()} className="bg-red-500 text-white w-fit h-fit p-3 rounded-md"><FontAwesomeIcon icon={faX} /></button>
        }
    </div>
  )
}

export default GroupsComponent

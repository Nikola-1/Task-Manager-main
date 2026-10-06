'use client'
import React from 'react'
import Link from 'next/link';



import Image from "next/image";
import { Micro_5 } from 'next/font/google';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faList } from '@fortawesome/free-solid-svg-icons';
import useGroupState from "@/features/groups/hooks/useGroupState";
import { Editor } from '@tiptap/core';
import { GroupType } from "@/types/GroupType";
const Micro = Micro_5({weight:"400",subsets:['latin'],});

interface GroupsModalProps{
    setActiveGroup:React.Dispatch<React.SetStateAction<boolean>>;
    isActiveGroup:boolean
    onUpdate: ()=>void;
    setTaskFilter:React.Dispatch<React.SetStateAction<string>>;
    setFilterImage:React.Dispatch<React.SetStateAction<string>>;
    editListItem:object | null;
    setEditListItem:React.Dispatch<React.SetStateAction<object | null>>;
    Mode:string | undefined;
    setMode:React.Dispatch<React.SetStateAction<string | undefined>>;
    nameCategory:string | undefined;
    setnameCategory:React.Dispatch<React.SetStateAction<string | undefined>>;
     isActiveUser:boolean,
    setActiveUser:React.Dispatch<React.SetStateAction<boolean>>;
}
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
type OptionsGroupsProps = GroupsModalProps & GroupStateProps;
const OptionsGroupsComponent = ({setActiveGroup,isActiveGroup,EditOn,setEditOn,DeleteOn,setDeleteOn,setMode,AddUserOn,setAddUserOn}: OptionsGroupsProps) => {
    async function ToggleOthers(){
        setAddUserOn(false);
        setEditOn(false);
        setDeleteOn(false);
        
    }

    
  return (
    <div className="wrapper m-auto h-screen  md:w-24 bg-blue-400  ">
                      <div className="flex flex-row md:block justify-between align-middle items-center m-auto w-11/12">
                     
                      <FontAwesomeIcon icon={faList} className="md:hidden size-9 float-left text-blue-900" ></FontAwesomeIcon>
                      <h1 className={"text-center mt-3 text-7xl md:text-3xl text-blue-900  "+ Micro.className}>Options</h1>
                      <p></p>
                      </div>
                      <ul className={ "md:flex md:flex-col  justify-center align-middle "}>
                          {/* <li><FontAwesomeIcon icon={faUser} width={30} height={30} /></li> */}
                          <li className="m-3 flex justify-center align-middle"><button onClick={()=>{ToggleOthers(); setActiveGroup(!isActiveGroup);setMode("Insert");}}><Image  src={"/img/groupCreate.png"} alt="user image"  width={40} height={40} /></button></li>
                          <li  className="m-3 flex justify-center align-middle"><button onClick={()=>{/*setEditOn(!EditOn);setMode("Update");setDeleteOn(false)*/}} ><Image className='opacity-40' src={"/img/GroupUpdate.png"} alt="Menu image"  width={40} height={40} /></button></li>
                          <li className="m-3 flex justify-center align-middle"><button onClick={()=>{ToggleOthers();setDeleteOn(!DeleteOn);setMode("Delete")}} ><Image src={"/img/GroupDelete.png"} alt="Calendar image"  width={40} height={40} /></button></li>
                          <li className="m-3 flex justify-center align-middle"><button   onClick={()=>{ToggleOthers();setAddUserOn(true);setMode("Insert");}}><Image src={"/img/AddUser.png"} alt="sync image"  width={60} height={60} /></button></li>
                           <li className="m-3 flex justify-center align-middle"><button  onClick={()=>{ToggleOthers();setAddUserOn(true);setMode("Delete");}}><Image src={"/img/UserRemove.png"} alt="sync image"  width={60} height={60} /></button></li>
                         
                          <hr className="text-blue-900 border-blue-900 "></hr>
                      </ul>
                      
                   </div>
  )
}

export default OptionsGroupsComponent

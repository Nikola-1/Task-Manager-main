import { supabase } from '@/app/connection/supabaseclient';
//import React, {  useEffect, useState } from 'react'
import { Editor } from '@tiptap/core';
import TaskCategoryImage from '../TaskDisplay/TaskCategoryImage';
import { faCheckSquare, faClose, faDotCircle, faDownload, faEllipsis, faFile, faFileAlt, faFlag, faNoteSticky, faSquareCheck, faTag, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { TaskType } from '../../Types/TaskType';
import useOptionsMenu from '../../hooks/useOptionsMenu';
import { OptionsMenu } from '../../OptionsMenu/OptionsMenu';
import {  useEffect, useRef, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useScope } from '@/app/context/ScopeContext';
import { DeleteData, GetTags } from '@/app/api/supabase';
import { delay, motion } from 'framer-motion';

export interface TaskProps {
  task: TaskType;
  selectedTask: TaskType | null;
  refreshFlag:boolean;
  filter: string;
  setSelectedTask: React.Dispatch<React.SetStateAction<TaskType | null>>;
  refreshTasks: () => Promise<void>;
  editor: Editor;
  
}
export default function Task({ task, filter, setSelectedTask, selectedTask, refreshTasks,refreshFlag }: TaskProps) {

  const { groupId} = useScope();
  const [dataTagsMenu,setDataTagsMenu] = useState<any[] | null>([]);

  const fetchTagsMenu = async () => {
    const tags = await GetTags(user, groupId);
    setDataTagsMenu(tags);
  }
useEffect(() => {
    fetchTagsMenu();
  }, [groupId,refreshFlag]);
  const updateStatus = async (id: number) => {
    const { error } = await supabase.from("tasks").update({ Completed: !task.Completed }).eq("id", id);
    if (!error) refreshTasks();

    
  };
  const Download = async () => {
      const {data,error} = await supabase.storage.from("FileBucket").download(`${task.folder_name}/${task.file_name}`);

      if(error){
        console.log(error);
      }
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href= url;
      a.download = task.file_name;
      a.click();
      URL.revokeObjectURL(url);
  }
  
 

  const fileInput = useRef<HTMLInputElement>(null);
   const {user} = useAuth();
   const [tags,setTags] = useState<object[] | null>([]);
  const { open, toggleMenu,setOpen, options } = useOptionsMenu("", {
     
      complete:{
                label:"Mark as complete",
                icon:faCheckSquare,
                action:()=>{console.log("mark")}
            },
             Tag:{
                label:dataTagsMenu?.length != 0 ? "Add tag" : "No tags available",
                icon:faTag,
                action:async()=>{ 
                if(dataTagsMenu?.length != 0){ setOpenMenuTag2(true); setTags(dataTagsMenu)};
                console.log(tags);
               }
            },
             Prioirity:{
                label:"Set priority",
                icon:faFlag,
                action:()=>{console.log("mark")}
            },
            File:{
                label:task.file_name != null ? "Change file" : "Add file",
                icon:faFile,
                action:async ()=>{
                 
                  
                  fileInput.current.onchange = async (e) => {
                    
      const file = e.target.files[0];
      if (!file) {
        console.log("User zatvorio File Explorer bez izbora fajla");
        return;
      }
      
                  
                    
                  


                   const {data,error} = await supabase.storage.from("FileBucket").upload(`user-${user?.id}/${file.name}`,file); 
                   
                  const {data2,error2} = await supabase.from("tasks").update({folder_name:`user-${user?.id}`}).eq("id",task.id).eq("user_id",user?.id);
                  const {data3,error3} = await supabase.from("tasks").update({file_name:file.name}).eq("id",task.id).eq("user_id",user?.id);
    }
    fileInput.current?.click();
                  
                  }
                  
            },
             ...(filter === "Completed" && {
       undo: {
      label: "Undo complete",
      icon: faSquareCheck,
      action: async()=>{await supabase.from("tasks").update({Completed: "FALSE"}).eq("id",task.id); refreshTasks()}
    }
  })
      
    });
    
    const {open:openMenu2,toggleMenu:toggleMenuTag2,setOpen:setOpenMenuTag2,options:optionsTag2,id:idTag2,setId:setIdTag2} = useOptionsMenu("tag",{
      
      ...(tags.map((tag:any) => ({
        
        [`tag-${tag.id}`]:{
          label:task.tags_tasks?.some((t:any) => t.id_tag === tag.id) ? `✔  ${tag.name}` : `${tag.name}`,
          icon:faTag,
          action:async()=>{
            console.log(`Adding tag ${tag.name} to task ${task.id}`);
            
            if(task.tags_tasks?.some((t:any) => t.id_tag === tag.id)){
              const {data,error} = await supabase.from("tags_tasks").delete().eq("id_tag",tag.id).eq("id_task",task.id).eq("user_id",user?.id);
              
              if(!error){
                console.log("Tag removed from task");
                refreshTasks();
                ClosemenuTag2();
              }
              return;
            }
            else{
              const {data,error} = await supabase.from("tags_tasks").insert({id_tag:tag.id,id_task:task.id,user_id:user?.id});
              if(!error){
                console.log("Tag added to task");
                refreshTasks();
                ClosemenuTag2();
              }

            }
          }
        }
      }))
      ).reduce((acc, curr) => ({ ...acc, ...curr }), {})
    });
  function DateExpression(item: any) {
    switch (new Date(item).getDate() - new Date().getDate()) {
      case 0: return "Today";
      case 1: return "Tomorrow";
      default: return `${new Date(item).toLocaleDateString("sr-RS")}`;
    }
  }
  const [X,setX] = useState<number>(0);
    const [Y,setY] = useState<number>(0);
  const deleteOneDeleted = async(id:number)=>{
          await supabase.from("tasks").delete().eq("id",id);
          setSelectedTask(null);
           refreshTasks();
      }

    const closeMenu = ()=> setOpen(false);
    const ClosemenuTag2 = ()=> setOpenMenuTag2(false);
    const DeleteDataFunc = async ()=>{
          await DeleteData(task.id);
          setSelectedTask(null);
          refreshTasks(); // <<< ovo pokreće ponovni fetch iz hooka
    }
   useEffect(() => {
            
            
              
             
           }, [refreshFlag]);

           useEffect(()=>{
            console.log(task);
            console.log("GroupId in Task component:", groupId);
           },[])
  return (
    <div  
      
      className={`group flex items-center m-2 `}
    >
      <div  onClick={() => {
        if (selectedTask === task) return;
        setSelectedTask(task); 
        
      }} className={` flex justify-between w-full items-center text-blue-900 transition-all p-3 cursor-pointer ${
        selectedTask === task ? "bg-blue-400 rounded-md" : "hover:bg-blue-300 rounded-md"
      } ${task.Completed == true ? `opacity-50 bg-blue-300` : ``}`}>
      <div className={`flex items-center align-top ${user?.display == false ? "" : "p-5 "}`}>
        {/*filter == "Completed" ?  <input checked={task.Completed}  type="checkbox" className="m-1" onChange={() => updateStatus(task.id)} /> :  <input  type="checkbox" className="m-1" onChange={() => updateStatus(task.id)} />*/}
        
        <div className='flex flex-col'>
          <div className='flex'>
            <div className='flex'>
            <input checked={task.Completed}  type="checkbox" className="m-1" onChange={() => updateStatus(task.id)} />
        <p>{task.name}</p>
        </div>
         {task.category_id && <TaskCategoryImage id={task.category_id} refreshFlag={refreshFlag} />}
         </div>
         {task.file_name != null ?
         <div className='flex'>
         <p className='p-2'></p>
         <p className='bg-teal-900 text-white text-xs rounded-md p-1'>{task.file_name}</p> 
           <p className='bg-blue-800 text-white text-xs rounded-md p-1 mx-1'><button onClick={Download}><FontAwesomeIcon  icon={faDownload}/></button></p> 
        </div>
         : ""} 
        {task.tags_tasks?.map((tag: any) => <p className={`m-1  text-white p-1 text-sm rounded-md w-fit`} style={tag.Tags.color ? { backgroundColor:tag.Tags.color} : { backgroundColor:"#4463BD"}} key={tag.id}>{tag.Tags.name}</p>)}
        </div>
       
       
      </div>
      <div className='flex items-center'>
      <div className="flex items-center">
        
        <p className={`mx-2 ${task.date < new Date().toISOString().split("T")[0] ? "text-red-700" : ""}`}>{task.date ? DateExpression(task.date) : "no date"}</p>
        <FontAwesomeIcon
          icon={filter !== "Deleted" ? faClose : faTrashAlt}
          onClick={async() => 
            
            filter !== "Deleted" ? DeleteDataFunc()
              : deleteOneDeleted(task.id)
              
          }
          className="cursor-pointer mx-2"
        />
        
      </div>
      </div>
      </div>
      <FontAwesomeIcon
          icon={faEllipsis}
          onClick={(e)=>{

          toggleMenu()
            setX(e.clientX);
        setY(e.clientY);
          }
            }
          className="cursor-pointer invisible  group-hover:visible m-1 size-3"
           
        />
         <input type='file' ref={fileInput} className="hidden " />
        <OptionsMenu open={open} options={options} x={X} y={Y} closeMenu={closeMenu} />
        <OptionsMenu open={openMenu2} options={optionsTag2} x={X+150} y={Y+50} closeMenu={ClosemenuTag2} />
    </div>
  );
}


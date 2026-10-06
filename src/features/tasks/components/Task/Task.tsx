import { supabase } from "@/lib/supabase/client";
//import React, {  useEffect, useState } from 'react'
import { Editor } from '@tiptap/core';
import TaskCategoryImage from "@/features/tasks/components/TaskDisplay/TaskCategoryImage";
import { faCheckSquare, faClose, faDotCircle, faDownload, faEllipsis, faFile, faFileAlt, faFlag, faNoteSticky, faSquareCheck, faTag, faTrashAlt, faPen } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { TaskType } from "@/types/TaskType";
import useOptionsMenu from "@/components/ui/hooks/useOptionsMenu";
import { OptionsMenu } from "@/components/ui/OptionsMenu/OptionsMenu";
import {  useEffect, useRef, useState } from 'react';
import { useAuth } from "@/features/auth/context/AuthContext";
import { useScope } from "@/features/groups/context/ScopeContext";
import { DeleteData, renameTask } from '@/features/tasks/data/tasks.repository';
import { GetTags } from '@/features/tags/data/tags.repository';
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
  const [renaming, setRenaming] = useState(false);
  const [draftName, setDraftName] = useState(task.name);
  const [savingName, setSavingName] = useState(false);
  const [renameError, setRenameError] = useState('');
  const savingNameRef = useRef(false);

  const saveName = async () => {
    if (savingNameRef.current) return;
    const name = draftName.trim();
    if (!name) { setRenameError('Enter a task name.'); return; }
    if (name === task.name) { setRenaming(false); return; }
    savingNameRef.current = true;
    setSavingName(true);
    setRenameError('');
    try {
      const savedName = await renameTask(task.id, name);
      setSelectedTask(current => current?.id === task.id ? { ...current, name: savedName } : current);
      setRenaming(false);
      await refreshTasks();
    } catch {
      setRenameError('Could not rename task. Please try again.');
    } finally {
      savingNameRef.current = false;
      setSavingName(false);
    }
  };

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
      rename: {
        label: 'Rename',
        icon: faPen,
        action: () => {
          setDraftName(task.name);
          setRenameError('');
          setRenaming(true);
          setOpen(false);
        },
      },
     
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
        if (selectedTask?.id === task.id) return;
        setSelectedTask(task); 
        
      }} className={` flex justify-between w-full items-center text-blue-900 transition-all p-3 cursor-pointer ${
        selectedTask?.id === task.id ? "bg-blue-400 rounded-md" : "hover:bg-blue-300 rounded-md"
      } ${task.Completed == true ? `opacity-50 bg-blue-300` : ``}`}>
      <div className={`flex items-center align-top ${user?.display == false ? "" : "p-5 "}`}>
        {/*filter == "Completed" ?  <input checked={task.Completed}  type="checkbox" className="m-1" onChange={() => updateStatus(task.id)} /> :  <input  type="checkbox" className="m-1" onChange={() => updateStatus(task.id)} />*/}
        
        <div className='flex flex-col'>
          <div className='flex'>
            <div className='flex'>
            <input checked={task.Completed}  type="checkbox" className="m-1" onChange={() => updateStatus(task.id)} />
        {renaming ? <form className="min-w-0" onClick={event => event.stopPropagation()}
          onSubmit={event => { event.preventDefault(); void saveName(); }}>
          <div className="flex flex-wrap items-center gap-1">
            <input autoFocus aria-label="Task name" value={draftName} disabled={savingName}
              onFocus={event => event.currentTarget.select()}
              onChange={event => { setDraftName(event.target.value); setRenameError(''); }}
              onKeyDown={event => {
                event.stopPropagation();
                if (event.key === 'Escape' && !savingName) { event.preventDefault(); setRenaming(false); }
              }} className="min-w-0 w-40 rounded-md border border-blue-300 bg-white px-2 py-1 text-sm text-blue-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200" />
            <button type="submit" disabled={savingName} className="rounded-md bg-blue-900 px-2 py-1 text-xs text-white disabled:opacity-50">{savingName ? 'Saving…' : 'Save'}</button>
            <button type="button" disabled={savingName} onClick={() => setRenaming(false)} className="rounded-md border border-blue-300 bg-white px-2 py-1 text-xs text-blue-900 disabled:opacity-50">Cancel</button>
          </div>
          {renameError && <p role="alert" className="mt-1 text-xs text-red-700">{renameError}</p>}
        </form> : <p className="break-words">{task.name}</p>}
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

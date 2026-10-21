import { supabase } from "@/lib/supabase/client";
//import React, {  useEffect, useState } from 'react'
import { Editor } from '@tiptap/core';
import TaskCategoryImage from "@/features/tasks/components/TaskDisplay/TaskCategoryImage";
import { faCheck, faCheckSquare, faClose, faDotCircle, faDownload, faEllipsis, faFile, faFileAlt, faFlag, faNoteSticky, faTag, faTrashAlt, faPen } from '@fortawesome/free-solid-svg-icons';
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
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import { shatterTask } from '@/features/tasks/components/Task/shatterTask';
import { marioDeleteTask } from '@/features/tasks/components/Task/marioDeleteTask';
import SendTaskDialog from '@/features/tasks/components/Task/SendTaskDialog';
import useTaskPriority, { priorityOptions } from '@/features/tasks/hooks/useTaskPriority';

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
  const [sharing, setSharing] = useState(false);
  const [draftName, setDraftName] = useState(task.name);
  const [savingName, setSavingName] = useState(false);
  const [renameError, setRenameError] = useState('');
  const savingNameRef = useRef(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const deletingRef = useRef(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const savingStatusRef = useRef(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [statusError, setStatusError] = useState('');
  const [priorityMenuOpen, setPriorityMenuOpen] = useState(false);
  const [priorityError, setPriorityError] = useState('');

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
    if (savingStatusRef.current) return;
    savingStatusRef.current = true;
    setSavingStatus(true);
    setStatusError('');
    const completed = !task.Completed;
    try {
      const { error } = await supabase.from('tasks').update({ Completed: completed })
        .eq('id', id).select('id').single();
      if (error) throw error;
      setSelectedTask(current => current?.id === id ? { ...current, Completed: completed } : current);
      await refreshTasks();
    } catch {
      setStatusError('Could not update task status. Please try again.');
    } finally {
      savingStatusRef.current = false;
      setSavingStatus(false);
    }
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
   const { priority, setPriority } = useTaskPriority(user?.id, task.id);
   const currentPriority = priorityOptions.find(option => option.value === priority)!;
   const priorityMenuOptions = priorityOptions.map(option => ({
     label: `${priority === option.value ? '✓ ' : ''}${option.label}`,
     icon: faFlag,
     action: () => {
       try {
         setPriority(option.value);
         setPriorityError('');
         setPriorityMenuOpen(false);
       } catch {
         setPriorityError('Could not save priority on this device. Please try again.');
         setPriorityMenuOpen(false);
       }
     },
   }));
   const [tags,setTags] = useState<object[] | null>([]);
  const { open, toggleMenu,setOpen, options } = useOptionsMenu("", {
      ...(groupId !== null && user && !task.Deleted && {
        send: {
          label: 'Send to colleague',
          icon: faPaperPlane,
          action: () => { setSharing(true); setOpen(false); },
        },
      }),
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
                label:task.Completed ? "Undo complete" : "Mark as complete",
                icon:faCheckSquare,
                action:()=>{setOpen(false); void updateStatus(task.id);}
            },
             Tag:{
                label:dataTagsMenu?.length != 0 ? "Add tag" : "No tags available",
                icon:faTag,
                action:async()=>{ 
                if(dataTagsMenu?.length != 0){ setOpenMenuTag2(true); setTags(dataTagsMenu)};
                console.log(tags);
               }
            },
             priority:{
                label:"Set priority",
                icon:faFlag,
                action:()=>{setPriorityError(''); setOpen(false); setPriorityMenuOpen(true);}
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
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dueDate = task.date
    ? new Date(/^\d{4}-\d{2}-\d{2}$/.test(task.date) ? `${task.date}T00:00:00` : task.date)
    : null;
  dueDate?.setHours(0, 0, 0, 0);
  const isOverdue = dueDate !== null && dueDate.getTime() < today.getTime();

  function DateExpression() {
    if (!dueDate) return "no date";
    if (dueDate.getTime() === today.getTime()) return "Today";
    if (dueDate.getTime() === tomorrow.getTime()) return "Tomorrow";
    return dueDate.toLocaleDateString("sr-RS");
  }
  const [X,setX] = useState<number>(0);
    const [Y,setY] = useState<number>(0);
  const removeTask = async (permanent: boolean) => {
    if (deletingRef.current) return;
    deletingRef.current = true;
    setDeleting(true);
    setDeleteError('');
    setOpen(false);
    setOpenMenuTag2(false);
    try {
      const animateDeletion = document.documentElement.dataset.theme === 'mario' ? marioDeleteTask : shatterTask;
      await animateDeletion(cardRef.current, async () => {
        if (permanent) {
          const { error } = await supabase.from('tasks').delete().eq('id', task.id);
          if (error) throw new Error(error.message);
        } else {
          await DeleteData(task.id);
        }
        setSelectedTask(current => current?.id === task.id ? null : current);
        await refreshTasks();
      });
    } catch {
      setDeleteError('Could not delete task. Please try again.');
    } finally {
      deletingRef.current = false;
      setDeleting(false);
    }
  };
  const closeMenu = () => setOpen(false);
  const ClosemenuTag2 = () => setOpenMenuTag2(false);
   useEffect(() => {
            
            
              
             
           }, [refreshFlag]);

           useEffect(()=>{
            console.log(task);
            console.log("GroupId in Task component:", groupId);
           },[])
  return (
    <div  
      
      className={`group relative flex items-center m-2 `} inert={deleting} aria-busy={deleting}
    >
      <div ref={cardRef} onClick={() => {
        if (selectedTask?.id === task.id) return;
        setSelectedTask(task); 
        
      }} className={`relative flex justify-between w-full items-center text-blue-900 transition-all duration-150 p-3 cursor-pointer ${
        selectedTask?.id === task.id ? "task-card-selected bg-blue-400 rounded-md shadow-md ring-1 ring-blue-500/30" : "rounded-md hover:bg-blue-100 hover:shadow-md hover:ring-1 hover:ring-blue-300/60"
      } ${task.Completed == true ? `task-card-completed` : ``}`}>
      {task.Completed && <span className="task-completed-ribbon" aria-hidden="true">Completed</span>}
      <div className={`task-card-content flex min-w-0 flex-1 flex-wrap items-center gap-y-1 align-top ${user?.display == false ? "" : "p-2 sm:p-3 "}`}>
        {/*filter == "Completed" ?  <input checked={task.Completed}  type="checkbox" className="m-1" onChange={() => updateStatus(task.id)} /> :  <input  type="checkbox" className="m-1" onChange={() => updateStatus(task.id)} />*/}
        
        <div className='flex flex-col'>
          <div className='flex min-w-0 flex-wrap items-center gap-y-1'>
            <div className='flex min-w-0 flex-1'>
            <label className="relative mr-2 inline-flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center self-center" onClick={event => event.stopPropagation()}>
              <input checked={task.Completed} disabled={savingStatus} aria-busy={savingStatus} type="checkbox" aria-label={`Mark ${task.name} as ${task.Completed ? 'incomplete' : 'completed'}`} className="peer sr-only" onChange={() => void updateStatus(task.id)} />
              <span aria-hidden="true" className="flex h-4 w-4 items-center justify-center rounded border-2 border-blue-200 bg-white text-transparent shadow-sm transition-all duration-200 hover:border-blue-400 peer-checked:border-blue-500 peer-checked:bg-blue-500 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500 peer-focus-visible:ring-offset-2">
                <FontAwesomeIcon icon={faCheck} className="text-[9px]" />
              </span>
            </label>
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
        {priority !== 'none' && <span title={`${currentPriority.label} priority · saved on this device`} className={`ml-2 inline-flex shrink-0 items-center gap-1 self-center rounded bg-white/80 px-1.5 py-0.5 text-[10px] font-semibold ${currentPriority.color}`}><FontAwesomeIcon icon={faFlag} />{currentPriority.label}</span>}
        </div>
         {task.category_id && <TaskCategoryImage id={task.category_id} refreshFlag={refreshFlag} />}
         </div>
         {task.file_name != null ?
         <div className='flex'>
         <p className='p-2'></p>
         <p className='bg-[#bb2424] text-white text-xs rounded-md p-1'>{task.file_name}</p>
           <p className='text-xs rounded-md p-1 mx-1' style={{ color: selectedTask?.id === task.id ? '#bb2424' : '#fff' }}><button onClick={Download}><FontAwesomeIcon icon={faDownload}/></button></p>
        </div>
         : ""} 
        {task.tags_tasks?.map((tag: any) => <p className={`m-1  text-white p-1 text-sm rounded-md w-fit`} style={tag.Tags.color ? { backgroundColor:tag.Tags.color} : { backgroundColor:"#4463BD"}} key={tag.id}>{tag.Tags.name}</p>)}
        </div>
       
       
      </div>
      <div className='task-card-actions flex shrink-0 items-center'>
      <div className="flex items-center">
        
        <p className={`mx-2 ${isOverdue ? "text-red-700" : ""}`}>{DateExpression()}</p>
        <button type="button" aria-label={filter === "Deleted" ? "Permanently delete task" : "Delete task"} disabled={deleting} onClick={event => { event.stopPropagation(); void removeTask(filter === "Deleted"); }} className="mx-2 flex h-8 w-8 shrink-0 items-center justify-center cursor-pointer rounded p-1 transition hover:bg-red-100 hover:text-red-600 focus-visible:outline-blue-500 disabled:cursor-wait">
          <FontAwesomeIcon icon={filter !== "Deleted" ? faClose : faTrashAlt} />
        </button>
        
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
          className="task-card-menu cursor-pointer invisible group-hover:visible m-1 size-3"
           
        />
        {deleteError && <p role="alert" className="absolute left-0 top-full z-10 rounded-md bg-red-50 px-2 py-1 text-xs text-red-700">{deleteError}</p>}
        {statusError && <p role="alert" className="absolute left-0 top-full z-10 rounded-md bg-red-50 px-2 py-1 text-xs text-red-700">{statusError}</p>}
        {priorityError && <p role="alert" className="absolute left-0 top-full z-10 rounded-md bg-red-50 px-2 py-1 text-xs text-red-700">{priorityError}</p>}
         <input type='file' ref={fileInput} className="hidden " />
        <OptionsMenu title="Task options" open={open} options={options} x={X} y={Y} closeMenu={closeMenu} />
        <OptionsMenu title="Priority" open={priorityMenuOpen} options={priorityMenuOptions} x={X} y={Y} closeMenu={() => setPriorityMenuOpen(false)} />
        <OptionsMenu title="Tags" open={openMenu2} options={optionsTag2} x={X+150} y={Y+50} closeMenu={ClosemenuTag2} />
        {sharing && groupId !== null && user && <SendTaskDialog key={`${task.id}-${groupId}-${user.id}`} taskId={task.id} taskName={task.name} groupId={groupId} senderId={user.id} close={() => setSharing(false)} />}
    </div>
  );
}

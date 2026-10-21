/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
 'use client'
 import "@/features/tasks/components/TaskDisplay/style.css";
import { flushSync } from 'react-dom';
import { vacuumTasks } from '@/features/tasks/components/TaskDisplay/vacuumTasks';
import { useTheme } from '@/features/account/context/ThemeContext';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendar, faCheck, faCheckSquare, faClose, faColumns, faDisplay, faEarListen, faEllipsis, faLeftLong, faListSquares, faNoteSticky, faSadCry, faTrash, faTrashAlt } from "@fortawesome/free-solid-svg-icons";
import { faArrowDown } from "@fortawesome/free-solid-svg-icons";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import Placeholder from '@tiptap/extension-placeholder'
import React, { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useEditor } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import TaskCategoryImage from "@/features/tasks/components/TaskDisplay/TaskCategoryImage";
import  {TextStyle,FontFamily}  from '@tiptap/extension-text-style'
import Task from "@/features/tasks/components/Task/Task";
import TaskEditor from "@/features/tasks/components/TaskDisplay/TaskEditor";
import TaskComposer from '@/features/tasks/components/TaskDisplay/TaskComposer';

import { sortTasks } from '@/features/tasks/data/task-sort';
import { useTaskPriorities } from '@/features/tasks/hooks/useTaskPriority';
import TaskSortDropdown from '@/features/tasks/components/TaskDisplay/TaskSortDropdown';
import type { TaskSort } from '@/features/tasks/data/task-sort';
import { TaskType } from "@/types/TaskType";
import { useAuth } from "@/features/auth/context/AuthContext";
import useOptionsMenu from "@/components/ui/hooks/useOptionsMenu";
import { OptionsMenu } from "@/components/ui/OptionsMenu/OptionsMenu";
import { useScope } from "@/features/groups/context/ScopeContext";
import { deleteDeleted } from '@/features/tasks/data/tasks.repository';
import { setUserAfterDisplay } from '@/features/auth/data/auth.repository';
import { group } from "console";
import { UserType } from "@/types/UserType";
import { motion,AnimatePresence, useReducedMotion } from "framer-motion";


interface TaskDisplayProps {
    setToggleModal: React.Dispatch<React.SetStateAction<boolean>>;

   ToggleModal:boolean;
    fullDate: Date | null;
   setFullDate:React.Dispatch<React.SetStateAction<Date | null>>;
   tasksArray:TaskType[];
   setTasksProp: React.Dispatch<React.SetStateAction<any[]>>
   refreshTasks: ()=> Promise<void>
   filter: string
   filterImage:string
   categoryId:number;
   tagId:number;
   refreshFlag:boolean;
   setSelectedTaskProp: React.Dispatch<React.SetStateAction<TaskType | null>>
   selectedTaskProp:TaskType | null
   
  
   setSideMenuVisible:React.Dispatch<React.SetStateAction<boolean>>
   SideMenuVisible:boolean;
   tagsDisplayProps:object[];
  }
export default function TaskDisplay({
  setToggleModal,
  fullDate,
  setFullDate,
  tasksArray,
  setTasksProp,
  refreshTasks,
  filter,
  filterImage,
  refreshFlag,
  categoryId,
  tagId,
  setSelectedTaskProp,
  selectedTaskProp,
  SideMenuVisible,
  setSideMenuVisible,
  tagsDisplayProps
}:TaskDisplayProps){
  
     
   
    const reducedMotion = useReducedMotion();
    const { theme } = useTheme();
    const [activeTask,setActiveTask] = useState<string | undefined>("");
    const [dateSort, setDateSort] = useState<TaskSort>('default');
    const [deletingTasks, setDeletingTasks] = useState(false);
    const [deleteError, setDeleteError] = useState("");
    const deletingTasksRef = useRef(false);
    const taskListRef = useRef<HTMLDivElement>(null);
    const binRef = useRef<HTMLDivElement>(null);
    const [X,setX] = useState(0);
    const [Y,setY] = useState(0);

    const {user,setUser} =useAuth();
    const priorities = useTaskPriorities(user?.id, tasksArray);
    const sortedTasks = useMemo(() => sortTasks(tasksArray, dateSort, priorities), [tasksArray, dateSort, priorities]);
    const {groupId} = useScope();
     const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Placeholder.configure({
        placeholder: "Add notes and details for this task..."
      }),
      FontFamily
    ],
    content: "",
    shouldRerenderOnTransaction: false,
    editorProps: { attributes: { "aria-label": "Task notes", role: "textbox", "aria-multiline": "true" } },
      immediatelyRender: false
    
  }, [selectedTaskProp?.id])
   
    const deleteDeletedFunc = async() =>{
      if (deletingTasksRef.current || !tasksArray.length) return;
      deletingTasksRef.current = true;
      flushSync(() => setDeletingTasks(true));
      setDeleteError("");
      try {
        await vacuumTasks(taskListRef.current, binRef.current, async () => {
          await deleteDeleted(tasksArray);
          setSelectedTaskProp(null);
          await refreshTasks();
        });
      } catch {
        setDeleteError("Could not delete tasks. Please try again.");
      } finally {
        deletingTasksRef.current = false;
        setDeletingTasks(false);
      }
    }
    
   
    
  
 const handleOpenModal = ()=>{
        setToggleModal(true);
       
    }
    const setUserAfterDisplayFunc = async(user:UserType | null)=>{
        const {data,error} = await supabase.from("Users").select("*").eq("id",user?.id).single();
        if(!error){
            setUser(data);
        }
        else{
            console.log(error);
        }
    }
       const { open, toggleMenu,setOpen, options,id,setId } = useOptionsMenu("task", {
           
            complete:{
                label:user?.display==false ? "Display Tasks:Column" : "Display Tasks:Row",
                icon:faColumns,
                action:async ()=>{ const{data,error} = await supabase.rpc("toggle_display_tasks", { uid: user?.id }); setUserAfterDisplayFunc(user);  }
            },
           
            
          });
    
    useEffect(()=>{
      console.log(user);
      console.log(tasksArray);
         refreshTasks();
           
    },[])
    

    const MotionFriendCard = motion(Task);
    
        
            useEffect(() => {
           
             refreshTasks();
            
             
           }, [refreshFlag]);

          if (!editor) return null;
     
         
    return(
        
        <div className={`task-display w-full min-w-0 flex flex-col gap-4 h-full md:flex-row md:gap-0 ${selectedTaskProp ? 'task-display-editing' : ''}`}>
            
            <div  className={`task-list h-full relative w-full md:w-2/4 md:border-r-2  flex flex-col transition-all duration-700 ease-in-out ${SideMenuVisible ? "right-1" : ""}`}>
            <div className="flex justify-between h-fit items-center p-3">
              <div className="flex items-center">
                <button type="button" aria-label={SideMenuVisible ? 'Show task menu' : 'Hide task menu'} aria-expanded={!SideMenuVisible} aria-controls="TaskMenu" onClick={()=>setSideMenuVisible(!SideMenuVisible)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg hover:bg-blue-100"><FontAwesomeIcon icon={faLeftLong} className={`transition-transform ${SideMenuVisible ? "rotate-180" : "rotate-0"}`}/></button>
                   
                    <motion.h3 key={filter} initial={{scale:0}} animate={{scale:1}} className="task-section-title pr-3 pl-3 flex align-middle items-center ">{filter}{ filterImage == null || filterImage == "" ? <p></p> : <img width={20} height={20} className="mx-2" src={"/img/"+filterImage+".png"}/>}</motion.h3>
                    </div>
                    <FontAwesomeIcon className="cursor-pointer text-2xl" icon={faEllipsis} onClick={(e)=>{toggleMenu(); setX(e.clientX); setY(e.clientY);}}></FontAwesomeIcon>
                    </div>

                    <TaskComposer key={`${user?.id}-${groupId}`} userId={user?.id} groupId={groupId} date={fullDate} categoryId={categoryId} tagId={tagId} onChooseDate={handleOpenModal} refreshTasks={refreshTasks} />
<div className="mx-3 mb-1 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-blue-100 bg-blue-50/60 px-3 py-2 text-xs text-blue-800">
                      <span className="flex items-center gap-2 font-medium"><FontAwesomeIcon icon={faCalendar} className="text-blue-400" />Sort tasks</span>
                      <TaskSortDropdown value={dateSort} onChange={setDateSort} />
                    </div>

                    {filter === "Deleted" && <div className="mx-auto my-3 w-9/12">
                      <button type="button" disabled={deletingTasks || !tasksArray.length} onClick={() => void deleteDeletedFunc()}
                        className="task-delete-all w-full rounded-md py-2 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
                        {deletingTasks ? "Deleting..." : "Delete All"}
                      </button>
                      {deleteError && <p role="alert" className="mt-2 text-sm text-red-700">{deleteError}</p>}
                    </div>}
                    

                 <div ref={taskListRef} inert={deletingTasks} aria-busy={deletingTasks} className={user?.display == true ? "task-cards-grid grid min-h-0 min-w-0 flex-1 grid-cols-2 content-start overflow-x-hidden overflow-y-auto" : "min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto"}>
                    <AnimatePresence>
                    {
                      
                        tasksArray.length != 0 ?
                    sortedTasks.map((item)=>(
                      
                      <motion.div layout data-task-card key={item.id}
                      initial={reducedMotion ? false : { opacity: 0, scale: 0.65, y: 10 }}
                      animate={reducedMotion ? { opacity: 1, scale: 1, y: 0 } : { opacity: 1, scale: selectedTaskProp?.id === item.id ? 1.025 : 1, y: selectedTaskProp?.id === item.id ? -2 : 0 }}
                      transition={{
                        duration: reducedMotion ? 0 : 0.32,
                        ease: "easeOut",
                        scale: { type: "spring", stiffness: 420, damping: 22 },
                        y: { type: "spring", stiffness: 420, damping: 26 },
                        layout: { duration: reducedMotion ? 0 : 0.15 },
                      }}
                      style={{ transformOrigin: "center center", position: "relative", zIndex: selectedTaskProp?.id === item.id ? 2 : 0 }}
                      exit={{ opacity: 0, scale: reducedMotion ? 1 : 0, transition: { duration: reducedMotion ? 0 : 0.15 } }}
                       > 
                 <Task 
 
  task={item}
  
  selectedTask={selectedTaskProp}
  refreshFlag={refreshFlag}
  setSelectedTask={setSelectedTaskProp}
  refreshTasks={refreshTasks}
  filter={filter}
  editor={editor}
/></motion.div> 
                )): <div className="flex justify-center align-middle items-center m-auto"><p className="flex justify-center align-middle items-center font-bold text-blue-900 ">No Tasks </p></div>
                }</AnimatePresence>
                 </div>
                 <AnimatePresence>
                 {deletingTasks && <motion.div key="deletion-bin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ height: 0, opacity: 0, paddingTop: 0, paddingBottom: 0, transition: { delay: reducedMotion ? 0 : 0.8, duration: reducedMotion ? 0 : 0.15 } }} transition={{ duration: reducedMotion ? 0 : 0.15 }} className="flex shrink-0 flex-col items-center gap-1 overflow-hidden px-4 py-3" role="status">
                   <motion.div ref={binRef} className="relative flex h-20 w-20 items-center justify-center" exit={reducedMotion ? { opacity: 0 } : { x: [0, 28, 80, 160, 280, 700], y: [0, -18, 0, -24, 0, -12], rotate: [0, 8, -5, 10, -4, 12], opacity: [1, 1, 1, 1, 1, 0], transition: { delay: 0.2, duration: 0.6, ease: "linear", times: [0, 0.2, 0.35, 0.55, 0.7, 1] } }}>
                     {theme === 'mario' ? <svg aria-hidden="true" viewBox="0 0 80 80" shapeRendering="crispEdges" className="relative h-20 w-20 overflow-visible">
                       <path d="M12 28h56v44H12z" fill="#713a18" />
                       <path d="M16 28h48v40H16z" fill="#e99a28" />
                       <path d="M16 28h48v4H16zM16 32h4v32h-4z" fill="#ffe394" />
                       <path d="M20 64h44v4H20zM60 32h4v32h-4z" fill="#b65b1d" />
                       <path d="M20 36h4v4h-4zM56 36h4v4h-4zM20 56h4v4h-4zM56 56h4v4h-4z" fill="#713a18" />
                       <path d="M32 38h16v4h4v8h-8v6h-8v-10h8v-4h-8v4h-8v-4h4zM36 60h8v4h-8z" fill="#a7521c" />
                       <path d="M30 36h16v4h4v8h-8v6h-8V44h8v-4h-8v4h-8v-4h4zM34 58h8v4h-8z" fill="#fff1c4" />
                       <motion.g exit={{ rotate: 0, y: 0, transition: { duration: reducedMotion ? 0 : 0.2 } }} initial={{ rotate: 0, y: 0 }} animate={{ rotate: reducedMotion ? 0 : -18, y: reducedMotion ? 0 : -7 }} style={{ transformOrigin: "18px 25px" }} transition={{ duration: 0.2 }}>
                         <path d="M8 20h64v12H8z" fill="#713a18" />
                         <path d="M12 20h56v8H12z" fill="#e99a28" />
                         <path d="M12 20h56v4H12z" fill="#ffe394" />
                         <path d="M28 12h24v8H28z" fill="#713a18" />
                         <path d="M32 16h16v4H32z" fill="#ffe394" />
                       </motion.g>
                     </svg> : <svg aria-hidden="true" viewBox="0 0 80 80" className="relative h-20 w-20 overflow-visible text-blue-500">
                       <path d="M18 29h44l-4 39a5 5 0 0 1-5 4H27a5 5 0 0 1-5-4z" fill="currentColor" />
                       <ellipse cx="40" cy="29" rx="22" ry="4" fill="#1e3a8a" />
                       <path d="M30 39l2 23m8-23v23m10-23-2 23" fill="none" stroke="#dbeafe" strokeWidth="3" strokeLinecap="round" />
                       <motion.g exit={{ rotate: 0, y: 0, transition: { duration: reducedMotion ? 0 : 0.2 } }} initial={{ rotate: 0, y: 0 }} animate={{ rotate: reducedMotion ? 0 : -25, y: reducedMotion ? 0 : -9 }} style={{ transformOrigin: "18px 26px" }} transition={{ duration: 0.2 }}>
                         <path d="M32 22v-5a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v5" fill="none" stroke="currentColor" strokeWidth="5" />
                         <rect x="13" y="22" width="54" height="7" rx="3.5" fill="currentColor" />
                       </motion.g>
                     </svg>}
                   </motion.div>
                   <motion.p exit={{ opacity: 0, transition: { duration: 0.1 } }} className="text-xs font-semibold text-blue-700">Clearing deleted tasks...</motion.p>
                 </motion.div>}
                 </AnimatePresence>
            </div> 
                
         {selectedTaskProp != null ? <div className="task-description flex h-dvh min-h-0 min-w-0 w-full flex-col md:w-2/4">
           <button type="button" onClick={() => setSelectedTaskProp(null)} className="task-editor-back flex shrink-0 items-center gap-2 border-b border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-900"><FontAwesomeIcon icon={faLeftLong} />Back to tasks</button>
           <TaskEditor key={selectedTaskProp.id} editor={editor} task={tasksArray.find(task => task.id === selectedTaskProp.id) ?? selectedTaskProp} refreshTasks={refreshTasks} />
         </div> : <div className="task-editor-empty hidden md:flex md:w-2/4 items-center justify-center p-8 text-sm text-gray-400">Select a task to edit its notes.</div>}

           <OptionsMenu options={options} open={open} closeMenu={()=>setOpen(!open)} x={X} y={Y} />
        </div>
        
    )
}

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
 'use client'
 import "@/features/tasks/components/TaskDisplay/style.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendar, faCheck, faCheckSquare, faClose, faColumns, faDisplay, faEarListen, faEllipsis, faLeftLong, faListSquares, faNoteSticky, faSadCry, faTrash, faTrashAlt } from "@fortawesome/free-solid-svg-icons";
import { faArrowDown } from "@fortawesome/free-solid-svg-icons";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import Placeholder from '@tiptap/extension-placeholder'
import React, { ChangeEvent, useEffect, useState, useReducer } from "react";
import { supabase } from "@/lib/supabase/client";
import { useEditor,EditorContent } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import Document from '@tiptap/extension-document'
import OrderedList from '@tiptap/extension-ordered-list'
import ListItem from "@tiptap/extension-list-item";
import TaskCategoryImage from "@/features/tasks/components/TaskDisplay/TaskCategoryImage";
import  {TextStyle,FontFamily}  from '@tiptap/extension-text-style'
import Task from "@/features/tasks/components/Task/Task";

import { TaskType } from "@/types/TaskType";
import { useAuth } from "@/features/auth/context/AuthContext";
import useOptionsMenu from "@/components/ui/hooks/useOptionsMenu";
import { OptionsMenu } from "@/components/ui/OptionsMenu/OptionsMenu";
import { useScope } from "@/features/groups/context/ScopeContext";
import { AddTask, deleteDeleted, saveContent } from '@/features/tasks/data/tasks.repository';
import { setUserAfterDisplay } from '@/features/auth/data/auth.repository';
import { group } from "console";
import { UserType } from "@/types/UserType";
import { motion,AnimatePresence } from "framer-motion";


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
  
     
   
    const [activeTask,setActiveTask] = useState<string | undefined>("");
    const [DDL,setDDL] = useState<boolean>(false);
    const FontArray:string[] = ['Montserrat','Roboto','Bebas Neue','Fascinate','Google Sans Code'];
    const [X,setX] = useState<number | undefined>();
    const [Y,setY] = useState<number | undefined>();
      const [inputValue,setInputValue] = useState("Add task");
    const {user,setUser} =useAuth();
    const {groupId} = useScope();
     const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      OrderedList,
      ListItem,
      Document,
      Placeholder.configure({
        placeholder: "Write something awesome..."
      }),
      FontFamily
    ],
    content: selectedTaskProp != null ? `${selectedTaskProp.content}` : `${Placeholder}`,
      immediatelyRender: false
    
  })
   
useEffect(() => {
  if (!editor || !selectedTaskProp) return;
  
  const currentHTML = editor.getHTML();
  if (currentHTML !== selectedTaskProp.content) {
    editor.commands.setContent(selectedTaskProp.content || "");
  }
}, [selectedTaskProp?.id]);

 
  
  const saveContentFunc = async(id:number)=>{
      const html = editor?.getHTML() || "";
      const data = await saveContent(id,editor?.getHTML() || "");
     
    console.log("Uspeh")
  
    refreshTasks();
     setSelectedTaskProp(data);
  }
   
   
    const deleteDeletedFunc = async() =>{
      setSelectedTaskProp(null);
       await deleteDeleted(tasksArray);
       refreshTasks();
    }
    
   
    
  
const handleChange = (e: ChangeEvent<HTMLInputElement>)=>{
        setInputValue(e.target.value);
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
  const AddTaskFunc = async (
  name: string,
  fullDate: Date,
  categoryId?: number,
  tagId?: number
) => {
  await AddTask(name,fullDate,groupId,user,categoryId,tagId);
  refreshTasks();
};

    
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
    
        
         const [, forceUpdate] = useReducer(x=>x+1,0);
          useEffect(()=>{
            if(!editor) return;

            const rerender = () => forceUpdate();
            editor.on('selectionUpdate',rerender);
            editor.on('transaction',rerender);

            return ()=>{
              editor.off('selectionUpdate',rerender);
              editor.off('transaction',rerender);
            }
          }, [editor])
          
            useEffect(() => {
           
             refreshTasks();
            
             
           }, [refreshFlag]);

          if (!editor) return null;
     
         
    return(
        
        <div className="w-full flex h-full   ">
            
            <div  className={`task-list h-full relative w-full md:w-2/4 md:border-r-2  flex flex-col transition-all duration-700 ease-in-out ${SideMenuVisible ? "right-1" : ""}`}>
            <div className="flex justify-between h-fit items-center p-3">
              <div className="flex items-center">
                <FontAwesomeIcon icon={faLeftLong} onClick={()=>setSideMenuVisible(!SideMenuVisible)} className={`transition-all cursor-pointer ${SideMenuVisible ? "rotate-180 " : "rotate-0 transition-all"}`}/>
                   
                    <motion.h3 key={filter} initial={{scale:0}} animate={{scale:1}} className="pr-3 pl-3 flex align-middle items-center ">{filter}{ filterImage == null || filterImage == "" ? <p></p> : <img width={20} height={20} className="mx-2" src={"/img/"+filterImage+".png"}/>}</motion.h3>
                    </div>
                    <FontAwesomeIcon className="cursor-pointer text-2xl" icon={faEllipsis} onClick={(e)=>{toggleMenu(); setX(e.clientX); setY(e.clientY);}}></FontAwesomeIcon>
                    </div>
                    <div className="relative flex justify-between text-white items-center m-3 p-1 bg-blue-300  rounded-md z-0 group">
                       
         
                        <input className="absolute z-20 bg-transparent outline-none group-focus-within:outline-none placeholder-white" onChange={handleChange} onKeyDown={(e)=>{
                            if(e.key === "Enter" && inputValue != "" && inputValue != " "){
                                AddTaskFunc(inputValue,fullDate,categoryId,tagId);
                                
                            }
                       
                        }} placeholder={inputValue}></input>
                       
                      
                        <div className="flex  items-center z-10 group-focus-within:invisible">   
                            <FontAwesomeIcon className={ inputValue == "" || inputValue == " " ? "" : "hidden"} icon={faPlus} height={15} width={15} ></FontAwesomeIcon>
                            <p  className="m-1">{inputValue == "" || inputValue == " " ? "Add task" : ""}</p>
                        </div>
                             <div className="flex  items-center">
                                <p>{fullDate?.toLocaleDateString("sr-RS") ?? ""}</p>
                                <FontAwesomeIcon className="m-1" onClick={handleOpenModal} icon={faCalendar} width={15} height={15}>
                                    </FontAwesomeIcon><FontAwesomeIcon icon={faArrowDown} width={15} height={15}></FontAwesomeIcon>
                        </div>
                        
                    </div>
                    
                    {filter == "Deleted" ?  <div className="flex justify-center  mx-auto m-3 w-9/12 h-fit bg-blue-400 font-bold text-white rounded-md cursor-pointer" onClick={deleteDeletedFunc}>Delete</div> : <></>}
                    

                 <div className={user?.display == true  ? "grid grid-cols-2 overflow-y-scroll" : " overflow-y-scroll h-96"}>
                    <AnimatePresence>
                    {
                      
                        tasksArray.length != 0 ?
                    tasksArray?.map((item,index)=>(
                      
                      <motion.div layout  key={item.id} 
                      initial={{opacity:0,scale:0} } 
                      animate={{opacity:1,scale:1}}
                       transition={{
                        duration:0.3,delay:index*0.15,layout:{duration:0.15}}}
                       
                       exit={{ opacity: 0,scale:0, transition:{duration:0.15} }}
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
            </div> 
                
         {selectedTaskProp != null ? <div className="task-description w-2/4 hidden h-dvh md:flex flex-col">
              
              
               <div style={{ margin: '0.4rem' }}>
        <button className="text-white border-2 bg-blue-300 p-1 rounded-md text-sm m-1 border-blue-300 hover:bg-white hover:text-blue-300" onClick={() => editor.chain().focus().toggleBold().run()}>
          Bold
        </button>
        <button className="text-white border-2 bg-blue-300 p-1 rounded-md text-sm m-1 border-blue-300 hover:bg-white hover:text-blue-300" onClick={() => editor.chain().focus().toggleItalic().run()}>
          Italic
        </button>
        <button className="text-white border-2 bg-blue-300 p-1 rounded-md text-sm m-1 border-blue-300 hover:bg-white hover:text-blue-300" onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          Ordered List
        </button>
        <button className="text-white border-2 bg-blue-300 p-1 rounded-md text-sm m-1 border-blue-300 hover:bg-white hover:text-blue-300" onClick={() => editor.chain().focus().unsetAllMarks().run()}>
          Clear formatting
        </button>
        
      </div>
       <div className="flex justify-start mx-1 " style={{ marginBottom: '1rem' }}>
        <div onClick={()=>setDDL(!DDL)} className="selectFontDDL text-white w-32 border-2 relative  bg-blue-300 p-1 rounded-md text-xs m-1 border-blue-300 hover:bg-white hover:text-blue-300 " >
        
        <p>{editor.getAttributes('textStyle').fontFamily != null ? editor.getAttributes('textStyle').fontFamily : "Select font"}</p>

        <div className={DDL == true ? "h-fit transition-all w-full left-0 border-2  border-blue-300 rounded-md absolute z-10 bg-blue-300 text-white " : "h-0 border-blue-300 transition-all w-full rounded-md"  }>

        {FontArray.map((item)=>  <div key={item} className={DDL == true ? "visible p-3 hover:bg-white transition-all rounded-md hover:text-blue-300" :" invisible transition-all "}  onClick={(e)=>editor.chain().focus().setFontFamily(item).run()}>{item}</div>)}
          </div>
           
        </div>
          <div><p  className="text-white border-2 bg-blue-300 p-1 rounded-md text-xs m-1 border-blue-300 hover:bg-white hover:text-blue-300">  Comic Sans MS</p></div>
            <div><p   className="text-white border-2 bg-blue-300 p-1 rounded-md text-xs m-1 border-blue-300 hover:bg-white hover:text-blue-300">H2</p></div>
             <div><p  className="text-white border-2 bg-blue-300 p-1 rounded-md text-xs m-1 border-blue-300 hover:bg-white hover:text-blue-300">H3</p></div>
              <div><p className="text-white border-2 bg-blue-300 p-1 rounded-md text-xs m-1 border-blue-300  hover:bg-white hover:text-blue-300 ">H4</p></div>
             
      </div>
      
                <EditorContent key={selectedTaskProp?.id} className="outline-none border-none ProseMirror my-2 p-1 overflow-y-scroll max-h-dvh" editor={editor} />
                 <button className="text-white border-2  bg-blue-300 p-1 rounded-md text-sm m-1 w-fit border-blue-300 hover:bg-white hover:text-blue-300" onClick={()=>saveContentFunc(selectedTaskProp.id)}> Save</button>
            </div> : ""}
            
            
           <OptionsMenu options={options} open={open} closeMenu={()=>setOpen(!open)} x={X} y={Y} />
        </div>
        
    )
} 

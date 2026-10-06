"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {  AnimatePresence, motion } from "framer-motion";
import "@/experiments/animation2/StarField.css";
import userImage from '@/assets/img/user.png';
import { Micro_5 } from "next/font/google";
import { DeleteData } from '@/features/tasks/data/tasks.repository';
import useFilterTasks from "@/features/tasks/hooks/useFilterTasks";
  const Micro = Micro_5({weight:"400",subsets:['latin'],});



export default function StarField() {
  const [tasksArray,setTasksArray] = useState<object[]>([]);
  const {tasks,refresh} = useFilterTasks("Today",false,null,null,false,null);
  const variants = {
    hidden:{opacity:0,y:40},
    visible:{opacity:1,y:0}
  }
  const container = {
    hidden:{},
    visible:{
      transition:{
        staggerChildren:0.15
      }
    }
  }
  const item = {
    hidden:{
      opacity:0,
      y:20
    },
    visible:{
      opacity:1,
      y:0,
      transition:{
        duration:0.4
      }
    }
  }
  useEffect(()=>{
    console.log(tasks);
    setTasksArray(tasks)
  },[tasks,refresh])
  return (
  <div className="flex justify-center items-center animation w-screen h-screen bg-blue-400">
    <motion.h1 className={`text-white ${Micro.className}`} 
    variants={variants}
     initial={{opacity:0,x:0,y:0}}
      animate={{opacity:1,x:100,y:200, scale:4.2}}
       exit={{x:100,y:100}}
       // transition={{stiffness:400,damping:10,type:"spring"}}
        whileHover={{scale:5.05}}
        whileTap={{scale:4.3}}

        >
      
    HelpTask
  </motion.h1>
   <motion.h1 className={`text-white ${Micro.className}`} 
    variants={variants}
     initial="hidden"
     animate="visible"

        >
      
    HelpTask
  </motion.h1>
  { tasksArray.length > 0 && 

  <motion.div variants={container} layout initial="hidden"
  animate="visible">
      <AnimatePresence>
  {tasksArray.map((task)=> (<motion.h1  initial={{
        opacity: 0,
        scale: 0.9
      }}
      animate={{
        opacity: 1,
        scale: 1
      }}
      exit={{
        opacity: 0,
        scale: 0.9
      }}
      whileHover={{x:5,cursor:"pointer"}}

      onClick={async()=>{ /*</AnimatePresence>await DeleteData(task.id); await refresh()*/}} variants={item} className={`${Micro.className} text-white m-2 text-4xl`} key={task.id}>{task.name}</motion.h1>))}
      </AnimatePresence>
</motion.div>

}
  </div>
);
}
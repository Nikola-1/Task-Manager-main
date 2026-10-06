"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, delay, motion, scale, useAnimationControls } from "framer-motion";
import Image from "next/image";
import { getStickers } from '@/lib/supabase/stickers.repository';
import "@/experiments/animation7/StarField.css"
import { Micro_5 } from "next/font/google";
const Micro = Micro_5({weight:"400",subsets:['latin'],});
export default function StarField() {
  const [showTitle,setShowTitle] = useState<boolean>(false);
  const [moveTitle, setMoveTitle] = useState(false);
  const controls = useAnimationControls();
  const controls2 = useAnimationControls();
  
   
      
 const [stars] = useState(() =>
  Array.from({ length: 100 }).map(() => ({
    y: Math.random() * 100,
    width: 30 + Math.random() * 100,
    duration: 2 + Math.random() * 2,
    delay: Math.random() * 2,
     
  }))
);


   const Title="HelpTask";
  
   const container = {
    hidden:{},
    visible:{
      scale:1,
      transition:{
        staggerChildren:0.22,
      },
    },
   }
   const letter = {
  hidden: {
    opacity: 0,
    x: -100,
    scaleX: 2,
    filter: "blur(8px)",
  },

  visible: {
    opacity: 1,
    x: 0,
    scaleX: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.7,
      ease: "easeOut",
    },
    
  },
};
  
   const StartAnimation = async()=>{
    
      controls.start({
          x:"110vw",
          opacity:[0,1,0,1,0,1,1,0,1],
          
      })
      
      await new Promise(resolve => setTimeout(resolve,3000))
       setShowTitle(true);
      
     await new Promise(resolve => setTimeout(resolve, 3000));
      await controls2.start({
    x: -40,
    scale: 0.95,
    scaleY:1.05,
    transition: {
      duration: 0.25,
      ease: "easeOut",
    },
  });
  setMoveTitle(true);
  // 4. Kada se title animacija završi
 
  }
  useEffect(()=>{
    StartAnimation();
  },[])
  
  return(
    <div className="h-screen relative max-w-screen w-full overflow-hidden flex justify-center items-center">
    <motion.div className=" bg-blue-400 absolute w-screen h-screen max-w-screen grid items-center grid-cols-6 justify-between p-10  overflow-hidden">
      {stars.map((star, i) => (
  <motion.div
    key={i}
    className="absolute h-[2px] bg-white rounded-full"
    style={{
      top: `${star.y}%`,
      width: `${star.width}px`,
    }}
    initial={{
      x: "-150px",
      opacity: 0,
    }}
    animate={controls}
    transition={{
      duration: star.duration,
      repeat: Infinity,
      ease: "linear",
      delay: star.delay,
    }}
  />
))}
      <motion.div  className="wrapper">
      <div className="absolute inset-0 flex items-center justify-center text-white">
      {showTitle && !moveTitle && (
  <div className="absolute inset-0 flex items-center justify-center">
    <motion.div animate={controls2}>
    <motion.h1
      layoutId="help-task-title"
      variants={container}
      initial="hidden"
      animate="visible"
      className={`${Micro.className} text-8xl text-white`}
    >
      {Title.split("").map((char, i) => (
        <motion.span key={i} variants={letter}>
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </motion.h1>
    </motion.div>
  </div>
)}
      </div>
     </motion.div>
     
    </motion.div>
    {moveTitle && (
  <div className="flex justify-start w-full h-48 z-50">
    <div className="w-8/12" />

    <motion.h1
      layoutId="help-task-title"
      className={`${Micro.className} text-8xl text-white`}
      transition={{
        layout: {
          duration: 0.1,
          ease: "easeInOut",
          
        },
      }}
    >
      HelpTask
    </motion.h1>
  </div>
)}
    </div>
  )

 
  
    
}
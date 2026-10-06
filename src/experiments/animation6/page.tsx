"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useAnimationControls } from "framer-motion";
import Image from "next/image";
import { getStickers } from '@/lib/supabase/stickers.repository';
import "@/experiments/animation6/StarField.css"
import { Micro_5 } from "next/font/google";
const Micro = Micro_5({weight:"400",subsets:['latin'],});
export default function StarField() {
  const controls = useAnimationControls();
  const titleControls = useAnimationControls();
    const titleControls2 = useAnimationControls();
      const titleControls3 = useAnimationControls();
      const titleControls4 = useAnimationControls();
    const titleControls5 = useAnimationControls();
      const titleControls6 = useAnimationControls();
    const secondControls = useAnimationControls();
  const StartAnimation = async()=>{
    
      controls.start({
          x:"110vw",
          opacity:[0,1,1,0],
          
      })
      
      await new Promise(resolve => setTimeout(resolve,3000))

      await titleControls.start({
        opacity:1,
        scale:1,
        y:0,
        filter:"blur(0px)",
        transition:{
          duration:1,
          ease:"easeOut"
        },
       
      });
      
      await titleControls2.start({
        opacity:1,
        scale:1,
        y:0,
        filter:"blur(0px)",
        transition:{
          duration:1,
          ease:"easeIn"
        },
       
      });
      await titleControls3.start({
        opacity:1,
        scale:1,
        y:0,
        filter:"blur(0px)",
        transition:{
          duration:1,
          ease:"backIn"
        },
       
      });
         await titleControls4.start({
        opacity:1,
        scale:1,
        y:0,
        filter:"blur(0px)",
        transition:{
          duration:1,
          ease:"backInOut"
        },
       
      });
      
      await titleControls5.start({
        opacity:1,
        scale:1,
        y:0,
        filter:"blur(0px)",
        transition:{
          duration:1,
          ease:"backOut"
        },
       
      });
      await titleControls6.start({
        opacity:1,
        scale:[0.1,1.2,1],
        y:0,
        filter:"blur(0px)",
        transition:{
          duration:1,
          ease:"easeIn"
        },
       
      });
  // 4. Kada se title animacija završi
 
  }
  useEffect(()=>{
    StartAnimation();
  },[])
  return(
    
    <motion.div className="bg-blue-400 relative w-screen h-screen max-w-screen grid items-center grid-cols-6 justify-between p-10  overflow-hidden">
      {Array.from({length:100}).map((_,i)=>{
        const randomY = Math.random()*100; // random visina svake linije
        const randomWidth = 30 + Math.random() * 100; //random sirina 
        const randomDuration = 2 + Math.random() * 2; // random trajanje svake linije

        return(
          <motion.div key= {i} className=" h-[2px] star-line bg-white rounded-full overflow-hidden"
          style= {{ top:`${randomY}%`, 
            width: `${randomWidth}px`    
        }}
        initial= {{ 
          x:"-150px", //pocetna tacka na x osi
          opacity:0  
        }}

         animate= {controls}

        transition={{
          duration:randomDuration,
          repeat: Infinity,
          
          ease: "linear",
          delay:Math.random()*2,
        }}
          
          >

          </motion.div>
        )
      })}
      <div className=" inset-0 flex items-center justify-center text-white">
      <motion.h1  className={`${Micro.className} text-8xl` }
      
      animate={titleControls}
      initial={{
  opacity: 0,
  scale: 0.5,
  filter:"blur(12px)"
}}
      >Hello</motion.h1>
      </div>
      <div className=" inset-0 flex items-center justify-center text-white">
      <motion.h1  className={`${Micro.className} text-8xl` }
      
      animate={titleControls2}
      initial={{
  opacity: 0,
  scale: 0.5,
  filter:"blur(12px)"
}}
      >Hello</motion.h1>
      </div>
      <div className=" inset-0 flex items-center justify-center text-white">
      <motion.h1  className={`${Micro.className} text-8xl` }
      
      animate={titleControls3}
      initial={{
  opacity: 0,
  scale: 0.5,
  filter:"blur(12px)"
}}
      >Hello</motion.h1>
      </div>
      <div className=" inset-0 flex items-center justify-center text-white">
      <motion.h1  className={`${Micro.className} text-8xl` }
      
      animate={titleControls4}
      initial={{
  opacity: 0,
  scale: 0.5,
  filter:"blur(12px)"
}}
      >Hello</motion.h1>
      </div>
      <div className=" inset-0 flex items-center justify-center text-white">
      <motion.h1  className={`${Micro.className} text-8xl` }
      
      animate={titleControls5}
      initial={{
  opacity: 0,
  scale: 0.5,
  filter:"blur(12px)"
}}
      >Hello</motion.h1>
      </div>
      <div className=" inset-0 flex items-center justify-center text-white">
      <motion.h1  className={`${Micro.className} text-8xl` }
      
      animate={titleControls6}
      initial={{
  opacity: 0,
  scale: 0.5,
  filter:"blur(12px)"
}}
      >Hello</motion.h1>
      </div>
    </motion.div>
  )

 
  
    
}
"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useAnimationControls } from "framer-motion";
import Image from "next/image";
import { getStickers } from "@/app/api/supabase";
export default function StarField() {
  const [stickers,setStickers] = useState<any[] | null>([])
  const container = {
      hidden:{},
      visible:{
          transition:{
            //staggerChildren:0.15,
          }
      }
  }
  useEffect(()=>{
      async function stickersFunc(){
        const stickersArray = await getStickers();
        console.log(stickersArray);
        setStickers(stickersArray);
       
      }

      stickersFunc();
  },[])
  const item = {
    hidden:{
      scale:0,
      y:20
    },
    visible:{
      scale:1,
      y:0,
      transition:{
        duration:0.4
      }
    }
  }
  
  return(
   <motion.div
  className="relative w-screen h-screen bg-blue-400 overflow-hidden"
>
 {stickers.map((sticker, i) => {
  const randomX = Math.random() * 90;
  const randomDuration = 4 + Math.random() * 4;

  return (
    <motion.img
      key={sticker.id}
      src={`/img/${sticker.sticker_path}.png`}
      width={100}
      height={100}
      className="absolute"
      style={{
        left: `${randomX}%`,
      }}
      initial={{
        y: -150,
      }}
      animate={{
        y: "110vh",
        rotate: 360,
      }}
      transition={{
        y: {
          duration: randomDuration,
          repeat: Infinity,
          ease: "linear",
          delay: i * 0.4,
        },

        rotate: {
          duration: 3,
          repeat: Infinity,
          ease: "linear",
        },
      }}
    />
  );
})}
</motion.div>
  )
    
}
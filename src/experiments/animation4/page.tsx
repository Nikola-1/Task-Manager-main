"use client";

import { useEffect, useRef } from "react";
import { motion, useAnimationControls } from "framer-motion";

export default function StarField() {
  const RefSquare = useRef<HTMLDivElement|null>(null);
   const controls = useAnimationControls();
  const RefTittle = useRef<HTMLHeadingElement | null>(null);
  
  const StartAnimation = async() =>{

    if(RefSquare.current == null || RefTittle == null) return;
     const SquareRect = RefSquare.current?.getBoundingClientRect();
    const SquareRefX = SquareRect?.left + SquareRect?.width /2 ;
  const SquareRefY = SquareRect?.top + SquareRect?.height /2  ;
    
  const TitleRect = RefTittle.current?.getBoundingClientRect();
  const TitleCenterY = TitleRect?.top + TitleRect?.height /2;
  const TitleCenterX = TitleRect?.left + TitleRect?.width /2;

  const offsetX =   TitleCenterX-SquareRefX;
    const offsetY = TitleCenterY- SquareRefY ;
    await controls.start({
          x: SquareRefX,
      y: SquareRefY ,
      transition: {
        duration: 1,
        ease: "easeInOut",
      },
    })
      await controls.start({
          x: offsetX,
      y: offsetY ,
      transition: {
        duration: 1,
        ease: "easeInOut",
      },
    })
  }
  useEffect(()=>{
    StartAnimation();
  },[]);
  
  
  return(
    <>
     <div className="w-full h-screen">
      <motion.div ref={RefSquare} animate={controls} className="bg-blue-400 w-20 h-20">
        
      </motion.div>
        <div  className="flex justify-center">
          <h1 ref={RefTittle} >Hello</h1>
        </div>
      </div> 
    </>
  )
    
}
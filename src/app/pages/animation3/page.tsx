"use client";

import { useEffect, useRef } from "react";
import { motion, useAnimationControls } from "framer-motion";

export default function StarField() {
  const squareRef = useRef<HTMLDivElement | null>(null);
  const helloRef = useRef<HTMLHeadingElement | null>(null);
  const helloRef2 = useRef<HTMLHeadingElement | null>(null);

  
  const startAnimation = async () => {
    if (!squareRef.current || !helloRef.current) return;

    const squareRect = squareRef.current.getBoundingClientRect(); //pozicija square-a
    const helloRect = helloRef.current.getBoundingClientRect(); // pozicija naslova
    const hello2Rect = helloRef2.current.getBoundingClientRect(); // pozicija drugog naslova 
    


    const squareCenterX = squareRect.left + squareRect.width / 2; // 
    const squareCenterY = squareRect.top + squareRect.height / 2;

    const helloCenterX = helloRect.left + helloRect.width / 2;
    const helloCenterY = helloRect.top + helloRect.height / 2;
    
    const hello2CenterX = hello2Rect.left + hello2Rect.width / 2;
    const hello2CenterY = hello2Rect.top + hello2Rect.height / 2;
    const offsetX = helloCenterX - squareCenterX;
    const offsetY = helloCenterY - squareCenterY;
    const offsetX2 = hello2CenterX - squareCenterX;
    const offsetY2 = hello2CenterY - squareCenterY;
    await controls.start({
      x: offsetX,
      y: offsetY,
      transition: {
        duration: 1,
        ease: "easeInOut",
      },
    });
    await controls.start({
      x: offsetX2,
      y: offsetY2,
      transition: {
        duration: 1,
        ease: "easeInOut",
      },
    });
  };
const controls = useAnimationControls();
  useEffect(()=>{
      startAnimation();
      console.log(squareRef)
      console.log(squareRef.current?.getBoundingClientRect());
  },[])
  return (
    <div className="flex w-full h-full">
      <motion.div
        ref={squareRef}
        animate={controls}
        className="w-20 h-20 bg-blue-500 "
      />

      

      <div className="w-full h-screen flex justify-center items-center">
        <h1 ref={helloRef}>Hello</h1>
      </div>
      <div className="w-full h-screen flex justify-center items-center">
        <h1 ref={helloRef2}>Hello</h1>
      </div>
    </div>
  );
}
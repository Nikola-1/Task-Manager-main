'use client'
import React, { useEffect, useState } from 'react'
import { motion, useAnimationControls } from 'framer-motion'
const StarField = () => {

    const controls = useAnimationControls();


    const [stars] = useState(() =>
        Array.from({length:100}).map(()=>({
            y:Math.random() * 100,
            width:30 + Math.random() * 100,
            duration:2 + Math.random() * 2,
            delay:Math.random() * 2,
})
    ));
    const startAnimation =()=>{
        
        controls.start({
            x:"100vw",
            opacity:[0,1,0,0,1,0]
        })
    }
    useEffect(()=>{
        startAnimation();
    })
  return (
    
    <motion.div layout className='h-screen relative max-w-screen w-full overflow-hidden flex justify-center items-center'>
        <motion.div className='bg-blue-400 absolute w-screen h-screen max-w-screen grid items-center grid-cols-6 justify-between p-10  overflow-hidden'>
      {stars.map((star,i)=>(
        
        <motion.div animate={controls} initial={{
           x:"-150px",
            
        }} style={{top:`${star.y}%`, width:star.width}} transition={{repeat:Infinity,ease:"linear", duration:star.duration,delay:star.delay}} className='absolute h-[2px] overflow-hidden bg-white rounded-full' key={i}>

        </motion.div>
      ))}
      </motion.div>
    </motion.div>
  )
}

export default StarField

'use client'
import React, { useEffect, useState } from 'react'
import { delay, easeInOut, motion, useAnimationControls } from 'framer-motion'
import { width } from '@fortawesome/free-solid-svg-icons/faCheckSquare'
const StarField = () => {
    const controls = useAnimationControls();
    const [stars] = useState(()=>
      Array.from({length:100}).map(()=>(
        {
          y:Math.random() * 100,
          width:30 + Math.random() * 100,
          duration:2 + Math.random() * 2,
          delay: Math.random() + 2
          
        }
      ))
    )

    const startAnimation = ()=>{
        controls.start({
          x:"100vw",
          opacity:[1,0,1,0,1],
          
        })

    }

    useEffect(()=>{
        startAnimation();
    })
   
   
  return (
    
    <motion.div layout className='flex relative justify-start bg-blue-400 w-full h-screen overflow-hidden'>
        {stars.map((star,i)=>(
          <motion.div key={i} initial={{x:"-150px"}} animate={controls} style={{top:`${star.y}%`,width:star.width}}  transition={{
            repeat:Infinity,
            ease:"linear",
            delay:star.delay,
            duration:star.duration
          }
          }  className='absolute h-[2px] overflow-hidden bg-white rounded-full' ></motion.div>
        ))}
    </motion.div>
  )
}

export default StarField

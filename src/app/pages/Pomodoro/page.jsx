'use client'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import "./pomodoro.css"
import { faEllipsis, faList, faPlus } from "@fortawesome/free-solid-svg-icons"
import { useState } from "react";




export default function PomodoroPage(){
        let [Minutes,setMinutes] = useState(25);
        let [Seconds,setSeconds] = useState(10);
        function Timer(){


                
             try{
                setInterval(()=>{
                        if(Minutes >= 0){
                                
                              
                                if(Seconds == 0){
                                        
                                        setMinutes(Minutes-1);
                                        setSeconds(10);
                                        
                                }
                                else{
                                        setSeconds(Seconds--);
                                }
                              
                              
                        }
                       
                   
                       },1000)
                    
             }
              catch(error){
                //console.log(error);
              }
                
                 
         
                 
          }
           
   return(
    <div className="w-full relative">
    <div className="stopWatch lg:w-6/12 w-full h-dvh flex flex-col justify-center align-middle border-r-2 relative">
    <div className="meni flex top-0 absolute justify-between w-full p-2 items-center ">
                <h2 className="s m-2 ">Pomodoro</h2>
                <div className="flex">
                <FontAwesomeIcon icon={faPlus} className="size-7 m-2"></FontAwesomeIcon>
                <FontAwesomeIcon icon={faEllipsis} className="size-7 m-2"></FontAwesomeIcon>
                </div>
    </div>
    <div className="flex content-center items-center align-center flex-col justify-center">
            <div className="timer lg:p-40 sm:p-28 p-24 rounded-full  border-blue-300 border-4 h-fit flex  justify-center">
                    <div className="flex justify-center flex-col content-center  text-center">
                    <p className="text-6xl">{Minutes}:{Seconds > 10 ? Seconds : Seconds }</p>
                 
                    </div>
                        
            </div>
            <button    className="m-5 rounded-3xl bg-blue-300 text-white p-3 w-36 text-center hover:bg-blue-600" onClick={Timer} 
           >Start</button>
            </div>
    </div>
    <div></div>
    </div>
   )
}
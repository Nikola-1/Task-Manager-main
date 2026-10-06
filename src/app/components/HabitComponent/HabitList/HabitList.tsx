'use client'
import { faAngleDown, faCircle, faCubesStacked, faEllipsis, faGripVertical, faPlus, faSmile } from "@fortawesome/free-solid-svg-icons";
import { faCubes } from "@fortawesome/free-solid-svg-icons/faCubes";
import { faListDots } from "@fortawesome/free-solid-svg-icons/faListDots";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "../page.css";
import { useState,Component } from "react";


export default function HabitsList(){
        
        const [Days,setDays]= useState([{
                name:"Mon",
                Ticked:true,
                
        },
        {
                name:"Tue",
                Ticked:false,
        },
        {
                name:"Wed",
                Ticked:false,
        },
        {
                name:"Thu",
                Ticked:false,
        },
        {
                name:"Fri",
                Ticked:false,
        },
        {
                name:"Sat",
                Ticked:false,
        },
        {
                name:"Sun",
                Ticked:false,
        },]);
        const toggleTicked = (index: number) =>{
            setDays((prevDays)=>
                prevDays.map((day,i)=> 
                i === index ? {...day,Ticked: !day.Ticked} : day
                ))
            
        }
        const[Day,setDay] = useState(false); 
    return(
      <div className="w-full flex">
     <div className="flex flex-col items-start w-2/4  content-center overflow-hidden border-r-2">
     <div className="Habits-navbar flex flex-row  justify-between w-full ">
           <div className="flex flex-row items-center ">
            <h3 className="text-2xl m-3">Habit</h3>
            <FontAwesomeIcon icon={faAngleDown} width={30} height={30} className="text-2xl "></FontAwesomeIcon>
           </div>
           <div className="Habit-Settings">
                <FontAwesomeIcon icon={faGripVertical} width={30} height={30} className="text-2xl m-3"></FontAwesomeIcon>
                <FontAwesomeIcon icon={faPlus} width={30} height={30} className="text-2xl m-3"></FontAwesomeIcon>
                <FontAwesomeIcon icon={faEllipsis} width={50} height={30} className="text-2xl m-3"></FontAwesomeIcon>
           </div>
     </div>
        <div className="Habits-week flex m-auto md:m-0 " > {/*Slajder napraviti*/}
                {
                        // eslint-disable-next-line react/jsx-key
                        Days.map((x,i)=><div className="flex">
                                <div onClick={()=>toggleTicked(i)} className="flex flex-col items-center justify-center bg-blue-300 rounded-md p-3 m-2" key={i}>
                                            <h3>{x['name']}</h3>
                                            <p>5</p>
                                            {x.Ticked ?   <FontAwesomeIcon icon={faCircle} className="text-white" /> :   <FontAwesomeIcon icon={faCircle} className="text-black" />  }
                                          
                                </div>
                        </div>)
                }
                
             
                
                
        </div>
        <div className="Habits flex flex-col md:w-full  w-11/12 m-auto md:m-0">
                <div className="row1 flex flex-col  w-full">
                        
                        <div className="flex items-center justify-start m-3">
                            <FontAwesomeIcon icon={faAngleDown}></FontAwesomeIcon>
                            <h3 className="mr-2">Morning</h3>
                            <p>1</p>
                        </div>
                        <div className="flex items-center w-11/12 mt-1 mx-2 p-3 rounded-xl h-fit justify-between bg-blue-300 relative">
                        <div className="flex items-center ">
                                <FontAwesomeIcon icon={faSmile} className="text-3xl p-2  m-1 bg-blue-900 rounded-full text-white"></FontAwesomeIcon>
                                <p className="ml-2">Hello</p>
                                </div>
                                <div className=" flex ">
                                     {Days.map((x,i)=><span className="circle" key={i}></span>)}
                                        
                                      
                                     
                                        
                                </div>
                        </div>
                        <div className="flex items-center w-11/12 mt-1 mx-2 p-3 rounded-xl h-fit justify-between bg-blue-300 relative">
                                <div className="flex items-center ">
                                <FontAwesomeIcon icon={faSmile} className="text-3xl p-2  m-1 bg-blue-900 rounded-full text-white"></FontAwesomeIcon>
                                <p className="ml-2">Hello</p>
                                </div>
                                <div className=" flex ">
                                     {Days.map((x,i)=><span className="circle" key={i}></span>)}
                                        
                                      
                                     
                                        
                                </div>
                        </div>
                </div>
                <div className="row1 flex flex-col w-full">
                 
                        <div className="flex items-center justify-start m-3">
                            <FontAwesomeIcon icon={faAngleDown}></FontAwesomeIcon>
                            <h3 className="mr-2">Morning</h3>
                            <p>2</p>
                        </div>
                        <div className="flex items-center w-11/12 mt-1 mx-2 p-3 rounded-xl h-fit justify-between bg-blue-300 relative">
                        <div className="flex items-center ">
                                <FontAwesomeIcon icon={faSmile} className="text-3xl p-2  m-1 bg-blue-900 rounded-full text-white"></FontAwesomeIcon>
                                <p className="ml-2">Hello</p>
                                </div>
                                <div className=" flex ">
                                     
                                {Days.map((x,i)=><span className="circle" key={i} onClick={()=>Day ? setDay(false) : setDay(true)}></span>)}
                                </div>
                        </div>
                </div>
            </div>
            <div>
            
            </div>
     </div> 
     </div>
    )
}
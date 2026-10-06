/* eslint-disable react/jsx-key */
'use client'
import {  faAngleLeft, faAngleRight, faClock, faRepeat, faSign } from "@fortawesome/free-solid-svg-icons";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useEffect, useState } from "react";

import "./style.css";
interface ModalProps{
    setActive:React.Dispatch<React.SetStateAction<boolean>>;
   
    isActive:boolean
    calendarDate:Date | null;
    setCalendarDate:React.Dispatch<React.SetStateAction<Date | null>>
}

export default function CalendarComponent({isActive,setActive,setCalendarDate}: ModalProps){
    

    const ThirtyOne =31; //number of days in month
    const TwentySeven =27; //number of days in month
    const Thirty =30; //number of days in month
    const RepeatOptions =['Daily','Weekly','Monthly','Yearly'] //array of period for repeating task 
    const MonthNames = [ {name:"January",type:1}, {name:"February",type:3}, {name:"March",type:1}, {name:"April",type:2}, {name:"May",type:1}, {name:"June",type:2},
  {name:"July",type:1}, {name:"August",type:1}, {name:"September",type:2},{name:"Oktober",type:1}, {name:"November",type:2}, {name:"December",type:1}] 
    const [Year,setYear] = useState(new Date().getFullYear());
    const [Month,setMonth] = useState(new Date().getMonth());
    const [TotalDays,setTotalDays] = useState<number>(0);
    const [Day,setDay] = useState(new Date().getDate()+1);
    const ReminderOptions =['1 day early','2 days early','3 days early','4 days early'] // reminder array
  
    
  
    
    useEffect(()=>{
     
      
      setCalendarDate(new Date(Year,Month,Day));
      
    },[Year,Month,Day])
    useEffect(()=>{
            const selectedMonth=MonthNames[Month];
            if(selectedMonth.type == 1){
                setTotalDays(31);
            }
            else if(selectedMonth.type == 2){
                setTotalDays(30);
            }
            else if(selectedMonth.type == 3){
                setTotalDays(27)
            }
    },[Month])
    return(
          <div className="flex flex-col justify-start">
          <div className="flex justify-center items-center">
          <FontAwesomeIcon icon={faAngleLeft} className="m-2" onClick={()=> setYear(e=>e-1)}></FontAwesomeIcon>
                <h3>{Year}</h3>
                <FontAwesomeIcon icon={faAngleRight} className="m-2" onClick={()=> setYear(e=>e+1)}></FontAwesomeIcon>
                </div>
                <div className="flex justify-start items-center">
                <FontAwesomeIcon icon={faAngleLeft} className="m-2" onClick={()=>Month > 0 ? setMonth(e=>e-1) : setMonth(11)}></FontAwesomeIcon>
                <h3 className="min-w-28 text-center">{MonthNames[Month].name}</h3>
                <FontAwesomeIcon icon={faAngleRight} className="m-2" onClick={()=>Month < 11 ? setMonth(e=>e+1) : setMonth(0)}></FontAwesomeIcon>
                </div>
                <div className="grid grid-cols-7 ">

                  {
                    MonthNames[Month].type == 1 &&
                     [...Array(TotalDays)].map((e,i) => <span onClick={()=>{
                       
                        setDay(i+2);}
                        
                        
                        
                       
                    }  className={i==Day-2 ? "p-2 text-center bg-blue-400 text-white transition-all rounded-xl" : "p-2 text-center" } key={i}>{i+1}</span>)
                        
                  }
                  {
                    MonthNames[Month].type == 3 &&
                     [...Array(TwentySeven)].map((e,i) => <span onClick={()=>{
                       
                        setDay(i+2);}
                        
                        
                        
                       
                    }  className={i==Day-2 ? "p-2 text-center bg-blue-400 text-white transition-all rounded-xl" : "p-2 text-center" } key={i}>{i+1}</span>)
                  }
                   {
                    MonthNames[Month].type == 2 &&
                     [...Array(Thirty)].map((e,i) => <span onClick={()=>{
                       
                        setDay(i+2);}
                        
                        
                        
                       
                    }  className={i==Day-2 ? "p-2 text-center bg-blue-400 text-white transition-all rounded-xl" : "p-2 text-center" } key={i}>{i+1}</span>)
                  }
                </div>
                
                  <div className="flex flex-col relative">
                    <div className="flex  justify-between items-center mt-2">
                        <FontAwesomeIcon icon={faClock} width={30} height={30}></FontAwesomeIcon>
                    <select className=" w-full items-center">
                        
                        <option className="w-dvw">Time</option>
                        {
                     
                     // eslint-disable-next-line react/jsx-key
                     RepeatOptions.map((e,i) => <option key={i}>{e}</option>)
                     
                   }
                    </select>
                    </div>
                    <div className="flex  justify-between items-center mt-2">
                        <FontAwesomeIcon icon={faSign} width={30} height={30}></FontAwesomeIcon>
                    <select className=" w-full items-center">
                        
                        <option className="w-dvw">Reminder</option>
                        {
                     
                     ReminderOptions.map((e,i) => <option key={i}>{e}</option>)
                     
                   }
                    </select>
                    </div>
                    <div className="flex  justify-between items-center mt-2">
                        <FontAwesomeIcon icon={faRepeat} width={30} height={30}></FontAwesomeIcon>
                    <select className=" w-full items-center">
                        
                        <option className="w-dvw">Repeat</option>
                        {
                     
                    RepeatOptions.map((e,i) => <option key={i}>{e}</option>)
                    
                  }
                     
                    </select>
                    </div>
                {/* <div className="flex justify-between items-center dugme " key="1">
                
                    <div className="flex justify-start items-center">
                    <FontAwesomeIcon icon={faClock} className="m-3 text-blue-400 " height={15} width={15}></FontAwesomeIcon> 
                    <p>Time</p>
                    </div> 
                    <FontAwesomeIcon icon={faAngleRight} className="m-3 text-blue-400 strelica" height={15} width={15}></FontAwesomeIcon> 
              
                </div> */}
        
                </div>
               
                <div className="flex w-full">
                    <button onClick={()=>{
                     setCalendarDate(new Date(Year,Month,Day)); //
                      
                        setActive(!isActive);
                        
                      
                       }}  className="bg-blue-400 w-2/4 m-2 p-1 rounded-md hover:bg-blue-500">OK</button>
                    <button onClick={()=>{
                        setActive(!isActive);
                      
                    const today = new Date();
const localToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

localToday.setDate(localToday.getDate() + 1); // dodaje 1 dan
setCalendarDate(localToday);

                        
                        
                    }
                        
                       } className="bg-white text-gray-500 border-gray-500 border-2 outline-none w-2/4 m-2 p-0.5 rounded-md hover:bg-gray-100">Cancel</button>
                </div>
          </div>      
    )
}
'use client'
/* eslint-disable @next/next/no-img-element */
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { faUser } from "@fortawesome/free-solid-svg-icons";
import menu from "../../../assets/img/menu.png";
import Image from "next/image";
import user from "../../../assets/img/user.png"
import Calendar from "../../../assets/img/calendar.png";
import sync from "../../../assets/img/sync.png";
import clock from "../../../assets/img/clock.png";
import Groups from "../../../assets/img/Groups.png";
import { Micro_5 } from "next/font/google";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faList } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import Link from "next/link"
import { useScope } from "@/app/context/ScopeContext";
const Micro = Micro_5({weight:"400",subsets:['latin'],});
export default function Nav(){
        const [active,setActive] = useState(false);
       
    return(
        <div className={ +  active ? "nav float-left md:w-36   bg-blue-300 h-screen z-10 transition-transform " : "nav float-left md:w-36   bg-blue-300 h-fit md:h-screen z-10 transition-transform"}>

             <div className="wrapper m-auto  md:w-24  ">
                <div className="flex flex-row md:block justify-between align-middle items-center m-auto w-11/12">
               
                <FontAwesomeIcon icon={faList} className="md:hidden size-9 float-left text-blue-900" onClick={()=> active ? setActive(false) : setActive(true) }></FontAwesomeIcon>
                <h1 className={"text-center mt-3 text-7xl md:text-3xl text-blue-900  "+ Micro.className}>HelpTask</h1>
                <p></p>
                </div>
                <ul className={+ active ? "md:flex md:flex-col  justify-center align-middle " : "md:flex md:flex-col  justify-center align-middle hidden"}>
                    {/* <li><FontAwesomeIcon icon={faUser} width={30} height={30} /></li> */}
                    <li className="m-3 flex justify-center align-middle"><Link href="/pages/Account"><Image src={user} alt="user image"  width={40} height={40} /></Link></li>
                    <li  className="m-3 flex justify-center align-middle"><Link href="/pages/Task"><Image src={menu} alt="Menu image"  width={40} height={40} /></Link></li>
                    <li className="m-3 flex justify-center align-middle"><Link href="/pages/Calendar"><Image src={Calendar} alt="Calendar image"  width={40} height={40} /></Link></li>
                    <li className="m-3 flex justify-center align-middle"><Link href="/pages/Habits"><Image src={sync} alt="sync image"  width={40} height={40} /></Link></li>
                     <li className="m-3 flex justify-center align-middle"><Link href="/pages/Groups"><Image src={Groups} alt="sync image"  width={40} height={40} /></Link></li>
                    <li className="m-3 flex justify-center align-middle"><Link href="/pages/Pomodoro"><Image src={clock} alt="clock image"  width={40} height={40} /></Link></li>
                    <hr className="text-blue-900 border-blue-900 "></hr>
                </ul>
                
             </div>
        </div>
    )
}


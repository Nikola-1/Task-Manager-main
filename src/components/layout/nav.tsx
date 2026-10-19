'use client'
/* eslint-disable @next/next/no-img-element */
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { faUser } from "@fortawesome/free-solid-svg-icons";
import menu from "@/assets/img/menu.png";
import Image from "next/image";
import user from "@/assets/img/user.png"
import Calendar from "@/assets/img/calendar.png";
import sync from "@/assets/img/sync.png";
import clock from "@/assets/img/clock.png";
import Groups from "@/assets/img/Groups.png";
import { Micro_5 } from "next/font/google";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faList } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import Link from "next/link"
import { useScope } from "@/features/groups/context/ScopeContext";
const Micro = Micro_5({weight:"400",subsets:['latin'],});
export default function Nav(){
        const [active,setActive] = useState(false);
       
    return(
        <div className={ +  active ? "nav float-left md:w-36   bg-blue-300 h-screen z-10 transition-transform " : "nav float-left md:w-36   bg-blue-300 h-fit md:h-screen z-10 transition-transform"}>

             <div className="wrapper m-auto  md:w-24  ">
                <div className="flex flex-row md:block justify-between align-middle items-center m-auto w-11/12">
               
                <FontAwesomeIcon icon={faList} className="md:hidden size-9 float-left text-blue-900" onClick={()=> active ? setActive(false) : setActive(true) }></FontAwesomeIcon>
                <h1 data-helptask-sidebar-logo className={"text-center mt-3 text-7xl md:text-3xl text-blue-900  "+ Micro.className}>HelpTask</h1>
                <p></p>
                </div>
                <ul className={+ active ? "md:flex md:flex-col  justify-center align-middle " : "md:flex md:flex-col  justify-center align-middle hidden"}>
                    {/* <li><FontAwesomeIcon icon={faUser} width={30} height={30} /></li> */}
                    <li className="m-3 flex justify-center align-middle"><Link href="/pages/Account"><Image src={user} alt="user image" data-sidebar-profile width={40} height={40} /></Link></li>
                    <li  className="m-3 flex justify-center align-middle"><Link href="/pages/Task"><Image src={menu} alt="Menu image"  width={40} height={40} /></Link></li>
                    <li className="m-3 flex justify-center align-middle"><Link href="/pages/Calendar"><Image src={Calendar} alt="Calendar image"  width={40} height={40} /></Link></li>
                    <li className="m-3 flex justify-center align-middle"><Link href="/pages/Habits"><Image src={sync} alt="sync image"  width={40} height={40} /></Link></li>
                     <li className="m-3 flex justify-center align-middle"><Link href="/pages/Groups"><Image src={Groups} alt="sync image"  width={40} height={40} /></Link></li>
                    <li className="m-3 flex justify-center align-middle"><Link href="/pages/Pomodoro"><Image src={clock} alt="clock image"  width={40} height={40} /></Link></li>
                    <hr className="text-blue-900 border-blue-900 "></hr>
                </ul>
                
             </div>
             <svg className="mario-sidebar-mushroom" aria-hidden="true" viewBox="0 0 32 28" width="64" height="56" shapeRendering="crispEdges">
                <defs>
                  <linearGradient id="sidebar-mushroom-cap" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#ff6476" />
                    <stop offset=".35" stopColor="#f93842" />
                    <stop offset=".72" stopColor="#d51e30" />
                    <stop offset="1" stopColor="#86232c" />
                  </linearGradient>
                </defs>
                <path fill="#21151b" d="M9 17h14v2h3v5h-2v2h-2v1H10v-1H8v-2H6v-5h3z" />
                <path fill="#e6ad8e" d="M9 19h14v1h1v4h-2v1H10v-1H8v-4h1z" />
                <path fill="#ffdcc0" d="M10 19h12v5H10z" />
                <path fill="#fff8e9" d="M12 19h8v6h-8z" />
                <path fill="#21151b" d="M11 19h2v4h-2zM19 19h2v4h-2z" />
                <path fill="#21151b" d="M11 1h10v1h4v2h2v2h2v3h2v4h1v5h-2v2H2v-2H0v-5h1V9h2V6h2V4h2V2h4z" />
                <path fill="url(#sidebar-mushroom-cap)" d="M11 3h10v1h4v2h2v3h2v4h1v4h-2v1H4v-1H2v-4h1V9h2V6h2V4h4z" />
                <path fill="#ff8892" d="M11 3h10v1H11zM7 4h4v1H7zM5 6h2v2H5zM3 10h1v3H3zM12 7h8v1h2v2h-2V9h-8z" />
                <path fill="#a92b38" d="M3 15h3v1h20v-1h3v2h-1v1H4v-1H3z" />
                <path fill="#ffe5e8" d="M12 8h8v1h2v6h-2v2h-8v-2h-2V9h2z" />
                <path fill="#fffdf4" d="M13 8h6v1h2v5h-2v2h-6v-2h-2V9h2zM4 9h3v1h1v4H7v2H3v-3h1zM25 9h3v4h1v3h-4v-2h-1v-4h1zM14 3h4v2h-4z" />
                <path fill="#eadbd8" d="M12 15h2v1h6v-1h2v1h-2v1h-8zM3 15h4v1H3zM25 15h4v1h-4z" />
             </svg>
        </div>
    )
}


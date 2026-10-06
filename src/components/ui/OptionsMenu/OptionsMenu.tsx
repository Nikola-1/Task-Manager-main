import { faTeeth } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useRef } from 'react'

export function OptionsMenu({options,open,x,y,closeMenu}:{
    options:{label:string;icon:any; action:()=> void} [];
    open:boolean;
    x:number;
    y:number;
    closeMenu:()=>void;
    
}) {
    const divRef = useRef<HTMLDivElement>(null);
    
     
    
   
    useEffect(()=>{
      if(!open) return
      const handelClickOutside = (e:MouseEvent) =>{
        //divRef proverava da li je ucitan menu
            if(divRef.current && !divRef.current.contains(e.target as Node)){
              closeMenu();
            }
      }
      document.addEventListener("mousedown",handelClickOutside);

      return () => {
        document.removeEventListener("mousedown",handelClickOutside);
      };
  
    },[open]);


    if(!open) return null; //nikad n e stavljati if ispred hooka

    return (
        <div ref={divRef} onClick={(e)=> e.stopPropagation()}
      className="fixed  z-20  bg-white shadow-lg outline-blue-300  p-2 flex flex-col gap-1"
      style={{
        top:y,
        left:x
      }}
      
    >
      {options.map((opt) => (
        <button
          key={opt.label}
          onClick={opt.action}
          className="px-3 py-2 rounded-md hover:bg-gray-100 text-left text-sm text-blue-400"
        >
           <FontAwesomeIcon icon={opt.icon} className="text-blue-500" width={30} height={30} />
          {opt.label}
        </button>
      ))}
    </div>
    )
}


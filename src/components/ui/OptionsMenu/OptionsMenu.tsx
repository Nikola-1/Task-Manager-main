import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

export function OptionsMenu({options,open,x,y,closeMenu,title}:{
    options:{label:string;icon:IconDefinition; action:()=> void} [];
    open:boolean;
    x:number;
    y:number;
    closeMenu:()=>void;
    title?:string;
    
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
  
    },[open, closeMenu]);


    if(!open) return null; //nikad n e stavljati if ispred hooka

    return createPortal(
        <div ref={divRef} onClick={(e)=> e.stopPropagation()}
      className={title ? 'task-action-menu fixed z-[100] flex flex-col gap-1 p-2' : 'fixed z-[100] bg-white shadow-lg outline-blue-300 p-2 flex flex-col gap-1'}
      style={{
        top:y,
        left: title ? `clamp(8px, ${x}px, calc(100vw - 248px))` : x,
        maxHeight: title ? `calc(100dvh - ${Math.max(8, y)}px - 8px)` : undefined,
        overflowY: title ? 'auto' : undefined,
      }}
      
    >
      {title && <div className="task-action-menu-heading">{title}</div>}
      {options.map((opt) => (
        <button
          key={opt.label}
          onClick={opt.action}
          className={title ? 'task-action-menu-item flex items-center gap-3 px-3 py-2.5 text-left text-sm' : 'px-3 py-2 rounded-md hover:bg-gray-100 text-left text-sm text-blue-400'}
        >
           <FontAwesomeIcon icon={opt.icon} className={title ? 'task-action-menu-icon' : 'text-blue-500'} width={title ? 16 : 30} height={title ? 16 : 30} />
          {opt.label}
        </button>
      ))}
    </div>, document.body
    )
}


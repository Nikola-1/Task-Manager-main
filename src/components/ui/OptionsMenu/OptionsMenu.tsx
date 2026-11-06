import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useLayoutEffect, useRef } from 'react';
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
    useLayoutEffect(() => {
      if (!open || !divRef.current) return;
      const menu = divRef.current;
      const viewport = window.visualViewport;
      const position = () => {
        const margin = 8;
        const viewportLeft = viewport?.offsetLeft ?? 0;
        const viewportTop = viewport?.offsetTop ?? 0;
        const width = viewport?.width ?? window.innerWidth;
        const height = viewport?.height ?? window.innerHeight;
        menu.style.maxHeight = `${Math.max(0, height - margin * 2)}px`;
        menu.style.maxWidth = `${Math.max(0, width - margin * 2)}px`;
        const bounds = menu.getBoundingClientRect();
        const minLeft = viewportLeft + margin;
        const minTop = viewportTop + margin;
        const maxLeft = viewportLeft + width - margin - bounds.width;
        const maxTop = viewportTop + height - margin - bounds.height;
        // Open above the click when the full menu cannot fit below it.
        const top = y + bounds.height > viewportTop + height - margin ? y - bounds.height : y;
        menu.style.left = `${Math.max(minLeft, Math.min(x, maxLeft))}px`;
        menu.style.top = `${Math.max(minTop, Math.min(top, maxTop))}px`;
      };
      position();
      const observer = new ResizeObserver(position);
      observer.observe(menu);
      window.addEventListener('resize', position);
      viewport?.addEventListener('resize', position);
      viewport?.addEventListener('scroll', position);
      return () => {
        observer.disconnect();
        window.removeEventListener('resize', position);
        viewport?.removeEventListener('resize', position);
        viewport?.removeEventListener('scroll', position);
      };
    }, [open, x, y]);
    
     
    
   
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
        left: x,
        overflowY: 'auto',
      }}
      
    >
      {title && <div className="task-action-menu-heading shrink-0">{title}</div>}
      {options.map((opt) => (
        <button
          key={opt.label}
          style={{ flexShrink: 0 }}
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


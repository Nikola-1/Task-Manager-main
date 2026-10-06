import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import  { useState } from 'react'

export default function useOptionsMenu(name: string, handlers:Record<string,{ label:string;icon:IconDefinition; action: ()=>void;}>){
    const [open,setOpen] = useState(false);
    const [id,setId] = useState(0);
    const toggleMenu = () => setOpen((p)=> !p);

    
    const options = Object.values(handlers).map((item) => ({
        label: item.label,
        icon:item.icon,
        action:item.action,
    }));

    return {open,toggleMenu,setOpen,options,id,setId};

 
  
}



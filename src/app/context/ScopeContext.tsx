'use client'
import { useParams } from 'next/navigation';

import React, { Children, useEffect } from 'react'
import { createContext } from 'react'
import { GroupType } from '../components/Types/GroupType';
import { getGroupById } from '../api/supabase';

interface ScopeContextType { //definisem oblike podatka u contextu
  
    groupId: number | null;
    setGroup:   React.Dispatch<React.SetStateAction<GroupType | null>>;
   group:GroupType | null;
}

const ScopeContext = createContext<ScopeContextType | undefined>(undefined); // inicijalizujem context
export const ScopeProvider = ({ children }: { children: React.ReactNode }) => { // pravim provider komponentu koja ce obaviti context
          const params = useParams<{ group?: string }>();

   
    const [group, setGroup] = React.useState<GroupType | null>(null); // inicijalizujem state koji cu da delim kroz context opet
    const groupId = params?.group ? Number(params.group) : null;
    
    useEffect(()=>{
    
       async function loadGroup() {
      if (!params?.group) {
        setGroup(null);
        return;
      }
      console.log("GROUP ID", params.group);
      const data = await getGroupById(Number(params.group));
      
      console.log("GROUP DATA", data);
        
      setGroup(data && data.length > 0 ? data[0] : null);
      console.log("GROUP STATE", group);
    }
            loadGroup();
    },[params?.group])
   
  return (
    <ScopeContext.Provider value={{group,setGroup,groupId}}> {/* prosledjujem state kroz context */}
    {children}
    </ScopeContext.Provider>
  )
}
export function useScope(){
    const context = React.useContext(ScopeContext);
    if(!context) throw new Error("useScope mora biti koriscen unutar ScopeProvider-a");
    return context;
}

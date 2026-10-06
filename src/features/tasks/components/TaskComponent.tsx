'use client'

import TaskDisplay from "@/features/tasks/components/TaskDisplay/TaskDisplay";
import TaskMenu from "@/features/tasks/components/TaskMenu/TaskMenu";
import ListModal from "@/features/tasks/components/ListModal/ListModal";
import { useEffect, useState } from "react";
import CalendarModal from "@/features/calendar/components/CalendarModal/CalendarModal";
import { useAuth } from "@/features/auth/context/AuthContext";
import useFilterTasks from "@/features/tasks/hooks/useFilterTasks";
import TagModalComponent from "@/features/tags/components/TagModalComponent";
import { TaskType } from "@/types/TaskType";
import { useScope } from "@/features/groups/context/ScopeContext";
import { group } from "console";
import { useTaskComponentState } from "@/features/tasks/hooks/useTaskComponentState";

//import { FilterType } from "./Types/FilterType";
export default function TaskComponent(){
    
    
    
    

  
  const {
    taskMenuProps,
    taskDisplayProps,
    listModalProps,
    calendarModalProps,
    tagModalProps,
  } = useTaskComponentState();
   
    
    return(
       <div className="flex md:flex-row flex-col w-full ">
          
        <TaskMenu {...taskMenuProps}></TaskMenu>
        <TaskDisplay {...taskDisplayProps}></TaskDisplay>
        <ListModal {...listModalProps}></ListModal>
        <CalendarModal {...calendarModalProps}></CalendarModal>
        <TagModalComponent {...tagModalProps} />
    </div>
    )
    }
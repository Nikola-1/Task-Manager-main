'use client'

import TaskDisplay from "./TaskDisplay/TaskDisplay";
import TaskMenu from "./TaskMenu/TaskMenu";
import ListModal from "./ListModal/ListModal";
import { useEffect, useState } from "react";
import CalendarModal from "../CalendarModal/CalendarModal";
import { useAuth } from "@/app/context/AuthContext";
import useFilterTasks from "../hooks/useFilterTasks";
import TagModalComponent from "../TagModal/TagModalComponent";
import { TaskType } from "../Types/TaskType";
import { useScope } from "@/app/context/ScopeContext";
import { group } from "console";
import { useTaskComponentState } from "../hooks/useTaskComponentState";

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
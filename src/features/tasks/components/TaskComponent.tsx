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
       <div className="task-workspace flex md:flex-row flex-col w-full ">
        <div className="task-console-screen flex min-w-0 w-full flex-col md:flex-row">
        <TaskMenu {...taskMenuProps}></TaskMenu>
        <TaskDisplay {...taskDisplayProps}></TaskDisplay>
        </div>
        <div className="console-controls" role="group" aria-label="Console controls">
          <div className="console-dpad">
            <button type="button" className="console-direction console-up" aria-label="Up" />
            <button type="button" className="console-direction console-left" aria-label="Left" />
            <button type="button" className="console-direction console-right" aria-label="Right" />
            <button type="button" className="console-direction console-down" aria-label="Down" />
          </div>
          <div className="console-system-buttons"><button type="button" aria-label="Select" /><button type="button" aria-label="Start" /></div>
          <div className="console-action-buttons"><button type="button" aria-label="B">B</button><button type="button" aria-label="A">A</button></div>
        </div>
        <ListModal {...listModalProps}></ListModal>
        <CalendarModal {...calendarModalProps}></CalendarModal>
        <TagModalComponent {...tagModalProps} />
    </div>
    )
    }

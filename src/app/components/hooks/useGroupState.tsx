import React, { useEffect, useState } from 'react'
import { Group } from 'three/src/objects/Group.js'
import { GroupType } from '../Types/GroupType';

export default function useGroupState(){


        const [Group,setGroup] = useState<GroupType|null>(null);
        const [EditOn,setEditOn] = useState<boolean>(false);
        const [AddUserOn,setAddUserOn] = useState<boolean>(false);
         const [modeModal, setModeModal] = useState<string | undefined>();
        const [nameGroup, setNameGroup] = useState<string | undefined>("");
        const [DeleteOn,setDeleteOn] = useState<boolean>(false);
         const [refreshFlagGroups, setRefreshFlagGroups] = useState(false);
        const [toggleModalGroups, setToggleModalGroups] = useState(false);
        const [toggleModalUsers, setToggleModalUsers] = useState(false);
  const [editListItem, setEditListItem] = useState<object | null>(null);
        const [filter, setFilter] = useState("Today");
  const [filterImage, setFilterImage] = useState("");
        useEffect(()=>{
                console.log(Group);
        },[Group])
        useEffect(()=>{
                console.log(EditOn);
        },[EditOn])
        const useGroup ={
                EditOn:EditOn,
                setEditOn:setEditOn,
                Group:Group,
                setGroup:setGroup,
                AddUserOn:AddUserOn,
                setAddUserOn:setAddUserOn,
                setDeleteOn:setDeleteOn,
                DeleteOn:DeleteOn
        }
const triggerRenderGroups = () => {
    console.log("renderovano");
    setRefreshFlagGroups(prev => !prev);
    console.log(refreshFlagGroups)
  };
        const groupModalProps = {
    setTaskFilter: setFilter,
    setFilterImage:setFilterImage,
    nameGroup:nameGroup,
    refreshFlagGroups:triggerRenderGroups,
    setNameGroup: setNameGroup,
    Mode: modeModal,
    setMode:setModeModal,
    setEditListItem,
    editListItem,
    onUpdate: triggerRenderGroups,
    isActiveGroup: toggleModalGroups,
    setActiveGroup: setToggleModalGroups,
    isActiveUser:toggleModalUsers,
    setActiveUser:setToggleModalUsers,

  };
        return {useGroup,groupModalProps}


}



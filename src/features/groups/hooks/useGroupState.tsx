import { useState } from 'react'

import { GroupType } from "@/types/GroupType";

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
        const [, setFilter] = useState("Today");
  const [, setFilterImage] = useState("");

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

    setRefreshFlagGroups(prev => !prev);

  };
        const groupModalProps = {
    setTaskFilter: setFilter,
    setFilterImage:setFilterImage,
    nameGroup:nameGroup,
    refreshFlagGroups:triggerRenderGroups,
    refreshVersion:refreshFlagGroups,
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



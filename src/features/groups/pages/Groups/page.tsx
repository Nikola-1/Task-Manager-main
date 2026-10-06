'use client'
import GroupsComponent from "@/features/groups/components/GroupsComponent"
import GroupsModal from "@/features/groups/components/GroupsModal";
import OptionsGroupsComponent from "@/features/groups/components/OptionsGroupsComponent"
import UsersModal from "@/features/groups/components/UsersModal";
import useGroupState from "@/features/groups/hooks/useGroupState";
import React from 'react'

const page = () => {
   const {groupModalProps} = useGroupState();
 const {useGroup} = useGroupState();
  return (
     <div className='flex justify-start items-start'>
      <OptionsGroupsComponent {...groupModalProps} {...useGroup}  />
      <GroupsComponent {...groupModalProps} {...useGroup}/>
     <GroupsModal {...groupModalProps} {...useGroup}/>
         <UsersModal {...groupModalProps} {...useGroup}/>
    </div>
  )
}

export default page

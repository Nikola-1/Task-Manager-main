'use client'
import GroupsComponent from '@/app/components/GroupsComponent/GroupsComponent'
import GroupsModal from '@/app/components/GroupsComponent/GroupsModal';
import OptionsGroupsComponent from '@/app/components/GroupsComponent/OptionsGroupsComponent'
import UsersModal from '@/app/components/GroupsComponent/UsersModal';
import useGroupState from '@/app/components/hooks/useGroupState';
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

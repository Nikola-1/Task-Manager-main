'use client'
import ChatComponent from '@/app/components/ChatComponent/ChatComponent'
import FriendsComponent from '@/app/components/ChatComponent/FriendsComponent'
import FriendsModal from '@/app/components/ChatComponent/FriendsModal'
import useChatState from '@/app/components/hooks/useChatState'
import { useTaskComponentState } from '@/app/components/hooks/useTaskComponentState'
import React, { useState } from 'react'

const page = () => {
  const {friendsModalProps} = useChatState();
  return (
    <div className='w-full h-full flex justify-center align-middle items-center'>
      <FriendsComponent {...friendsModalProps} />
    <ChatComponent />
    <FriendsModal {...friendsModalProps} />
    </div>
  )
}

export default page

'use client'
import ChatComponent from "@/features/chat/components/ChatComponent"
import FriendsComponent from "@/features/chat/components/FriendsComponent"
import FriendsModal from "@/features/chat/components/FriendsModal"
import useChatState from "@/features/chat/hooks/useChatState"
import { useTaskComponentState } from "@/features/tasks/hooks/useTaskComponentState"
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

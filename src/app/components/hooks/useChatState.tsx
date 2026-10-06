'use client'

import { useState } from "react";

export default function useChatState(){
        const [isActive,setIsActive] = useState(false);
    const friendsModalProps={
            isActive:isActive,
            setIsActive:setIsActive,
    }

    return(
        {friendsModalProps}

    );
}
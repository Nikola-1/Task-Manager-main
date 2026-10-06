import React from 'react'
import { useAuth } from '@/app/context/AuthContext'
import { UserType } from '../../Types/UserType';

interface AccountOptionsComponentProps {
    user: UserType | null;
    logout: () => void;
    visibleOptions?:boolean;
    setvisibleOptions:React.Dispatch<React.SetStateAction<boolean>>;
}
const AccountOptionsComponent = ({user,logout,visibleOptions,setvisibleOptions}: AccountOptionsComponentProps) => {
    
    


  return (
    <div>
      <ul>
        <li className='p-2 hover:bg-blue-300 hover:text-white rounded-md cursor-pointer' onClick={() => setvisibleOptions(!visibleOptions)}>Profile Settings</li>
        <li className='p-2 hover:bg-blue-300 hover:text-white rounded-md cursor-pointer'>Privacy Settings</li>
        <li className='p-2 hover:bg-blue-300 hover:text-white rounded-md cursor-pointer' onClick={() => logout()}>Logout</li>    
      </ul>
    </div>
  )
}

export default AccountOptionsComponent


'use client'
import { useAuth } from '@/app/context/AuthContext'
import React, { useState } from 'react'
import AccountOptionsComponent from './AccountOptionsComponent/AccountOptionsComponent';
import AccountDisplayComponent from './AccountDisplayComponent/AccountDisplayComponent';

export default function AccountComponent(){
    const {user,logout} = useAuth();
    const [visibleOptions,setVisibleOptions] =useState(false);
  return (
    <div className='w-full flex relative'>
        <div className='flex absolute translate-y-32 left-0 right-0   flex-col justify-center align-middle w-5/6 m-auto'>
            <div className='flex'>
      <p className='m-1'>{user?.Name}</p> 
      <p className='m-1'>{user?.Surname}</p>
      </div>
      <hr className='w-full border-2 text-blue-300 border-blue-300 rounded-md'></hr>
      <div>
        
          <p>{user?.email}</p>
          </div>

            </div>
           <div className='my-3 absolute translate-y-48 left-0 right-0   flex flex-col justify-center align-middle w-5/6 m-auto  rounded-md'>
           <AccountOptionsComponent user={user} logout={logout} visibleOptions={visibleOptions} setvisibleOptions={setVisibleOptions} />
           <AccountDisplayComponent visible={visibleOptions} />
           </div>
    </div>
  )
}


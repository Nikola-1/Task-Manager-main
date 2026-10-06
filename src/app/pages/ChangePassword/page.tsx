'use client'
import React from 'react'
import page from '../Task/page'
import { supabase } from '@/app/connection/supabaseclient';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';

const ChangePasswordPage = () => {
    const {user,setUser} =useAuth();
    const router = useRouter();
    const [NewPassword,setNewPassword] =React.useState("");
    const [currentPassword,setCurrentPassword] =React.useState("");
  const ChangePassword = async ()=>{
   if(currentPassword !== user?.Password){
    alert("Current password is incorrect.");
    return;
   }
    const {data,error} = await supabase.from('Users').update({Password:NewPassword}).eq('id',user?.id).select().single();
    if(error){
      console.log("Error updating password:",error);
      }else{
      console.log("Password updated successfully:",data);
      setUser(data);
      router.push("/pages/AccountPage");
      }
  }
  return (
    <div className='flex justify-center items-center'>
      <input type='password' placeholder='Current Password' onChange={(e)=>setCurrentPassword(e.currentTarget.value)} className='mb-4 p-2 border border-gray-300 rounded w-full'/>
      <input type='password' placeholder='New Password' onChange={(e)=>setNewPassword(e.currentTarget.value)} className='mb-4 p-2 border border-gray-300 rounded w-full'/>
      <input type='password' placeholder='Confirm New Password' className='mb-4 p-2 border border-gray-300 rounded w-full'/>
      <button className='bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700' onClick={ChangePassword}>Change Password</button>
    </div>
  )
}

export default ChangePasswordPage

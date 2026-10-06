'use client'
import React from 'react'
import "./VerifyCode.css";
import {  useRouter } from 'next/navigation';

const VerfiyCodeComponent = () => {
 
  const Code =localStorage.getItem("verificationCode");
  const router = useRouter();
  const verifyCode =()=>{
    
    const inputs = document.querySelectorAll('input[type="number"]');
    let enteredCode ="";
    inputs.forEach((input)=>{
      enteredCode +=input.value;
    });
    if(enteredCode === Code){
      
       router.push("/pages/ChangePassword")
    }else{
      router.push("/pages/VerifyCodeFailed")
    }
  }
  return (
     <div className='flex flex-col items-center justify-center mt-20 w-full'>
        <div className='flex'>
      <input type="number"  min={0} max={9} className="mb-4 p-2 m-2 border-blue-300 border-2 no-spinner text-center  outline-none rounded w-fit size-32 text-4xl"/>
       <input type="number" min={0} max={9} className="mb-4 p-2 m-2 border-blue-300 border-2 no-spinner text-center  outline-none rounded w-fit size-32 text-4xl"/>
        <input type="number" min={0} max={9} className="mb-4 p-2 m-2 no-spinner text-center  outline-none border-blue-300 border-2 rounded w-fit size-32 text-4xl"/>
         <input type="number"  min={0} max={9}  className="mb-4 p-2 m-2 no-spinner text-center border-blue-300 border-2 outline-none rounded w-fit size-32 text-4xl"/>
         </div>
        <button className='bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700' onClick={()=>{verifyCode(); }}>Verify Code</button>
    </div>
  )
}

export default VerfiyCodeComponent

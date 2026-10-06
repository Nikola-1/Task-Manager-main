
import { Micro_5 } from 'next/font/google';
import Image from 'next/image';
import next from "../../../../public/img/next.png";
import search from "../../../../public/img/search.png";
import React, { useEffect, useRef, useState } from 'react'
import "./style.css";
import { useAuth } from '@/app/context/AuthContext';
import "./Login.css";
import 'swiper/css';
import { useRouter } from 'next/navigation';
import { Login, Register } from '@/app/api/supabase';
import StarField from './StarField';
import { AnimatePresence, motion } from "framer-motion";
const Micro = Micro_5({weight:"400",subsets:['latin'],});
 interface LoginProps{
    setLoginProps:React.Dispatch<React.SetStateAction<boolean>>
    setUserProps:React.Dispatch<React.SetStateAction<object>>
}
export default function  LoginComponent({setLoginProps,setUserProps}:LoginProps) {
  const [Username,setUsername] = useState<string | null>("");
  const [Name,setName] = useState<string | null>("");
    const [Surname,setSurname] = useState<string | null>("");
     const [Email,setEmail] = useState<string | null>("");
      const [Password,setPassword] = useState<string | null>("");
      const [RepeatedPassword,setRepeatedPassword] = useState<string | null>("");
         const [showIntro, setShowIntro] = useState(true);
      const [singUp,setSignUp] = useState<boolean>(false);
      const {setUser,setLoggedIn} = useAuth();
      const router = useRouter();
      const handleLogin = async () => {
  const data = await Login(Username, Password);

  if (!data) {
    return;
  }

  localStorage.setItem("user", JSON.stringify(data));

  setUser(data);
  setUserProps(data);
  setLoggedIn(true);
  setLoginProps(true);

  router.push("/pages/Task");
};
const titleReference = useRef<HTMLHeadingElement | null>(null);
useEffect(() => {
  const timer = window.setTimeout(() => {
    setShowIntro(false);
  }, 12000);

  return () => window.clearTimeout(timer);
}, []);

  return (
    <div className='flex gri justify-between items-center w-full h-dvh'>
      
      
    

       
     <Image className='SlikaLogin m-auto m-3 flex justify-center align-middle items-center w-full h-full  shadow-md ' src={"/img/LoginImage3.jpg"} width={1240} height={940} alt='pera'></Image>
      <div>

        <div className='grid'></div>
      </div>
      <div className='w-1/2 flex justify-center'>
      <div className='flex justify-center  align-middle items-center flex-col w-5/6 '>
        <h1 ref={titleReference} className={"text-center  mt-3 text-7xl md:text-9xl text-blue-900  "+ Micro.className}>HelpTask</h1>
        
        {singUp == true ? 
          <div className='grid grid-cols-2 gap-4 my-9 w-5/6'>
        
        <input type='text' onChange={(e)=>setUsername(e.target.value)} placeholder='Write your Username' className='border-blue-300 p-3 cursor-pointer rounded-md bg-blue-300 text-white placeholder:text-white  outline-none border-2 col-span-2'/>
        <input type='password' onChange={(e)=>setPassword(e.target.value)} placeholder='Write password' className='border-blue-300 p-3 cursor-pointer rounded-md bg-blue-300 text-white placeholder:text-white outline-none border-2 col-span-2'/>
        
       <button onClick={()=>{handleLogin()}}   className='border-blue-900 p-3 m-2 cursor-pointer rounded-md flex justify-center items-center bg-white placeholder:text-white outline-none border-2  w-fit '>Sign up </button>
        </div>  
        : 
      <div className='grid grid-cols-2 gap-4 my-9'>
          
        <input type='text' onChange={(e)=>setUsername(e.target.value)} placeholder='Write your Username' className='border-blue-300 p-3 cursor-pointer rounded-md bg-blue-300 text-white placeholder:text-white  outline-none border-2 col-span-2'/>
        
        <input type='text' onChange={(e)=>setName(e.target.value)} placeholder='Write your Name' className='border-blue-300 p-3 cursor-pointer rounded-md bg-blue-300 text-white placeholder:text-white outline-none border-2 col-span-1'/>
        <input type='text' onChange={(e)=>setSurname(e.target.value)} placeholder='Write your Surname' className='border-blue-300 p-3 cursor-pointer rounded-md bg-blue-300 text-white placeholder:text-white outline-none border-2 col-span-1'/>
        <input type='email' onChange={(e)=>setEmail(e.target.value)} placeholder='Write your email' className='border-blue-300 p-3 cursor-pointer rounded-md bg-blue-300 text-white placeholder:text-white outline-none border-2 col-span-2'/>
        <input type='password' onChange={(e)=>setPassword(e.target.value)} placeholder='Write password' className='border-blue-300 p-3 cursor-pointer rounded-md bg-blue-300 text-white placeholder:text-white outline-none border-2 col-span-1'/>
        <input type='password' onChange={(e)=>setRepeatedPassword(e.target.value)} placeholder='Repeat Password' className='border-blue-300 p-3 cursor-pointer rounded-md bg-blue-300 text-white placeholder:text-white outline-none border-2 col-span-1'/>
       
        </div>
      }
        
        <div>
        <button onClick={()=>setSignUp(!singUp)}   className='border-blue-900 p-3 m-2 cursor-pointer rounded-md flex justify-center items-center bg-white placeholder:text-white outline-none border-2  w-fit '>{singUp ? "Register" : "Sign up"} </button>
        </div>
        <div className='flex justify-start '>
        <button   className='border-blue-900 p-3 m-2 cursor-pointer rounded-md flex justify-center items-center bg-white placeholder:text-white outline-none border-2  w-fit '><Image className='mx-2' src={search} alt="clock image"  width={20} height={20}  /> Sign up with google </button>
        <button onClick={()=>Register(Username,Name,Email,Password,Surname)}  className='border-blue-900 p-3 m-2  cursor-pointer rounded-md bg-blue-900 placeholder:text-white outline-none border-2 w-fit'><Image src={next} alt="clock image"  width={40} height={40}  /></button>
        </div>
        </div>
        </div>
        <AnimatePresence>
  {showIntro && (
    <motion.div
      className="fixed inset-0 z-50"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
    >
      <StarField titleLocation={titleReference} />
    </motion.div>
  )}
</AnimatePresence>
    </div>
  )
}




import { Micro_5 } from 'next/font/google';
import Image from 'next/image';
import next from "../../../../../public/img/next.png";
import search from "../../../../../public/img/search.png";
import React, { useEffect, useRef, useState } from 'react'
import "@/features/auth/components/Login/style.css";
import { useAuth } from "@/features/auth/context/AuthContext";
import "@/features/auth/components/Login/Login.css";
import 'swiper/css';
import { useRouter } from 'next/navigation';
import { Login, Register } from '@/features/auth/data/auth.repository';
import StarField from "@/features/auth/components/Login/StarField";
const Micro = Micro_5({weight:"400",subsets:['latin'],});
 interface LoginProps{
    setLoginProps:(loggedIn: boolean) => void
    setUserProps:React.Dispatch<React.SetStateAction<object>>
}
export default function  LoginComponent({setLoginProps,setUserProps}:LoginProps) {
  const [Username,setUsername] = useState<string | null>("");
  const [Name,setName] = useState<string | null>("");
    const [Surname,setSurname] = useState<string | null>("");
     const [Email,setEmail] = useState<string | null>("");
      const [Password,setPassword] = useState<string | null>("");
      const [,setRepeatedPassword] = useState<string | null>("");
      const [singUp,setSignUp] = useState<boolean>(false);
      const {setUser,setLoggedIn} = useAuth();
      const router = useRouter();
      const [loginError, setLoginError] = useState('');
      const [googleLoading, setGoogleLoading] = useState(false);
      useEffect(() => {
        const url = new URL(window.location.href);
        const error = url.searchParams.get('auth_error');
        if (!error) return;
        const messages: Record<string, string> = {
          google_cancelled: 'Google sign-in was cancelled. You can try again.',
          google_existing_email: 'An account with this email already exists. Sign in with your username and password.',
          google_setup: 'Google account setup is not complete. Run the Google sign-in database migration.',
          google_failed: 'Could not sign in with Google. Please try again.',
        };
        setLoginError(messages[error] ?? messages.google_failed);
        url.searchParams.delete('auth_error');
        window.history.replaceState(null, '', url.pathname + url.search + url.hash);
      }, []);
      const handleGoogleLogin = async () => {
        if (googleLoading) return;
        setGoogleLoading(true); setLoginError('');
        try {
          const response = await fetch('/api/auth/google', { method: 'POST' });
          const data = await response.json();
          if (!response.ok || !data.url) throw new Error(data.error ?? 'Could not start Google sign-in.');
          window.location.assign(data.url);
        } catch (cause) {
          setLoginError(cause instanceof Error ? cause.message : 'Could not sign in with Google.');
          setGoogleLoading(false);
        }
      };
      const handleLogin = async () => {
  setLoginError('');
  try {
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
  } catch (error) { setLoginError(error instanceof Error ? error.message : 'Could not sign in.'); }
};
const titleReference = useRef<HTMLHeadingElement | null>(null);

  return (
    <div className='auth-page'>
      <div className='auth-visual'>
        <Image className='auth-image' src="/img/LoginImage3.jpg" fill sizes="(min-width: 1024px) 50vw, 100vw" alt="" />
      </div>
      <div className='auth-panel'>
      <div className='auth-content'>
        <h1 ref={titleReference} data-helptask-login-logo className={"auth-title text-center text-blue-900 "+ Micro.className}>HelpTask</h1>
        {loginError && <p role="alert" className="mt-3 text-sm text-red-700">{loginError}</p>}
        
        {singUp == true ? 
          <div className='auth-fields'>
        
        <input type='text' onChange={(e)=>setUsername(e.target.value)} placeholder='Write your Username' className='border-blue-300 p-3 cursor-pointer rounded-md bg-blue-300 text-white placeholder:text-white  outline-none border-2 col-span-2'/>
        <input type='password' onChange={(e)=>setPassword(e.target.value)} placeholder='Write password' className='border-blue-300 p-3 cursor-pointer rounded-md bg-blue-300 text-white placeholder:text-white outline-none border-2 col-span-2'/>
        
       <button onClick={()=>{handleLogin()}}   className='border-blue-900 p-3 m-2 cursor-pointer rounded-md flex justify-center items-center bg-white placeholder:text-white outline-none border-2  w-fit '>Sign up </button>
        </div>  
        : 
      <div className='auth-fields'>
          
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
        <div className='auth-actions'>
        <button type="button" onClick={() => void handleGoogleLogin()} disabled={googleLoading} className='border-blue-900 p-3 m-2 cursor-pointer rounded-md flex justify-center items-center bg-white placeholder:text-white outline-none border-2 w-fit disabled:cursor-wait disabled:opacity-60'><Image className='mx-2' src={search} alt="" width={20} height={20} />{googleLoading ? 'Connecting to Google...' : singUp ? 'Sign in with Google' : 'Sign up with Google'}</button>
        <button aria-label="Register" onClick={()=>Register(Username,Name,Email,Password,Surname)}  className='border-blue-900 p-3 m-2  cursor-pointer rounded-md bg-blue-900 placeholder:text-white outline-none border-2 w-fit'><Image src={next} alt="clock image"  width={40} height={40}  /></button>
        </div>
        </div>
        </div>
        <StarField titleLocation={titleReference} />
    </div>
  )
}



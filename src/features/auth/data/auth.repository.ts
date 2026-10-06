import { supabase } from '@/lib/supabase/client';
import type { UserType as Usertype } from '@/types/UserType';

export async function sendEmailNotification(user:any){
 
  const numbers = [Math.floor(Math.random()*10), Math.floor(Math.random()*10), Math.floor(Math.random()*10), Math.floor(Math.random()*10)];
  const letternumbers = numbers.splice(0,4).toString().replace(/,/g,'');
  localStorage.setItem("verificationCode",letternumbers);
  fetch("/api/send-email", {
  method: "POST",
  body: JSON.stringify({
    to: user.email,
    subject: "Dobrodošao",
    text: `Dear ${user?.Username}, your verification code is: ${letternumbers}`,
  }),
});
}

export async function  saveChanges(Name:string | undefined,Surname:string,Username:string,user:Usertype) {
   //logic for saving changes to user profile
   const {data,error} = await supabase.from('Users').update({Name:Name,Surname:Surname,Username:Username}).eq('id',user?.id).select().single();
   if(error){
    console.log("Error updating user:",error);
    }else{
    console.log("User updated successfully:",data);
    return data;
    }
  }

export async function Register(Username:string | null, Name:string | null, Email:string | null, Password:string | null,Surname:string | null){
            if(Username != null && Name != null && Surname != null && Email != null && Password != null){
                const {error} = await supabase.from("Users").insert({Name:Name,Surname:Surname,Password:Password,email:Email,Username:Username});
                
                if(!error){
                      console.log("Uspesno ste se registrovali");
                     return true;
                     
                }
                else{
                  console.log(error);
                }
            }
    }

export async function Login(Username:string | null,Password:string | null){
    
      if(Username != null && Password != null){
                const {data,error} = await supabase.from("Users").select("*").eq("Username",Username).eq("Password",Password).single();
                
                if(!error && data != null){
                      console.log("Uspesno ste se ulogovali");
                    
                    console.log(data);
                         return data;
                }
                else{
                  if(error?.code === 'PGRST116'){
                    console.log("Nije pronadjen korisnik");
                  }
                  console.log(data);
                  console.log("Pogresni kredencijali");
                  console.log(error);
                }
            }
    }

export async function setUserAfterDisplay(user:object | null){
      console.log(user);
            const {data,error} = await supabase.from("Users").select("*").eq("id",user?.id).single();
             
            return data;
           
            
      }

export async function getUsers(){
        const {data,error} = await supabase.from("Users").select("*");
        if(error){
            console.log(error);

        }
        else{
            return data;
        }
      }

export async function Search(search:string){
        const {data,error} = await supabase.from("Users").select("*").ilike("Username",`%${search}%`);
        if(error){
            console.log(error);
        }
        else{
            return data;
        }
    }

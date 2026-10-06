
import Image from "next/image";
import {
  faCircle,
  faEllipsis,
  faMagnifyingGlass,
  faMessage,
  faUserGroup,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { motion } from "framer-motion";
import React, { SetStateAction, useEffect, useState } from "react";
import { UserType } from "../Types/UserType";
import { getFriends } from "@/app/api/supabase";
import { useAuth } from "@/app/context/AuthContext";
interface Friend {
  id: number;
  name: string;
  username: string;
  image: string;
  status: "online" | "offline";
  unreadMessages?: number;
}

interface FriendsListProps {
  friends?: Friend[];
  setIsActive:React.Dispatch<React.SetStateAction<boolean>>
}

interface FriendRelation {
  friend: UserType;
  created_at: string;
  accepted_at: string | null;
}

export default function Friends({
   setIsActive
}: FriendsListProps) {
const {user} = useAuth();
const [friends,setFriends] = useState<object[]>([]);
async function getFriendsFunc(){
  console.log(user);
          const data = await getFriends(user);
          console.log(data);
          setFriends(data);
          
        }

  useEffect(()=>{
        if(!user) return;
        getFriendsFunc();
        console.log(friends);
  },[])
  return (
    <aside className="flex h-screen w-full flex-col border-x-2 border-blue-300 bg-white text-blue-950 md:w-1/4">
      <header className="border-b-2 border-blue-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500 text-white">
              <FontAwesomeIcon icon={faUserGroup} className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-lg font-bold">Friends</h2>
              <p className="text-sm text-blue-500">
                {friends.length} friends
              </p>
            </div>
          </div>

          <FontAwesomeIcon
            icon={faEllipsis}
            className="h-5 w-5 text-blue-900"
          />
        </div>

        <div className="mt-4 flex items-center rounded-lg bg-blue-50 px-3 py-2">
          <FontAwesomeIcon
            icon={faMagnifyingGlass}
            className="h-4 w-4 text-blue-400"
          />

          <input
            type="text"
            placeholder="Search friends..."
            className="w-full bg-transparent px-3 text-sm text-blue-950 outline-none placeholder:text-blue-300"
            
          />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-3">
        <section>
          <div className="mb-2 flex items-center justify-between px-2">
            <h3 className="text-sm font-bold uppercase tracking-wide text-blue-900">
              Online
            </h3>

            <span className="rounded-md bg-blue-200 px-2 py-0.5 text-xs font-semibold text-blue-900">
              {friends.length}
            </span>
          </div>

          <ul className="space-y-1">
            {friends.map((fr,index) => (
              <motion.li 
                key={fr.friend.id}
                className="group flex items-center justify-between rounded-lg p-2 transition-all duration-200 hover:bg-blue-100"
                initial={{filter:"blur(10)",opacity:0}} animate={{filter:"blur(0)",opacity:1}} 
                transition={{duration:0.3,delay:index*0.15}}
              >
                <div className="flex min-w-0 items-center gap-3" 
              
                  >
                  <div className="relative shrink-0">
                    <Image
                      src={`/images/${fr.friend.image}.jpg`}
                      alt={fr.friend.Name}
                      width={42}
                      height={42}
                      className="h-11 w-11 rounded-full object-cover"
                    />

                    <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-green-500" />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate font-semibold text-blue-950">
                      {fr.friend.Name}
                    </p>

                    <div className="flex items-center gap-1.5">
                      <FontAwesomeIcon
                        icon={faCircle}
                        className="h-1.5 w-1.5 text-green-500"
                      />

                      <p className="truncate text-xs text-blue-500">
                        Active now
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {fr.friend.unreadMessages ? (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-500 px-1.5 text-xs font-bold text-white">
                      {fr.friend.unreadMessages}
                    </span>
                  ) : null}

                  <FontAwesomeIcon
                    icon={faMessage}
                    className="h-4 w-4 text-blue-400"
                  />
                </div>
              </motion.li>
            ))}
          </ul>
        </section>

        <hr className="my-4 border-t-2 border-blue-200" />

        <section>
          <div className="mb-2 flex items-center justify-between px-2">
            <h3 className="text-sm font-bold uppercase tracking-wide text-blue-900">
              Offline
            </h3>

            <span className="rounded-md bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
              {friends.length}
            </span>
          </div>

          <ul className="space-y-1">
            {friends.map((fr,index) => (
              <motion.li initial={{filter:"blur(10)",opacity:0}} animate={{filter:"blur(0)",opacity:1}} 
                transition={{duration:0.3,delay:index*0.15}}
                key={fr.friend.id}
                className="group flex items-center justify-between rounded-lg p-2 opacity-75 transition-all duration-200 hover:bg-blue-100 hover:opacity-100"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="relative shrink-0">
                    <Image
                      src={`/images/${fr.friend.image}.jpg`}
                      alt={fr.friend.Name}
                      width={42}
                      height={42}
                      className="h-11 w-11 rounded-full object-cover grayscale"
                    />

                    <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-slate-400" />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate font-semibold text-blue-950">
                      {fr.friend.Name}
                    </p>

                    <p className="truncate text-xs text-blue-400">
                      {fr.friend.Username}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {fr.friend.unreadMessages ? (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-500 px-1.5 text-xs font-bold text-white">
                      {fr.friend.unreadMessages}
                    </span>
                  ) : null}

                  <FontAwesomeIcon
                    icon={faMessage}
                    className="h-4 w-4 text-blue-300"
                  />
                </div>
              </motion.li>
            ))}
          </ul>
        </section>
      </div>

      <footer className="border-t-2 border-blue-200 p-3">
        <div onClick={()=>setIsActive(true)} 
         className="flex items-center justify-between rounded-lg bg-blue-500 px-4 py-3 text-white hover:cursor-pointer">
          <div className="flex items-center gap-3">
            <FontAwesomeIcon icon={faUserGroup} className="h-5 w-5" />

            <div>
              <p className="text-sm font-bold">Find new friends</p>
              <p className="text-xs text-blue-100">
                Expand your workspace
              </p>
            </div>
          </div>

          <span className="text-xl font-light">+</span>
        </div>
      </footer>
    </aside>
  );
}
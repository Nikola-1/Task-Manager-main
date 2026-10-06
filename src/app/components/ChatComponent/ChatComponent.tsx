import Image from "next/image";
import {
  faAngleLeft,
  faEllipsisVertical,
  faFaceSmile,
  faFile,
  faImage,
  faMicrophone,
  faPaperPlane,
  faPhone,
  faSearch,
  faVideo,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { motion } from "framer-motion";
interface Message {
  id: number;
  content: string;
  time: string;
  sender: "me" | "friend";
  type?: "text" | "image" | "file";
  image?: string;
  fileName?: string;
  fileSize?: string;
}

interface ChatUser {
  name: string;
  username: string;
  image: string;
  status: "online" | "offline";
}

interface ChatProps {
  user?: ChatUser;
  messages?: Message[];
}

const demoUser: ChatUser = {
  name: "Marko Petrović",
  username: "@markop",
  image: "/img/user.png",
  status: "online",
};

const demoMessages: Message[] = [
  {
    id: 1,
    content: "Ćao, da li si završio novi dizajn za task manager?",
    time: "14:20",
    sender: "friend",
  },
  {
    id: 2,
    content: "Jesam, upravo radim na friends i chat sekciji.",
    time: "14:22",
    sender: "me",
  },
  {
    id: 3,
    content: "Super izgleda. Sviđa mi se plava paleta.",
    time: "14:24",
    sender: "friend",
  },
  {
    id: 4,
    content: "",
    time: "14:25",
    sender: "me",
    type: "image",
    image: "/img/chat-preview.png",
  },
  {
    id: 5,
    content: "Poslao sam ti i dokument sa predlozima.",
    time: "14:27",
    sender: "friend",
    type: "file",
    fileName: "project-notes.pdf",
    fileSize: "2.4 MB",
  },
  {
    id: 6,
    content: "Odlično, pogledaću kasnije.",
    time: "14:30",
    sender: "me",
  },
];

export default function ChatComponent({
  user = demoUser,
  messages = demoMessages,
}: ChatProps) {
  return (
    <section className="flex h-screen w-full flex-col bg-white text-blue-950">
      <header className="flex items-center justify-between border-b-2 border-blue-200 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <FontAwesomeIcon
            icon={faAngleLeft}
            className="h-5 w-5 cursor-pointer text-blue-900 md:hidden"
          />

          <motion.div className="relative shrink-0" 
          initial= {{opacity:0,scale:1.8,filter:"blur(10px)",rotate:-8}}
          animate={{
            opacity:1,
            scale:1,
            filter:"blur(0px)",
            rotate:0,
          }}

          transition={{
            duration:1.0,
            delay:0.3,
            ease:[0.16,1,0.3,1],
          }}
          >
            <Image src={user.image}
            alt = {user.name}
            width={48}
            height={48}
            className="h-12 w-12 rounded-full object-cover"
            />

          </motion.div>

          <div className="min-w-0">
            <h2 className="truncate text-base font-bold text-blue-950">
              {user.name}
            </h2>

            <p
              className={`text-xs ${
                user.status === "online"
                  ? "text-green-500"
                  : "text-blue-400"
              }`}
            >
              {user.status === "online" ? "Active now" : "Offline"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-blue-900">
          <FontAwesomeIcon
            icon={faSearch}
            className="h-4 w-4 cursor-pointer"
          />

          <FontAwesomeIcon
            icon={faPhone}
            className="h-4 w-4 cursor-pointer"
          />

          <FontAwesomeIcon
            icon={faVideo}
            className="h-4 w-4 cursor-pointer"
          />

          <FontAwesomeIcon
            icon={faEllipsisVertical}
            className="h-5 w-5 cursor-pointer"
          />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto bg-blue-50/40 px-4 py-6">
        <div className="mx-auto flex max-w-4xl flex-col gap-4">
          <div className="my-2 flex items-center gap-3">
            <div className="h-px flex-1 bg-blue-200" />

            <span className="text-xs font-medium text-blue-400">
              Today
            </span>

            <div className="h-px flex-1 bg-blue-200" />
          </div>

          {messages.map((message) => {
            const isMine = message.sender === "me";

            return (
              <div
                key={message.id}
                className={`flex items-end gap-2 ${
                  isMine ? "justify-end" : "justify-start"
                }`}
              >
                {!isMine && (
                  <Image
                    src={user.image}
                    alt={user.name}
                    width={32}
                    height={32}
                    className="h-8 w-8 shrink-0 rounded-full object-cover"
                  />
                )}

                <div
                  className={`flex max-w-[78%] flex-col ${
                    isMine ? "items-end" : "items-start"
                  }`}
                >
                  {message.type === "image" && message.image ? (
                    <div className="overflow-hidden rounded-2xl rounded-br-md border-2 border-blue-200 bg-white p-1 shadow-sm">
                      <Image
                        src={message.image}
                        alt="Shared image"
                        width={320}
                        height={200}
                        className="max-h-64 w-full rounded-xl object-cover"
                      />
                    </div>
                  ) : message.type === "file" ? (
                    <div
                      className={`flex min-w-64 items-center gap-3 rounded-2xl px-4 py-3 shadow-sm ${
                        isMine
                          ? "rounded-br-md bg-blue-500 text-white"
                          : "rounded-bl-md border border-blue-200 bg-white text-blue-950"
                      }`}
                    >
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                          isMine
                            ? "bg-blue-400"
                            : "bg-blue-100 text-blue-500"
                        }`}
                      >
                        <FontAwesomeIcon
                          icon={faFile}
                          className="h-5 w-5"
                        />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {message.fileName}
                        </p>

                        <p
                          className={`text-xs ${
                            isMine
                              ? "text-blue-100"
                              : "text-blue-400"
                          }`}
                        >
                          {message.fileSize}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                        isMine
                          ? "rounded-br-md bg-blue-500 text-white"
                          : "rounded-bl-md border border-blue-200 bg-white text-blue-950"
                      }`}
                    >
                      {message.content}
                    </div>
                  )}

                  <span className="mt-1 px-1 text-[11px] text-blue-400">
                    {message.time}
                  </span>
                </div>
              </div>
            );
          })}

          <div className="flex items-end gap-2">
            <Image
              src={user.image}
              alt={user.name}
              width={32}
              height={32}
              className="h-8 w-8 rounded-full object-cover"
            />

            <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-blue-200 bg-white px-4 py-3 shadow-sm">
              <span className="h-2 w-2 animate-pulse rounded-full bg-blue-400" />
              <span className="h-2 w-2 animate-pulse rounded-full bg-blue-400 [animation-delay:150ms]" />
              <span className="h-2 w-2 animate-pulse rounded-full bg-blue-400 [animation-delay:300ms]" />
            </div>
          </div>
        </div>
      </div>

      <footer className="border-t-2 border-blue-200 bg-white p-3">
        <div className="mx-auto flex max-w-4xl items-end gap-2">
          <div className="flex items-center gap-3 px-1 pb-3 text-blue-500">
            <FontAwesomeIcon
              icon={faImage}
              className="h-5 w-5 cursor-pointer"
            />

            <FontAwesomeIcon
              icon={faFile}
              className="h-5 w-5 cursor-pointer"
            />
          </div>

          <div className="flex flex-1 items-end rounded-2xl border-2 border-blue-200 bg-blue-50 px-4 py-2 transition-all focus-within:border-blue-400">
            <textarea
              placeholder="Write a message..."
              rows={1}
              
              className="max-h-28 min-h-7 flex-1 resize-none bg-transparent py-1 text-sm text-blue-950 outline-none placeholder:text-blue-300"
            />

            <FontAwesomeIcon
              icon={faFaceSmile}
              className="mb-1 h-5 w-5 cursor-pointer text-blue-400"
            />
          </div>

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white shadow-sm">
            <FontAwesomeIcon
              icon={faPaperPlane}
              className="h-4 w-4"
            />
          </div>

          <FontAwesomeIcon
            icon={faMicrophone}
            className="mb-3 hidden h-5 w-5 cursor-pointer text-blue-500 sm:block"
          />
        </div>
      </footer>
    </section>
  );
}
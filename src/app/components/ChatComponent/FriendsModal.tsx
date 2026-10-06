import Image from "next/image";
import {
  faMagnifyingGlass,
  faUserPlus,
  faXmark,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface UserPreview {
  id: number;
  name: string;
  username: string;
  image: string;
  status: "online" | "offline";
  selected?: boolean;
}

interface AddUsersModalProps {
  users?: UserPreview[];
  isActive:boolean,
  setIsActive:React.Dispatch<React.SetStateAction<boolean>>
}

const demoUsers: UserPreview[] = [
  {
    id: 1,
    name: "Ana Petrović",
    username: "@anapetrovic",
    image: "/img/user.png",
    status: "online",
    selected: true,
  },
  {
    id: 2,
    name: "Nikola Jovanović",
    username: "@nikolaj",
    image:"/img/user.png",
    status: "offline",
  },
  {
    id: 3,
    name: "Milica Ilić",
    username: "@milicailic",
    image: "/img/user.png",
    status: "online",
  },
  {
    id: 4,
    name: "Luka Marković",
    username: "@lukam",
    image: "/img/user.png",
    status: "offline",
  },
];

export default function FriendsModal({
  users = demoUsers,isActive,setIsActive
}: AddUsersModalProps) {
  const selectedUsers = users.filter((user) => user.selected);

  return (
    <div className={isActive ? "fixed inset-0 z-50 flex items-center justify-center bg-blue-950/40 px-4 backdrop-blur-sm" : "hidden"}>
      <div className="flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border-2 border-blue-200 bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b-2 border-blue-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500 text-white">
              <FontAwesomeIcon icon={faUserPlus} className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-blue-950">
                Add users
              </h2>

              <p className="text-sm text-blue-400">
                Select users you want to add
              </p>
            </div>
          </div>

          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full text-blue-400 transition-all hover:bg-blue-100 hover:text-blue-900"
          >
            <FontAwesomeIcon  onClick={()=>setIsActive(false)} icon={faXmark} className="h-5 w-5" />
          </button>
        </header>

        <div className="border-b border-blue-100 px-5 py-4">
          <div className="flex items-center rounded-xl border-2 border-blue-100 bg-blue-50 px-4 py-2.5 transition-all focus-within:border-blue-400">
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className="h-4 w-4 text-blue-400"
            />

            <input
              type="text"
              placeholder="Search users..."
              readOnly
              className="w-full bg-transparent px-3 text-sm text-blue-950 outline-none placeholder:text-blue-300"
            />
          </div>

          <div className="mt-3 flex items-center justify-between">
            <p className="text-sm font-medium text-blue-900">
              Available users
            </p>

            <span className="rounded-md bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
              {users.length} users
            </span>
          </div>
        </div>

        {selectedUsers.length > 0 && (
          <div className="border-b border-blue-100 bg-blue-50/70 px-5 py-3">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-blue-500">
              Selected
            </p>

            <div className="flex flex-wrap gap-2">
              {selectedUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-2 rounded-full border border-blue-200 bg-white py-1 pl-1 pr-3 shadow-sm"
                >
                  <Image
                    src={user.image}
                    alt={user.name}
                    width={28}
                    height={28}
                    className="h-7 w-7 rounded-full object-cover"
                  />

                  <span className="max-w-28 truncate text-xs font-semibold text-blue-900">
                    {user.name}
                  </span>

                  <FontAwesomeIcon
                    icon={faXmark}
                    className="h-3 w-3 text-blue-400"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-3 py-3">
          <ul className="space-y-1">
            {users.map((user) => (
              <li
                key={user.id}
                className={`group flex items-center justify-between rounded-xl border p-3 transition-all duration-200 ${
                  user.selected
                    ? "border-blue-300 bg-blue-100"
                    : "border-transparent hover:border-blue-100 hover:bg-blue-50"
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="relative shrink-0">
                    <Image
                      src={user.image}
                      alt={user.name}
                      width={44}
                      height={44}
                      className="h-11 w-11 rounded-full object-cover"
                    />

                    <span
                      className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white ${
                        user.status === "online"
                          ? "bg-green-500"
                          : "bg-slate-400"
                      }`}
                    />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate font-semibold text-blue-950">
                      {user.name}
                    </p>

                    <div className="flex items-center gap-2">
                      <p className="truncate text-xs text-blue-400">
                        {user.username}
                      </p>

                      <span className="text-xs text-blue-200">•</span>

                      <p
                        className={`text-xs ${
                          user.status === "online"
                            ? "text-green-500"
                            : "text-slate-400"
                        }`}
                      >
                        {user.status === "online" ? "Online" : "Offline"}
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                    user.selected
                      ? "border-blue-500 bg-blue-500 text-white"
                      : "border-blue-200 bg-white text-transparent group-hover:border-blue-400"
                  }`}
                >
                  <FontAwesomeIcon icon={faCheck} className="h-3 w-3" />
                </div>
              </li>
            ))}
          </ul>
        </div>

        <footer className="flex items-center justify-between border-t-2 border-blue-100 bg-white px-5 py-4">
          <p className="text-sm text-blue-500">
            <span className="font-bold text-blue-900">
              {selectedUsers.length}
            </span>{" "}
            selected
          </p>

          <div className="flex items-center gap-2">
            <button
            onClick={()=>setIsActive(false)}
              type="button"
              className="rounded-xl border-2 border-blue-200 px-4 py-2 text-sm font-semibold text-blue-900 transition-all hover:bg-blue-50"
            >
              Cancel
            </button>

            <button
              type="button"
              className="flex items-center gap-2 rounded-xl bg-blue-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-600"
            >
              <FontAwesomeIcon icon={faUserPlus} className="h-4 w-4" />
              Add users
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
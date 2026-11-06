'use client'

// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { faUser } from "@fortawesome/free-solid-svg-icons";
import menu from "@/assets/img/menu.png";
import Image from "next/image";
import user from "@/assets/img/user.png"
import Calendar from "@/assets/img/calendar.png";
import sync from "@/assets/img/sync.png";
import clock from "@/assets/img/clock.png";
import Groups from "@/assets/img/Groups.png";
import { Micro_5 } from "next/font/google";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faXmark } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import Link from "next/link"
import { usePathname } from "next/navigation";
import { useAuth } from '@/features/auth/context/AuthContext';
import useGroupNotifications from '@/features/groups/hooks/useGroupNotifications';
const Micro = Micro_5({weight:"400",subsets:['latin'],});
export default function Nav(){
    const [active, setActive] = useState(false);
    const pathname = usePathname();
    const { user: currentUser } = useAuth();
    const groupNotifications = useGroupNotifications(currentUser?.id);
    const links = [
        { href: '/pages/Account', label: 'Account', icon: user },
        { href: '/pages/Task', label: 'Tasks', icon: menu },
        { href: '/pages/Calendar', label: 'Calendar', icon: Calendar },
        { href: '/pages/Habits', label: 'Habits', icon: sync },
        { href: '/pages/Groups', label: 'Groups', icon: Groups },
        { href: '/pages/Pomodoro', label: 'Pomodoro', icon: clock },
    ];
    return(
        <nav aria-label="Main navigation" className="nav sticky top-0 z-30 w-full shrink-0 bg-blue-300 shadow-sm md:static md:h-screen md:w-36 md:shadow-none">
             <div className="wrapper mx-auto w-full md:w-24">
                <div className="flex h-16 items-center justify-between px-4 md:h-auto md:justify-center md:px-0">
                    <h1 data-helptask-sidebar-logo className={"text-center text-4xl leading-none text-blue-900 md:mt-3 md:text-3xl " + Micro.className}>HelpTask</h1>
                    <button type="button" aria-label={active ? 'Close navigation' : 'Open navigation'}
                        aria-expanded={active} aria-controls="main-navigation-links"
                        onClick={() => setActive(current => !current)}
                        onKeyDown={event => { if (event.key === 'Escape') setActive(false); }}
                        className="flex size-11 items-center justify-center rounded-lg text-blue-900 hover:bg-blue-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-900 md:hidden">
                        <FontAwesomeIcon icon={active ? faXmark : faBars} className="size-5" />
                    </button>
                </div>
                <ul id="main-navigation-links"
                    onKeyDown={event => {
                        if (event.key === 'Escape') {
                            setActive(false);
                            event.currentTarget.parentElement?.querySelector('button')?.focus();
                        }
                    }}
                    className={(active ? 'grid' : 'hidden') + ' grid-cols-3 gap-2 border-t border-blue-900/15 p-3 md:flex md:flex-col md:gap-0 md:border-0 md:p-0'}>
                    {links.map(({ href, label, icon }) => {
                        const selected = pathname === href || pathname.startsWith(href + '/');
                        return <li key={href} className="min-w-0 md:m-3 md:flex md:justify-center">
                            <Link href={href} aria-current={selected ? 'page' : undefined} title={label}
                                aria-label={href === '/pages/Groups' && groupNotifications > 0 ? `Groups, ${groupNotifications} new notifications` : label}
                                onClick={() => setActive(false)}
                                className={'flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl px-1 py-3 text-blue-900 transition-colors hover:bg-blue-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-900 md:min-h-0 md:p-2 ' + (selected ? 'bg-blue-100 ring-2 ring-inset ring-blue-900/25' : '')}>
                                <span className="relative inline-flex shrink-0">
                                <Image src={icon} alt="" data-sidebar-profile={href === '/pages/Account' ? true : undefined}
                                    width={40} height={40} className="size-7 object-contain md:size-10" />
                                {href === '/pages/Groups' && groupNotifications > 0 && <span aria-hidden="true" className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-blue-300">{groupNotifications > 99 ? '99+' : groupNotifications}</span>}
                                </span>
                                <span className="max-w-full text-center text-xs font-semibold leading-snug md:sr-only">{label}</span>
                            </Link>
                        </li>;
                    })}
                </ul>
             </div>
             <svg className="mario-sidebar-mushroom" aria-hidden="true" viewBox="0 0 32 28" width="64" height="56" shapeRendering="crispEdges">
                <defs>
                  <linearGradient id="sidebar-mushroom-cap" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#ff6476" />
                    <stop offset=".35" stopColor="#f93842" />
                    <stop offset=".72" stopColor="#d51e30" />
                    <stop offset="1" stopColor="#86232c" />
                  </linearGradient>
                </defs>
                <path fill="#21151b" d="M9 17h14v2h3v5h-2v2h-2v1H10v-1H8v-2H6v-5h3z" />
                <path fill="#e6ad8e" d="M9 19h14v1h1v4h-2v1H10v-1H8v-4h1z" />
                <path fill="#ffdcc0" d="M10 19h12v5H10z" />
                <path fill="#fff8e9" d="M12 19h8v6h-8z" />
                <path fill="#21151b" d="M11 19h2v4h-2zM19 19h2v4h-2z" />
                <path fill="#21151b" d="M11 1h10v1h4v2h2v2h2v3h2v4h1v5h-2v2H2v-2H0v-5h1V9h2V6h2V4h2V2h4z" />
                <path fill="url(#sidebar-mushroom-cap)" d="M11 3h10v1h4v2h2v3h2v4h1v4h-2v1H4v-1H2v-4h1V9h2V6h2V4h4z" />
                <path fill="#ff8892" d="M11 3h10v1H11zM7 4h4v1H7zM5 6h2v2H5zM3 10h1v3H3zM12 7h8v1h2v2h-2V9h-8z" />
                <path fill="#a92b38" d="M3 15h3v1h20v-1h3v2h-1v1H4v-1H3z" />
                <path fill="#ffe5e8" d="M12 8h8v1h2v6h-2v2h-8v-2h-2V9h2z" />
                <path fill="#fffdf4" d="M13 8h6v1h2v5h-2v2h-6v-2h-2V9h2zM4 9h3v1h1v4H7v2H3v-3h1zM25 9h3v4h1v3h-4v-2h-1v-4h1zM14 3h4v2h-4z" />
                <path fill="#eadbd8" d="M12 15h2v1h6v-1h2v1h-2v1h-8zM3 15h4v1H3zM25 15h4v1h-4z" />
             </svg>
        </nav>
    )
}


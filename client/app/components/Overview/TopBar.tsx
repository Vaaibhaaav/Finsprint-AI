"use client"

import { useUser } from "@clerk/nextjs"
import { BellIcon, MessageCircle, SearchIcon } from "lucide-react"
import { useRouter } from "next/navigation"

export default function TopBar() {
    const {user} = useUser()
    const router = useRouter()
    return (
        <div
            style={{
                fontFamily:
                    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            }}
            className="relative flex flex-row items-center justify-between w-full bg-neutral-800 border-b border-[#1C1C1F] px-8 py-[15px] overflow-hidden select-none rounded-md">

            <div className="absolute top-[-50px] left-[5%] w-[250px] h-[100px] bg-emerald-500/5 rounded-full blur-[40px] pointer-events-none" />

            <div className="z-10 flex flex-row items-center gap-1.5 text-white font-medium text-[20px] tracking-tight">
                <span className="text-base">Hi,</span>
                <span className="text-[#A1A1AA]">{user?.fullName?.toString() || "User"}</span>
            </div>

            <div className="z-10 flex flex-row items-center gap-[18px]">
                <span className="text-neutral-500 text-[17px] font-medium tracking-normal mr-1">
                    {new Date().toLocaleDateString()}
                </span>

                <button className="text-neutral-500 hover:text-[#A1A1AA] transition-colors duration-150">
                    <SearchIcon size={15} strokeWidth={2} />
                </button>

                <button
                onClick={()=>router.push("/chat")}
                className="text-neutral-500 hover:text-[#A1A1AA] transition-colors duration-150 relative">
                    <MessageCircle size={15} strokeWidth={2} />
                    <span className="absolute top-[0.5px] right-[0.5px] w-[5px] h-[5px] bg-[#EF4444] rounded-full ring-[1.5px] ring-[#131316]" />
                </button>
            </div>

        </div>
    )
}
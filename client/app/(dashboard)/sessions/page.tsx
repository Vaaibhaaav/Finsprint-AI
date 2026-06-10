'use client'
import { useEffect, useState } from "react"
import UserSession from "./UserSession"
import { useSessionStore } from "@/store/sessionStore"
import CoachSession from "./CoachSession"
import { useApi } from "@/lib/api"
import { useUserStore } from "@/store/userStore"

export default function Page() {

    const { sessions, setSessionData, getSessionsForUser, getSessionsForCoach, handleSessionActionCoach } = useSessionStore()
    const api = useApi()
    const { user } = useUserStore()
    const [userRole, setUserRole] = useState<string>(user?.Role || "coach")
    useEffect(() => {
        if (userRole === "coach") {
            getSessionsForCoach(api)
            console.log("API called for coach")
            console.log(sessions)
        } else {
            getSessionsForUser(api)
            console.log("API called for user")
            console.log(sessions)
        }
        return () => {
            setSessionData([])
        }
    }, [userRole])

    return (
        <div className="w-full space-y-4 text-slate-200">
            <div className="bg-neutral-800 mt-2 border border-neutral-800/40 rounded-xl flex flex-row justify-between p-4 items-center shadow-md">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight text-white">Consulting Sessions</h1>
                    <p className="text-xs text-neutral-400 mt-0.5">Manage booked advice blocks, review targets, and join digital streams.</p>
                </div>
                <div className="bg-[#131517] p-1 rounded-lg border border-neutral-800 flex gap-1">
                    <button
                        onClick={() => setUserRole("user")}
                        className={`text-xs px-3 py-1.5 rounded-md font-medium transition-all ${userRole === "user" ? "bg-[#9aeb8e] text-neutral-950" : "text-neutral-400 hover:text-white"}`}
                    >
                        User Mode
                    </button>
                    <button
                        onClick={() => setUserRole("coach")}
                        className={`text-xs px-3 py-1.5 rounded-md font-medium transition-all ${userRole === "coach" ? "bg-[#9aeb8e] text-neutral-950" : "text-neutral-400 hover:text-white"}`}
                    >
                        Coach Mode
                    </button>
                </div>
            </div>

            {userRole === "user" ? (
                <UserSession SessionData={sessions || []} setSessionData={setSessionData} />
            ) : (
                <CoachSession SessionData={sessions || []} setSessionData={setSessionData}
                    handleSessionActionAsCoach={(id: string, action: "accepted" | "rejected") => handleSessionActionCoach(id, action, api)} />
            )}
        </div>
    )
}
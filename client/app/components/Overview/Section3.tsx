"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { useSessionStore } from "@/store/sessionStore"
import { Calendar } from "lucide-react"

export default function Section3() {
    const router = useRouter()
    const { sessions } = useSessionStore()
    const [activeItem, setActiveItem] = React.useState(-1)

    // Filter upcoming active sessions
    const upcomingSessions = (sessions || [])
        .filter((s) => s.Status !== "rejected" && new Date(s.ScheduledAt).getTime() > Date.now())
        .sort((a, b) => new Date(a.ScheduledAt).getTime() - new Date(b.ScheduledAt).getTime())
        .slice(0, 2) // display maximum of 2 in preview

    return (
        <div
            style={{
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            }}
            className="bg-neutral-800 backdrop-blur-md border border-[#1C1C1F] p-5 rounded-2xl h-full w-full text-xs antialiased select-none flex flex-col justify-between"
        >
            <div>
                <h2 className="font-medium text-white text-[15px] tracking-tight mb-3">
                    Upcoming Sessions
                </h2>

                <div className="flex flex-col gap-2">
                    {upcomingSessions.length === 0 ? (
                        <div className="text-[#71717A] text-sm py-4 italic text-center">
                            No upcoming sessions booked
                        </div>
                    ) : (
                        upcomingSessions.map((session, idx) => {
                            const sessionDate = new Date(session.ScheduledAt)
                            const dateStr = sessionDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })
                            const timeStr = sessionDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
                            const coachName = session.Coach?.Name || "Specialist Coach"
                            const coachAvatar = session.Coach?.AvatarURL

                            return (
                                <div
                                    key={session.ID || idx}
                                    onClick={() => router.push("/sessions")}
                                    className={`flex flex-row p-3 items-center gap-3 rounded-xl transition-all duration-200 cursor-pointer ${
                                        activeItem === idx
                                            ? 'bg-neutral-700 opacity-90 border border-[#3F3F46]/30 shadow-md'
                                            : 'border border-[#27272a]/30 bg-neutral-900/30'
                                    }`}
                                    onMouseEnter={() => setActiveItem(idx)}
                                    onMouseLeave={() => setActiveItem(-1)}
                                >
                                    <div className="bg-[#131316] p-2.5 rounded-lg flex items-center justify-center shrink-0">
                                        {coachAvatar ? (
                                            <img src={coachAvatar} alt={coachName} className="w-6 h-6 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-6 h-6 rounded-full bg-[#2A2A2E] flex items-center justify-center">
                                                <span className="text-[10px] font-medium text-[#A1A1AA]">
                                                    {coachName.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-0.5 min-w-0">
                                        <h3 className="font-medium text-white text-sm tracking-tight truncate">
                                            {coachName}
                                        </h3>
                                        <p className="text-[#71717A] text-[11px] leading-normal flex items-center gap-1">
                                            <Calendar className="w-3 h-3 shrink-0" />
                                            <span>{dateStr} at {timeStr}</span>
                                        </p>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>
        </div>
    )
}
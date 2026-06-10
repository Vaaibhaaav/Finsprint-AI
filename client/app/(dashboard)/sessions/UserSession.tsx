'use client'

import React, { useState } from "react"
import { Calendar, Clock, XCircle, FileText, ExternalLink, HelpCircle, CheckCircle2, ShieldAlert } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Session } from "@/types/types"
import { useUserStore } from "@/store/userStore"

interface UserSessionProps {
    SessionData: Session[]
    setSessionData: (sessions: Session[]) => void
}

export default function UserSession({ SessionData, setSessionData }: UserSessionProps) {
    const [activeTab, setActiveTab] = useState<"pending" | "accepted" | "rejected">("pending")
    const [selectedSession, setSelectedSession] = useState<Session | null>(null)
    const sessionsArray = Array.isArray(SessionData) ? SessionData : []
    const filteredSessions = sessionsArray.filter(s => s.Status === activeTab)
    const { user } = useUserStore()
    const handleCancelSession = (id: string) => {
        if (confirm("Are you sure you want to cancel this booking request?")) {
            if (selectedSession?.ID === id) {
                setSelectedSession(null)
            }
        }
    }


    return (
        <div className="space-y-4">

            <div className="flex border-b border-neutral-800/80 gap-6 text-sm">
                {(["pending", "accepted", "rejected"] as const).map((tab) => {
                    const count = sessionsArray.filter(s => s.Status === tab).length
                    return (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "pb-3 font-medium capitalize relative px-1 transition-all flex items-center gap-2",
                                activeTab === tab
                                    ? "text-[#9aeb8e] border-b-2 border-[#9aeb8e]"
                                    : "text-neutral-500 hover:text-neutral-300"
                            )}
                        >
                            <span>{tab} Sessions</span>
                            <span className={cn(
                                "text-[11px] font-bold px-1.5 py-0.2 rounded-full",
                                activeTab === tab ? "bg-[#9aeb8e]/10 text-[#9aeb8e]" : "bg-neutral-800 text-neutral-500"
                            )}>
                                {count}
                            </span>
                        </button>
                    )
                })}
            </div>

            {filteredSessions.length === 0 && (
                <div className="bg-neutral-800 border border-neutral-800/40 rounded-xl p-12 text-center max-w-xl mx-auto space-y-2 mt-4 shadow-sm">
                    <HelpCircle className="mx-auto text-neutral-600" size={32} />
                    <p className="text-sm font-medium text-white">No {activeTab} instances recorded</p>
                    <p className="text-xs text-neutral-500">Book advice slots on your Coaches page to request speed tracking.</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSessions.map((session) => {
                    const sessionDate = new Date(session.ScheduledAt)

                    return (
                        <div
                            key={session.ID}
                            className="bg-neutral-800 border border-neutral-800/60 rounded-xl p-5 hover:border-neutral-700/80 transition-all flex flex-col justify-between space-y-4 shadow-sm relative group"
                        >
                            <div className={cn(
                                "absolute top-0 left-0 w-full h-[2px]",
                                session.Status === "accepted" && "bg-emerald-500/50",
                                session.Status === "pending" && "bg-amber-500/50",
                                session.Status === "rejected" && "bg-rose-500/50"
                            )} />

                            {/* Core Card Section (Triggers Dialog Modal when clicked) */}
                            <div onClick={() => setSelectedSession(session)} className="cursor-pointer space-y-3">
                                <div className="flex items-center gap-3">
                                    <img
                                        src={session.Coach?.AvatarURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"}
                                        alt={session.Coach?.Name}
                                        className="w-10 h-10 rounded-full object-cover border border-neutral-700 bg-neutral-800"
                                    />
                                    <div>
                                        <h3 className="font-semibold text-white group-hover:text-[#9aeb8e] transition-colors">{session.Coach?.Name}</h3>
                                        <p className="text-[11px] text-neutral-500">{session.Coach?.Email}</p>
                                    </div>
                                </div>

                                <div className="bg-[#131517] p-2.5 rounded-lg border border-neutral-800/50 space-y-1.5 text-xs">
                                    <div className="flex items-center gap-2 text-neutral-300">
                                        <Calendar size={13} className="text-[#9aeb8e]" />
                                        <span>{format(sessionDate, "EEEE, MMM dd, yyyy")}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-neutral-400">
                                        <Clock size={13} className="text-neutral-500" />
                                        <span>{format(sessionDate, "hh:mm a")} (UTC)</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-1 gap-2">
                                <button
                                    onClick={() => setSelectedSession(session)}
                                    className="text-[11px] font-medium text-neutral-400 hover:text-white flex items-center gap-1 bg-neutral-800 px-2.5 py-1.5 rounded-lg border border-neutral-700/40 transition-all"
                                >
                                    <FileText size={12} />
                                    <span>Details</span>
                                </button>

                                {session.Status !== "rejected" && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleCancelSession(session.ID); }}
                                        className="text-[11px] font-medium bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all border border-rose-500/20 active:scale-95"
                                    >
                                        <XCircle size={12} />
                                        <span>{session.Status === "pending" ? "Withdraw Request" : "Cancel Session"}</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Complete Request Overlay Dialog Frame */}
            <SessionDetailsDialog
                session={selectedSession}
                onClose={() => setSelectedSession(null)}
                onCancel={handleCancelSession}
            />

        </div>
    )
}

function SessionDetailsDialog({
    session,
    onClose,
    onCancel
}: {
    session: Session | null
    onClose: () => void
    onCancel: (id: string) => void
}) {
    if (!session) return null

    const sessionDate = new Date(session.ScheduledAt)
    const createdDate = new Date(session.CreatedAt)

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 text-xs">
            <div className="bg-[#1c1e22] border border-neutral-800 rounded-xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-150">

                {/* Header Information Element */}
                <div className="flex items-center justify-between border-b border-neutral-800 pb-3.5 mb-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-base font-semibold text-white">Request Parameters</h2>
                            <span className={cn(
                                "text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border",
                                session.Status === "accepted" && "bg-emerald-500/5 text-emerald-400 border-emerald-500/10",
                                session.Status === "pending" && "bg-amber-500/5 text-amber-400 border-amber-500/10",
                                session.Status === "rejected" && "bg-rose-500/5 text-rose-400 border-rose-500/10"
                            )}>
                                {session.Status}
                            </span>
                        </div>
                        <p className="text-neutral-500 mt-0.5 font-mono">ID: {session.ID}</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors">
                        <XCircle size={16} />
                    </button>
                </div>

                {/* Body Content Stack */}
                <div className="space-y-4">

                    {/* User and Coach Link Profile Card block */}
                    <div className="grid grid-cols-2 gap-3 border-b border-neutral-800 pb-3">
                        <div className="space-y-1">
                            <span className="text-[10px] text-neutral-500 uppercase tracking-wide block">Advisor Consultant</span>
                            <p className="font-semibold text-white text-sm">{session.Coach?.Name}</p>
                            <p className="text-neutral-400 text-[11px] truncate">{session.Coach?.Email}</p>
                        </div>
                        <div className="space-y-1 border-l border-neutral-800 pl-3">
                            <span className="text-[10px] text-neutral-500 uppercase tracking-wide block">Client Applicant</span>
                            <p className="font-semibold text-neutral-300 text-sm">{session.User?.Name}</p>
                            <p className="text-neutral-400 text-[11px] truncate">{session.User?.Email}</p>
                        </div>
                    </div>

                    <div className="bg-[#131517] p-3 rounded-lg border border-neutral-800/80 space-y-1">
                        <span className="text-neutral-500 font-medium flex items-center gap-1">
                            <FileText size={12} className="text-[#9aeb8e]" /> ACTION PLAN DIRECTIVES
                        </span>
                        <p className="text-neutral-200 leading-relaxed text-[11px]">{session.ActionItems}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                        <div className="bg-[#131517] p-2.5 rounded-lg border border-neutral-800/40">
                            <p className="text-neutral-500 font-medium">Scheduled Target</p>
                            <p className="text-neutral-200 font-semibold mt-0.5">{format(sessionDate, "MMM dd, yyyy")}</p>
                            <p className="text-neutral-400 text-[10px] mt-0.2">{format(sessionDate, "hh:mm a")} UTC</p>
                        </div>
                        <div className="bg-[#131517] p-2.5 rounded-lg border border-neutral-800/40">
                            <p className="text-neutral-500 font-medium">Request Window Init</p>
                            <p className="text-neutral-300 font-semibold mt-0.5">{format(createdDate, "MMM dd, yyyy")}</p>
                            <p className="text-neutral-400 text-[10px] mt-0.2">Slot ID: {session.SlotID}</p>
                        </div>
                    </div>

                    <div className="bg-neutral-900/50 p-2.5 rounded-lg border border-neutral-800/60 space-y-1.5 font-mono text-[10px] text-neutral-400">
                        <div className="flex justify-between items-center">
                            <span className="text-neutral-600 font-sans">STRIPE CHARGE:</span>
                            <span className="text-neutral-300 select-all truncate max-w-[180px]">{session.StripePaymentID}</span>
                        </div>
                        <div className="flex justify-between items-center border-t border-neutral-800/50 pt-1.5">
                            <span className="text-neutral-600 font-sans">ICS CALENDAR KEY:</span>
                            <span className="text-[#9aeb8e]/70 select-all truncate max-w-[180px]">{session.IcsToken}</span>
                        </div>
                    </div>

                    {/* Action Conditional Status Advice Footer Panel */}
                    {session.Status === "accepted" && (
                        <div className="bg-emerald-500/5 border border-emerald-500/10 p-2.5 rounded-lg flex items-center gap-2 text-emerald-400">
                            <CheckCircle2 size={14} />
                            <span>Payment validated. ICS synchronizer channel verified active.</span>
                        </div>
                    )}
                    {session.Status === "pending" && (
                        <div className="bg-amber-500/5 border border-amber-500/10 p-2.5 rounded-lg flex items-center gap-2 text-amber-400">
                            <ShieldAlert size={14} />
                            <span>Escrow hold active. Awaiting advisor confirmation cycle.</span>
                        </div>
                    )}

                </div>

                {/* Form Navigation Controls Footer */}
                <div className="flex items-center justify-end gap-2 pt-4 border-t border-neutral-800 mt-5">
                    <button
                        type="button" onClick={onClose}
                        className="px-4 py-1.5 text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700/40 rounded-lg transition-colors"
                    >
                        Close View
                    </button>
                    {session.Status !== "rejected" && (
                        <button
                            type="button"
                            onClick={() => { onCancel(session.ID); }}
                            className="px-4 py-1.5 bg-rose-500 hover:bg-rose-600 text-white font-medium rounded-lg transition-colors shadow-sm"
                        >
                            Withdraw Session
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
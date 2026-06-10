'use client'

import React, { useState } from "react"
import { Calendar, Clock, DollarSign, Wallet, Users, XCircle, CheckCircle2, FileText, HelpCircle, ArrowUpRight } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Session } from "@/types/types"
import { useUserStore } from "@/store/userStore"

interface CoachSessionProps {
    SessionData: Session[]
    setSessionData: (sessions: Session[]) => void
    handleSessionActionAsCoach: (sessionId: string, action: "accepted" | "rejected") => void
}

export default function CoachSession({ SessionData, setSessionData, handleSessionActionAsCoach }: CoachSessionProps) {
    const [activeTab, setActiveTab] = useState<"pending" | "accepted" | "rejected">("pending")
    const [selectedSession, setSelectedSession] = useState<Session | null>(null)
    const sessionsArray = Array.isArray(SessionData) ? SessionData : []
    const { user } = useUserStore()
    const lifetimeEarnings = sessionsArray
        .filter(s => s.Status === "accepted")
        .reduce((sum, s) => sum + (s.Coach?.SessionPrice || 0), 0)
    const completedCount = sessionsArray.filter(s => s.Status === "accepted").length || 0
    const pendingCount = sessionsArray.filter(s => s.Status === "pending").length || 0

    const filteredSessions = sessionsArray.filter(s => s.Status === activeTab) || []
    const handleUpdateStatus = (id: string, newStatus: "accepted" | "rejected") => {
        handleSessionActionAsCoach(id, newStatus)

        if (selectedSession?.ID === id) {
            setSelectedSession(null)
        }
    }

    if (user?.Role === "user") {
        return (
            <div>
                <h1 className="text-2xl font-bold text-white">
                    Register as a coach to view this page
                </h1>
            </div>
        )
    }

    return (
        <div className="space-y-5">

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                <div className="bg-[#1c1e22] border border-neutral-800/60 rounded-xl p-4 flex items-center justify-between shadow-sm relative overflow-hidden">
                    <div className="space-y-1 z-10">
                        <p className="text-[10px] text-neutral-500 font-bold tracking-wider uppercase">Lifetime Earnings</p>
                        <p className="text-2xl font-bold text-[#9aeb8e]">${lifetimeEarnings.toLocaleString()}</p>
                    </div>
                    <div className="p-3 bg-[#9aeb8e]/5 border border-[#9aeb8e]/10 text-[#9aeb8e] rounded-xl z-10">
                        <Wallet size={22} />
                    </div>
                    <div className="absolute -bottom-6 -right-6 text-neutral-800/10 pointer-events-none transform scale-150">
                        <DollarSign size={80} />
                    </div>
                </div>

                <div className="bg-[#1c1e22] border border-neutral-800/60 rounded-xl p-4 flex items-center justify-between shadow-sm">
                    <div className="space-y-1">
                        <p className="text-[10px] text-neutral-500 font-bold tracking-wider uppercase">Completed Sprints</p>
                        <p className="text-2xl font-bold text-white">{completedCount} <span className="text-xs text-neutral-500 font-normal">sessions</span></p>
                    </div>
                    <div className="p-3 bg-neutral-800 text-neutral-400 rounded-xl">
                        <CheckCircle2 size={22} />
                    </div>
                </div>

                <div className="bg-[#1c1e22] border border-neutral-800/60 rounded-xl p-4 flex items-center justify-between shadow-sm">
                    <div className="space-y-1">
                        <p className="text-[10px] text-neutral-500 font-bold tracking-wider uppercase">Awaiting Action</p>
                        <p className="text-2xl font-bold text-amber-400">{pendingCount} <span className="text-xs text-neutral-500 font-normal">requests</span></p>
                    </div>
                    <div className="p-3 bg-amber-500/5 border border-amber-500/10 text-amber-400 rounded-xl">
                        <Users size={22} />
                    </div>
                </div>
            </div>

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
                            <span>{tab} Backlog</span>
                            <span className={cn(
                                "text-[10px] font-bold px-1.5 py-0.2 rounded-full",
                                activeTab === tab ? "bg-[#9aeb8e]/10 text-[#9aeb8e]" : "bg-neutral-800 text-neutral-500"
                            )}>
                                {count}
                            </span>
                        </button>
                    )
                })}
            </div>

            {filteredSessions.length === 0 && (
                <div className="bg-[#1c1e22] border border-neutral-800/40 rounded-xl p-12 text-center max-w-xl mx-auto space-y-2 shadow-sm">
                    <HelpCircle className="mx-auto text-neutral-600" size={32} />
                    <p className="text-sm font-medium text-white">No {activeTab} records found</p>
                    <p className="text-xs text-neutral-500">Active incoming system requests from user pipelines will materialize here.</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSessions.map((session) => {
                    const sessionDate = new Date(session.ScheduledAt)

                    return (
                        <div
                            key={session.ID}
                            className="bg-[#1c1e22] border border-neutral-800/60 rounded-xl p-5 hover:border-neutral-700/80 transition-all flex flex-col justify-between space-y-4 shadow-sm group"
                        >
                            <div onClick={() => setSelectedSession(session)} className="cursor-pointer space-y-3">

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <img
                                            src={session.User?.AvatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"}
                                            alt={session.User?.Name}
                                            className="w-9 h-9 rounded-full object-cover border border-neutral-700 bg-neutral-800"
                                        />
                                        <div>
                                            <h3 className="font-semibold text-white group-hover:text-[#9aeb8e] transition-colors">{session.User?.Name}</h3>
                                            <p className="text-[10px] text-neutral-500">{session.User?.Email}</p>
                                        </div>
                                    </div>
                                    {session?.Coach?.SessionPrice && (
                                        <span className="text-[11px] font-bold text-[#9aeb8e] bg-[#9aeb8e]/5 border border-[#9aeb8e]/10 px-2 py-0.5 rounded">
                                            +${session.Coach.SessionPrice}
                                        </span>
                                    )}
                                </div>

                                <div className="bg-[#131517] p-2.5 rounded-lg border border-neutral-800/50 space-y-1.5 text-xs">
                                    <div className="flex items-center gap-2 text-neutral-300">
                                        <Calendar size={13} className="text-[#9aeb8e]" />
                                        <span>{format(sessionDate, "EEEE, MMM dd, yyyy")}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-neutral-400">
                                        <Clock size={13} className="text-neutral-500" />
                                        <span>{format(sessionDate, "hh:mm a")} (UTC Time)</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-1">
                                <button
                                    onClick={() => setSelectedSession(session)}
                                    className="text-[11px] font-medium text-neutral-400 hover:text-white flex items-center gap-1 bg-neutral-800 px-2.5 py-1.5 rounded-lg border border-neutral-700/40 mr-auto transition-all"
                                >
                                    <FileText size={12} />
                                    <span>Review Context</span>
                                </button>

                                {session.Status === "pending" && (
                                    <>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleUpdateStatus(session.ID, "rejected"); }}
                                            className="text-[11px] font-medium bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white px-2.5 py-1.5 rounded-lg transition-all border border-rose-500/20 active:scale-95 flex items-center gap-1"
                                        >
                                            <XCircle size={12} />
                                            <span>Decline</span>
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleUpdateStatus(session.ID, "accepted"); }}
                                            className="text-[11px] font-medium bg-[#9aeb8e] hover:bg-[#85cc7a] text-neutral-950 px-3 py-1.5 rounded-lg transition-all active:scale-95 flex items-center gap-1 shadow-sm"
                                        >
                                            <CheckCircle2 size={12} />
                                            <span>Approve Slot</span>
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            <CoachDetailsDialog
                session={selectedSession}
                onClose={() => setSelectedSession(null)}
                onAction={handleUpdateStatus}
            />

        </div>
    )
}


function CoachDetailsDialog({
    session,
    onClose,
    onAction
}: {
    session: Session | null
    onClose: () => void
    onAction: (id: string, status: "accepted" | "rejected") => void
}) {
    if (!session) return null

    const sessionDate = new Date(session.ScheduledAt)
    const createdDate = new Date(session.CreatedAt)

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 text-xs">
            <div className="bg-[#1c1e22] border border-neutral-800 rounded-xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-150">

                <div className="flex items-center justify-between border-b border-neutral-800 pb-3.5 mb-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-base font-semibold text-white">Client Intake Request</h2>
                            <span className={cn(
                                "text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border",
                                session.Status === "completed" && "bg-emerald-500/5 text-emerald-400 border-emerald-500/10",
                                session.Status === "pending" && "bg-amber-500/5 text-amber-400 border-amber-500/10",
                                session.Status === "rejected" && "bg-rose-500/5 text-rose-400 border-rose-500/10"
                            )}>
                                {session.Status}
                            </span>
                        </div>
                        <p className="text-neutral-500 mt-0.5 font-mono">Reference token code: {session.ID}</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors">
                        <XCircle size={16} />
                    </button>
                </div>

                <div className="space-y-4">

                    <div className="flex items-center gap-3 bg-[#131517] p-3 rounded-lg border border-neutral-800/60">
                        <img
                            src={session.User?.AvatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"}
                            alt={session.User?.Name}
                            className="w-11 h-11 rounded-full object-cover border border-neutral-700 bg-neutral-800"
                        />
                        <div className="space-y-0.5">
                            <span className="text-[10px] text-neutral-500 uppercase tracking-wide block font-medium">Applicant Details</span>
                            <p className="font-semibold text-white text-sm leading-none">{session.User?.Name}</p>
                            <p className="text-neutral-400 text-[11px]">{session.User?.Email}</p>
                        </div>
                        {session.Coach?.SessionPrice && (
                            <div className="ml-auto text-right">
                                <span className="text-[9px] text-neutral-500 block">ESCROW CAP</span>
                                <span className="text-sm font-bold text-[#9aeb8e]">${session.Coach.SessionPrice}</span>
                            </div>
                        )}
                    </div>

                    <div className="space-y-1 bg-[#131517] p-3 rounded-lg border border-neutral-800/40">
                        <span className="text-neutral-500 font-medium tracking-wide flex items-center gap-1">
                            <FileText size={12} /> CLIENT SUBMITTED TARGET CONTEXT
                        </span>
                        <p className="text-neutral-200 leading-relaxed text-[11px]">{session.ActionItems}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                        <div className="bg-[#131517] p-2.5 rounded-lg border border-neutral-800/40">
                            <p className="text-neutral-500 font-medium">Requested Timeline</p>
                            <p className="text-neutral-200 font-semibold mt-0.5">{format(sessionDate, "MMM dd, yyyy")}</p>
                            <p className="text-neutral-400 text-[10px] mt-0.2">{format(sessionDate, "hh:mm a")} UTC</p>
                        </div>
                        <div className="bg-[#131517] p-2.5 rounded-lg border border-neutral-800/40">
                            <p className="text-neutral-500 font-medium">Order Execution Window</p>
                            <p className="text-neutral-300 font-semibold mt-0.5">{format(createdDate, "MMM dd, yyyy")}</p>
                            <p className="text-neutral-400 text-[10px] mt-0.2">Slot ID: {session.SlotID}</p>
                        </div>
                    </div>

                    <div className="bg-neutral-900/50 p-2.5 rounded-lg border border-neutral-800/60 space-y-1.5 font-mono text-[10px] text-neutral-400">
                        <div className="flex justify-between items-center">
                            <span className="text-neutral-600 font-sans">ESCROW WIRE BALANCE ID:</span>
                            <span className="text-neutral-300 select-all truncate max-w-[170px]">{session.StripePaymentID}</span>
                        </div>
                        <div className="flex justify-between items-center border-t border-neutral-800/50 pt-1.5">
                            <span className="text-neutral-600 font-sans">CALENDAR API EVENT KEY:</span>
                            <span className="text-[#9aeb8e]/70 select-all truncate max-w-[170px]">{session.IcsToken}</span>
                        </div>
                    </div>

                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-neutral-800 mt-5">
                    <button
                        type="button" onClick={onClose}
                        className="px-4 py-1.5 text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700/40 rounded-lg transition-colors"
                    >
                        Dismiss
                    </button>

                    {session.Status === "pending" && (
                        <>
                            <button
                                type="button"
                                onClick={() => onAction(session.ID, "rejected")}
                                className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white font-medium rounded-lg transition-colors border border-rose-500/20"
                            >
                                Decline Appointment
                            </button>
                            <button
                                type="button"
                                onClick={() => onAction(session.ID, "accepted")}
                                className="px-4 py-1.5 bg-[#9aeb8e] hover:bg-[#85cc7a] text-neutral-950 font-semibold rounded-lg transition-colors shadow-sm flex items-center gap-1"
                            >
                                <ArrowUpRight size={13} />
                                <span>Accept & Book</span>
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
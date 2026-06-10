'use client'

import React, { useMemo } from 'react'
import { Calendar, TrendingUp, AlertTriangle, ArrowUpRight, ArrowDownRight, Target, ShoppingBag, Layers, X, FileText, CheckCircle, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from "@/lib/utils"
import { useDigestStore } from '@/store/digestStore'
import { Digests } from '@/types/types'
import { useApi } from '@/lib/api'

interface GoalReport {
    goal_name: string
    target_amount: number
    saved_amount: number
    status: string
    feedback: string
}

export default function DigestsPage() {
    const { digests, selectedDigest, setSelectedDigest, generateNewDigest, getDigests, generatingDigest } = useDigestStore()
    const api = useApi()

    React.useEffect(() => {
        getDigests(api)
        return ()=>{
            setSelectedDigest(null)
            
        }
    }, [api])

    return (
        <div className="w-full space-y-4 text-slate-200">
            <div className="bg-neutral-800 border mt-2 border-neutral-800/40 rounded-xl flex flex-col sm:flex-row justify-between p-4 sm:items-center shadow-md gap-3">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight text-white">Weekly Reviews</h1>
                    <p className="text-xs text-neutral-400 mt-0.5">Automated insights gathering financial vectors, risk factors, and momentum analytics.</p>
                </div>
                <button
                    onClick={() => generateNewDigest(api)}
                    disabled={generatingDigest}
                    className={cn(
                        "flex items-center justify-center gap-2 text-xs border border-neutral-800 px-3 py-2 rounded-lg transition-all",
                        generatingDigest 
                            ? "bg-neutral-900 text-neutral-600 cursor-not-allowed" 
                            : "bg-[#131517] text-neutral-400 hover:text-white hover:border-neutral-700 cursor-pointer"
                    )}
                >
                    {generatingDigest ? (
                        <>
                            <Loader2 size={14} className="text-[#9aeb8e] animate-spin" />
                            <span>Optimizing Sequence...</span>
                        </>
                    ) : (
                        <>
                            <Layers size={14} className="text-[#9aeb8e]" />
                            <span>Generate Weekly Report</span>
                        </>
                    )}
                </button>
            </div>

            {/* List block */}
            <div className="space-y-3">
                {digests.map((digest) => {
                    const start = new Date(digest.WeekStart)
                    const end = new Date(digest.WeekEnd)

                    return (
                        <div
                            key={digest.ID}
                            onClick={() => setSelectedDigest(digest)}
                            className="bg-neutral-800 border border-neutral-800/60 rounded-xl p-5 hover:border-neutral-700/80 transition-all cursor-pointer group shadow-sm flex flex-col md:flex-row md:items-center gap-5 relative overflow-hidden"
                        >
                            <div className="flex flex-row md:flex-col items-center md:items-start gap-2 md:gap-1 min-w-[150px] border-b md:border-b-0 md:border-r border-neutral-800/60 pb-3 md:pb-0 md:pr-4">
                                <Calendar size={14} className="text-neutral-500" />
                                <div className="text-xs font-semibold text-white">
                                    {format(start, "MMM dd")} — {format(end, "MMM dd, yyyy")}
                                </div>
                                <span className={cn(
                                    "text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ml-auto md:ml-0 md:mt-1",
                                    digest.Status === "completed" ? "bg-[#9aeb8e]/10 text-[#9aeb8e]" : "bg-amber-500/10 text-amber-400"
                                )}>
                                    {digest.Status}
                                </span>
                            </div>

                            <div className="flex-1 space-y-1.5">
                                <p className="text-xs text-neutral-300 leading-relaxed line-clamp-2">
                                    {digest.Summary}
                                </p>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-neutral-500">
                                    <span>Top Volume: <strong className="text-neutral-400 font-medium">{digest.TopCategory || 'None'}</strong></span>
                                    {Number(digest.ImpulseCount) > 0 && (
                                        <span className="text-rose-400/80 font-medium">⚠️ {digest.ImpulseCount} Impulse Spends</span>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:flex md:flex-col gap-2 md:gap-1 text-right min-w-[120px] pt-3 md:pt-0 border-t md:border-t-0 md:border-l border-neutral-800/60 md:pl-5">
                                <div>
                                    <span className="text-[9px] text-neutral-500 uppercase block tracking-wider">Inflow</span>
                                    <span className="text-xs font-bold text-[#9aeb8e] flex items-center justify-end gap-0.5">
                                        <ArrowUpRight size={12} />+${Number(digest.TotalIncome || 0).toFixed(2)}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[9px] text-neutral-500 uppercase block tracking-wider">Outflow</span>
                                    <span className="text-xs font-bold text-white flex items-center justify-end gap-0.5">
                                        <ArrowDownRight size={12} />-${Number(digest.TotalSpent || 0).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            <DigestDetailsDialog digest={selectedDigest} onClose={() => setSelectedDigest(null)} />
        </div>
    )
}

function DigestDetailsDialog({ digest, onClose }: { digest: Digests | null; onClose: () => void }) {
    if (!digest) return null

    const start = new Date(digest.WeekStart)
    const end = new Date(digest.WeekEnd)

    // Safely transform your PostgreSQL JSONB text string back into structural arrays
    const parsedGoals = useMemo<GoalReport[]>(() => {
        if (!digest.GoalStatus) return []
        try {
            return typeof digest.GoalStatus === 'string' 
                ? JSON.parse(digest.GoalStatus) 
                : digest.GoalStatus
        } catch (e) {
            console.error("Failed to compile structural goal tracker properties:", e)
            return []
        }
    }, [digest.GoalStatus])

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 text-xs">
            <div className="bg-neutral-800 border border-neutral-700/50 rounded-xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-neutral-800 pb-3.5 mb-4">
                    <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                            <h2 className="text-base font-semibold text-white">Weekly Review Digest</h2>
                            <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#9aeb8e]/10 text-[#9aeb8e]">
                                {digest.Status}
                            </span>
                        </div>
                        <p className="text-neutral-400 font-medium text-[11px] flex items-center gap-1">
                            <Calendar size={12} className="text-neutral-500" />
                            Timeline: {format(start, "MMMM dd")} — {format(end, "MMMM dd, yyyy")}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-700/50 transition-colors">
                        <X size={16} />
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Narrative Summary Column */}
                    <div className="space-y-1 bg-[#131517] p-3 rounded-lg border border-neutral-800/60">
                        <span className="text-neutral-500 font-medium tracking-wide flex items-center gap-1 uppercase text-[10px]">
                            <FileText size={12} className="text-[#9aeb8e]" /> INSIGHT SUMMARY
                        </span>
                        <p className="text-neutral-200 leading-relaxed text-[11px] font-normal whitespace-pre-line">
                            {digest.Summary}
                        </p>
                    </div>

                    {/* Numeric Information Blocks */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-[#131517] p-2.5 rounded-lg border border-neutral-800/40">
                            <p className="text-neutral-500 font-medium text-[10px] uppercase">Total Inflow</p>
                            <p className="text-sm font-bold text-[#9aeb8e] mt-1">+${Number(digest.TotalIncome || 0).toFixed(2)}</p>
                        </div>
                        <div className="bg-[#131517] p-2.5 rounded-lg border border-neutral-800/40">
                            <p className="text-neutral-500 font-medium text-[10px] uppercase">Total Outflow</p>
                            <p className="text-sm font-bold text-white mt-1">-${Number(digest.TotalSpent || 0).toFixed(2)}</p>
                        </div>
                        <div className="bg-[#131517] p-2.5 rounded-lg border border-neutral-800/40">
                            <p className="text-neutral-500 font-medium text-[10px] uppercase">Impulse Spends</p>
                            <p className={cn(
                                "text-sm font-bold mt-1",
                                Number(digest.ImpulseCount) > 2 ? "text-rose-400" : "text-neutral-300"
                            )}>{digest.ImpulseCount} Items</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-[#131517] p-3 rounded-lg border border-neutral-800/40 space-y-1">
                            <span className="text-neutral-500 font-medium text-[10px] uppercase block tracking-wider">Top Outflow Category</span>
                            <p className="font-semibold text-white text-[11px] flex items-center gap-1.5">
                                <ShoppingBag size={13} className="text-neutral-500" /> {digest.TopCategory || 'None'}
                            </p>
                        </div>
                        <div className="bg-[#131517] p-3 rounded-lg border border-neutral-800/40 space-y-1">
                            <span className="text-neutral-500 font-medium text-[10px] uppercase block tracking-wider">Risk Assessment Flags</span>
                            <p className={cn(
                                "font-semibold text-[11px] flex items-center gap-1.5",
                                Number(digest.RiskFlags) > 0 ? "text-rose-400" : "text-neutral-400"
                            )}>
                                <AlertTriangle size={13} /> {digest.RiskFlags} Flagged Items
                            </p>
                        </div>
                    </div>

                    {/* Goals Integration List Layout */}
                    <div className="bg-[#131517] p-3 rounded-lg border border-neutral-800/40 space-y-2">
                        <span className="text-neutral-500 font-medium text-[10px] uppercase block tracking-wider flex items-center gap-1">
                            <Target size={13} className="text-[#9aeb8e]" /> Active Milestones Tracking
                        </span>
                        {parsedGoals.length === 0 ? (
                            <p className="text-[11px] text-neutral-500 italic">No savings target data tied to this period iteration.</p>
                        ) : (
                            <div className="space-y-2.5 pt-1">
                                {parsedGoals.map((g, index) => (
                                    <div key={index} className="border-l-2 border-neutral-800 pl-2 space-y-0.5">
                                        <div className="flex justify-between text-[11px]">
                                            <span className="text-white font-medium">{g.goal_name}</span>
                                            <span className={cn(
                                                "font-bold text-[10px] px-1 rounded",
                                                g.status === "On Track" || g.status === "Completed" ? "text-[#9aeb8e] bg-[#9aeb8e]/5" : "text-amber-400 bg-amber-400/5"
                                            )}>{g.status}</span>
                                        </div>
                                        <div className="text-[10px] text-neutral-400">
                                            Saved: <span className="text-neutral-200">${g.saved_amount}</span> / ${g.target_amount}
                                        </div>
                                        <p className="text-[10px] text-neutral-500 italic leading-snug">{g.feedback}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3.5 border-t border-neutral-800 mt-5">
                    <button
                        type="button" 
                        onClick={onClose}
                        className="px-4 py-1.5 font-medium bg-[#9aeb8e] text-neutral-950 hover:bg-[#85cc7a] rounded-lg transition-colors shadow-sm flex items-center gap-1 cursor-pointer"
                    >
                        <CheckCircle size={13} />
                        <span>Acknowledge Insights</span>
                    </button>
                </div>
            </div>
        </div>
    )
}
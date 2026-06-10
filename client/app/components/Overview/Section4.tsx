"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { useGoalsStore } from "@/store/goalsStore"
import { useUserStore } from "@/store/userStore"
import { Target, Award } from "lucide-react"

export default function Section4() {
    const router = useRouter()
    const { goals } = useGoalsStore()
    const { user } = useUserStore()
    const [activeItem, setActiveItem] = React.useState(-1)

    // Filter active goals, take top 3
    const activeGoals = (goals || [])
        .filter((g) => g.IsActive)
        .slice(0, 3)

    const formatCurrency = (amount: number) => {
        const isRupee = user?.Currency === "INR" || user?.Currency === "₹"
        return (isRupee ? "₹" : "$") + amount.toLocaleString(isRupee ? "en-IN" : "en-US", {
            maximumFractionDigits: 0
        })
    }

    return (
        <div
            style={{
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            }}
            className="bg-neutral-800 backdrop-blur-md border border-[#1C1C1F] p-5 rounded-2xl h-full w-full text-xs antialiased select-none flex flex-col justify-between"
        >
            <div>
                <h2 className="font-medium text-white text-[15px] tracking-tight mb-3">
                    Active Goals
                </h2>

                <div className="flex flex-col gap-2">
                    {activeGoals.length === 0 ? (
                        <div className="text-[#71717A] text-sm py-4 italic text-center">
                            No active goals established
                        </div>
                    ) : (
                        activeGoals.map((goal, idx) => {
                            const percent = Math.min(
                                100,
                                Math.round((goal.SavedAmount / (goal.TargetAmount || 1)) * 100)
                            )

                            return (
                                <div
                                    key={goal.ID || idx}
                                    onClick={() => router.push("/goals")}
                                    className={`flex flex-col p-3 gap-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
                                        activeItem === idx
                                            ? 'bg-neutral-700 opacity-90 border border-[#3F3F46]/30 shadow-md'
                                            : 'border border-[#27272a]/30 bg-neutral-900/30'
                                    }`}
                                    onMouseEnter={() => setActiveItem(idx)}
                                    onMouseLeave={() => setActiveItem(-1)}
                                >
                                    <div className="flex flex-row items-center gap-3">
                                        <div className="bg-[#131316] p-2.5 rounded-lg flex items-center justify-center shrink-0">
                                            {percent >= 100 ? (
                                                <Award size={16} className="text-amber-400" />
                                            ) : (
                                                <Target size={16} className="text-emerald-400" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start gap-1">
                                                <h3 className="font-medium text-white text-sm tracking-tight truncate">
                                                    {goal.Name}
                                                </h3>
                                                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                                    {percent}%
                                                </span>
                                            </div>
                                            <p className="text-[#71717A] text-[11px] mt-0.5 font-medium leading-none">
                                                Saved {formatCurrency(goal.SavedAmount)} of {formatCurrency(goal.TargetAmount)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Progress track */}
                                    <div className="w-full bg-[#181a1f] h-1.5 rounded-full overflow-hidden border border-[#27272a]/50">
                                        <div 
                                            className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-300"
                                            style={{ width: `${percent}%` }}
                                        />
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
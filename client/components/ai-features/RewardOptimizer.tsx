"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Crown, Sparkles, AlertCircle, TrendingUp, HelpCircle, ArrowRight, RefreshCw, Layers } from "lucide-react"
import { useAiFeaturesStore } from "@/store/useAiFeaturesStore"
import { useUserStore } from "@/store/userStore"
import { useTransactionStore } from "@/store/transactionStore"
import { useGoalsStore } from "@/store/goalsStore"
import { useApi } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function RewardOptimizer() {
    const api = useApi()
    const router = useRouter()
    const { user } = useUserStore()
    const { transactions } = useTransactionStore()
    const { goals } = useGoalsStore()

    const { 
        optimizerData, 
        calculateOptimizedCards, 
        isLoading, 
        goEnvelopeStatus,
        currentError,
        lastCardOptimizerCallTimestamp 
    } = useAiFeaturesStore()
    const [prefQuery, setPrefQuery] = useState<string>("")
    const [timeLeft, setTimeLeft] = useState<string>("")

    React.useEffect(() => {
        const calculateTimeLeft = () => {
            if (!lastCardOptimizerCallTimestamp) return ""
            const oneDayInMs = 24 * 60 * 60 * 1000
            const diff = oneDayInMs - (Date.now() - lastCardOptimizerCallTimestamp)
            if (diff <= 0) return ""

            const hours = Math.floor(diff / (60 * 60 * 1000))
            const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000))
            const seconds = Math.ceil((diff % (60 * 1000)) / 1000)

            if (hours > 0) {
                return `${hours}h ${minutes}m`
            } else if (minutes > 0) {
                return `${minutes}m ${seconds}s`
            } else {
                return `${seconds}s`
            }
        }

        setTimeLeft(calculateTimeLeft())
        const interval = setInterval(() => {
            const left = calculateTimeLeft()
            setTimeLeft(left)
        }, 1000)

        return () => clearInterval(interval)
    }, [lastCardOptimizerCallTimestamp])

    const isRateLimited = !!timeLeft

    const handleRunOptimizer = async () => {
        const userProfile = { user, transactions, goals }
        await calculateOptimizedCards(prefQuery, userProfile, api)
    }

    if (isLoading) {
        return (
            <div className="bg-[#181a1f] border border-[#27272a]/80 rounded-xl p-6 h-full flex flex-col items-center justify-center min-h-[400px] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/5 blur-3xl pointer-events-none rounded-full" />
                <div className="w-12 h-12 rounded-full border-2 border-amber-500/20 border-t-amber-400 animate-spin mb-4" />
                <p className="text-sm font-semibold text-white">Simulating Portfolio Reward Optimizations...</p>
                <p className="text-xs text-[#a1a1aa] mt-1">Optimizer Node 02 cross-referencing card networks</p>
            </div>
        )
    }

    if (!optimizerData || !optimizerData.top_pick) {
        return (
            <div className="bg-[#181a1f] border border-[#27272a]/80 rounded-xl p-6 h-full flex flex-col items-center justify-center min-h-[400px] shadow-2xl relative text-center">
                <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/5 blur-2xl pointer-events-none rounded-full" />
                <div className="p-4 bg-[#20222a] rounded-full text-amber-400/80 mb-4">
                    <Crown className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-semibold text-white tracking-tight">Reward Optimizer Idle</h3>
                <p className="text-xs text-[#a1a1aa] max-w-[320px] mt-1 mb-5">
                    Generate the optimal credit card portfolio tailored to your real transactions baseline and custom preferences.
                </p>
                {currentError && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 max-w-[320px] text-[11px] text-red-400">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{currentError}</span>
                    </div>
                )}
                <div className="flex flex-col gap-2 w-full max-w-[320px]">
                    <input
                        type="text"
                        placeholder="Optional: Enter focus (e.g. 'lounge', 'forex')"
                        value={prefQuery}
                        onChange={(e) => setPrefQuery(e.target.value)}
                        className="bg-[#121417] border border-[#27272a] text-xs px-3 py-2 text-white placeholder-[#52525b] focus:border-amber-400/50 rounded-lg outline-none w-full"
                    />
                    <Button 
                        onClick={handleRunOptimizer}
                        disabled={isRateLimited || isLoading}
                        className="bg-amber-400 text-black hover:bg-amber-300 disabled:bg-[#27272a] disabled:text-[#71717a] font-semibold text-xs py-2 w-full rounded-lg transition-all duration-200 cursor-pointer disabled:cursor-not-allowed"
                    >
                        {isRateLimited ? `Locked (${timeLeft})` : "Calculate Top Card Picks"}
                    </Button>
                </div>
            </div>
        )
    }

    const { top_pick, runner_ups, missed_rewards, summary } = optimizerData

    return (
        <div className="bg-[#181a1f] border border-[#27272a]/80 rounded-xl p-6 shadow-2xl h-full flex flex-col transition-all duration-300">
            {/* Header */}
            <div className="flex justify-between items-center mb-5">
                <div>
                    <h3 className="text-md font-semibold text-white tracking-tight flex items-center gap-2">
                        <Crown className="w-5 h-5 text-amber-400" />
                        Reward Optimizer
                    </h3>
                    <p className="text-xs text-[#71717a]">{summary || "Card rewards portfolio analyzer."}</p>
                </div>
                <Badge variant="outline" className="text-amber-400 bg-amber-500/5 border-amber-500/20 text-[10px] uppercase tracking-wider font-bold">
                    Node 02 Active
                </Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-0 overflow-y-auto max-h-[500px] scrollbar-none">
                {/* Top Pick Presentation Card */}
                <div className="lg:col-span-7 flex flex-col justify-between border border-amber-500/20 rounded-xl p-5 bg-gradient-to-br from-[#1b1915] via-[#121417] to-[#121417] relative overflow-hidden group">
                    {/* Glowing Accent */}
                    <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 blur-3xl pointer-events-none rounded-full group-hover:bg-amber-500/10 transition-colors" />
                    
                    <div>
                        <div className="flex justify-between items-start mb-3">
                            <span className="text-[10px] uppercase tracking-widest font-extrabold text-amber-400 flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-amber-400" />
                                Top Pick Recommendation
                            </span>
                            <span className="text-[11px] text-[#71717a] font-mono">{top_pick.card_network}</span>
                        </div>

                        <div className="flex gap-4 items-start mb-4">
                            <div className="w-20 h-12 bg-gradient-to-br from-amber-600 to-amber-900 border border-amber-500/20 rounded-md shrink-0 flex items-center justify-center text-[10px] font-bold text-white shadow-lg overflow-hidden relative">
                                <div className="absolute top-1 left-2 w-4 h-4 bg-amber-300/10 rounded-full blur-sm" />
                                {top_pick.issuer.toUpperCase()}
                            </div>
                            <div>
                                <h4 className="text-md font-bold text-white leading-tight">{top_pick.name}</h4>
                                <p className="text-xs text-[#a1a1aa] mt-0.5">{top_pick.tier} Tier</p>
                            </div>
                        </div>

                        <p className="text-xs text-[#d4d4d8] leading-relaxed mb-4 pl-1 border-l border-[#27272a]">
                            {top_pick.why_for_you || top_pick.description}
                        </p>

                        {/* Calculated Metrics Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#121417]/80 border border-[#27272a] rounded-lg p-3 my-4">
                            <div>
                                <p className="text-[9px] text-[#71717a] uppercase font-semibold">Est. Monthly Reward</p>
                                <p className="text-xs font-bold text-[#bdf692] mt-0.5">₹{top_pick.estimated_monthly_reward.toLocaleString("en-IN")}</p>
                            </div>
                            <div className="border-l border-[#27272a] pl-2">
                                <p className="text-[9px] text-[#71717a] uppercase font-semibold">Annual Fee</p>
                                <p className="text-xs font-bold text-white mt-0.5">₹{top_pick.annual_fee.toLocaleString("en-IN")}</p>
                            </div>
                            <div className="border-l border-[#27272a] pl-2">
                                <p className="text-[9px] text-[#71717a] uppercase font-semibold">Net Annual Value</p>
                                <p className="text-xs font-bold text-amber-400 mt-0.5">₹{top_pick.net_annual_value.toLocaleString("en-IN")}</p>
                            </div>
                            <div className="border-l border-[#27272a] pl-2">
                                <p className="text-[9px] text-[#71717a] uppercase font-semibold">Milestone Bonus</p>
                                <p className="text-xs font-bold text-[#a1a1aa] mt-0.5">₹{top_pick.milestone_bonus_earned.toLocaleString("en-IN")}</p>
                            </div>
                        </div>
                    </div>

                    {/* Highlights */}
                    <div className="mt-2">
                        <p className="text-[10px] text-[#71717a] uppercase font-bold tracking-wider mb-1">Key Lounge & Insurance Perks</p>
                        <ul className="text-xs text-[#a1a1aa] space-y-1 pl-1">
                            {top_pick.key_perks.slice(0, 3).map((perk, i) => (
                                <li key={i} className="flex items-center gap-1.5">
                                    <span className="w-1 h-1 rounded-full bg-amber-400" />
                                    {perk}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Side Grid: Runner Ups and Missed Rewards */}
                <div className="lg:col-span-5 flex flex-col gap-4">
                    {/* Runner-Ups */}
                    <div>
                        <p className="text-[10px] text-[#71717a] uppercase font-bold tracking-wider mb-2">Runner-Up Cards</p>
                        <div className="space-y-2">
                            {runner_ups.slice(0, 2).map((card, idx) => (
                                <div key={idx} className="border border-[#27272a] rounded-lg p-3 bg-[#121417]/50 hover:bg-[#121417] flex justify-between items-center transition-all">
                                    <div className="flex gap-3 items-center">
                                        <div className="w-10 h-7 bg-gradient-to-br from-[#27272a] to-[#121417] border border-[#27272a] rounded shrink-0 flex items-center justify-center text-[7px] font-extrabold text-[#71717a]">
                                            {card.issuer.substring(0, 4).toUpperCase()}
                                        </div>
                                        <div>
                                            <h5 className="text-xs font-semibold text-white leading-tight">{card.name}</h5>
                                            <p className="text-[10px] text-[#71717a] mt-0.5">Est. Rewards: ₹{card.estimated_monthly_reward}/mo</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-amber-400">₹{card.net_annual_value.toLocaleString("en-IN")}</p>
                                        <p className="text-[9px] text-[#71717a]">Net Annual</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Missed Rewards Component */}
                    <div className="flex-1 flex flex-col">
                        <p className="text-[10px] text-[#71717a] uppercase font-bold tracking-wider mb-2">Realized Luxury Rewards Materialization</p>
                        <div className="border border-[#27272a] rounded-lg bg-[#121417]/50 flex-1 overflow-y-auto max-h-[170px] scrollbar-none p-3 space-y-2.5">
                            {missed_rewards && missed_rewards.length > 0 ? (
                                missed_rewards.map((reward, i) => (
                                    <div key={i} className="flex gap-2.5 items-start text-xs border-b border-[#27272a]/50 pb-2 last:border-0 last:pb-0">
                                        <div className="p-1.5 bg-amber-500/10 text-amber-400 rounded shrink-0 font-bold text-[9px] uppercase tracking-wider mt-0.5">
                                            +{Math.round(reward.reward_earned)} pts
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline gap-2">
                                                <span className="font-semibold text-white truncate">{reward.merchant}</span>
                                                <span className="text-[10px] text-[#71717a] shrink-0">₹{reward.amount}</span>
                                            </div>
                                            <p className="text-[10px] text-amber-300/90 leading-tight mt-0.5">
                                                {reward.what_you_missed}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-[11px] text-[#71717a] text-center py-4">No specific missed rewards mapped.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Recalculate options */}
            <div className="mt-4 pt-3 border-t border-[#27272a] flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                <div className="flex-1 flex flex-col gap-1">
                    <input
                        type="text"
                        placeholder="Refine parameters (e.g. 'boost travel', 'exclude SBI')"
                        value={prefQuery}
                        onChange={(e) => setPrefQuery(e.target.value)}
                        className="bg-[#121417] border border-[#27272a] text-xs px-3 py-1.5 text-white placeholder-[#52525b] focus:border-amber-400/50 rounded-lg outline-none w-full sm:max-w-xs"
                    />
                    {currentError && (
                        <p className="text-[10px] text-red-400 flex items-center gap-1 mt-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {currentError}
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        onClick={() => router.push("/ai-features/report")}
                        className="bg-amber-400 text-black hover:bg-amber-300 font-semibold text-xs py-1.5 px-4 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                        View Full Report
                        <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                        onClick={handleRunOptimizer}
                        disabled={isRateLimited || isLoading}
                        className="bg-transparent border border-[#27272a] hover:bg-[#1c1c1f] text-white disabled:text-[#52525b] disabled:border-[#27272a] disabled:hover:bg-transparent font-semibold text-xs py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer disabled:cursor-not-allowed"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        {isRateLimited ? `Locked (${timeLeft})` : "Re-Optimize"}
                    </Button>
                </div>
            </div>
        </div>
    )
}

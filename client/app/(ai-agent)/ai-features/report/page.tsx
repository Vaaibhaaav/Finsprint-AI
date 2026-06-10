"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
    ArrowLeft, 
    Crown, 
    Sparkles, 
    AlertCircle, 
    Check, 
    TrendingUp, 
    Wallet, 
    Compass, 
    Flame, 
    Milestone, 
    Gift,
    Shield, 
    ChevronRight,
    Plane,
    Percent,
    ExternalLink,
    HelpCircle
} from "lucide-react"
import { useAiFeaturesStore, CreditCardInfo } from "@/store/useAiFeaturesStore"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

// Clean up rupee encoding anomalies (e.g., â‚¹ -> ₹)
const cleanRupeeText = (text: string | undefined) => {
    if (!text) return ""
    return text.replace(/â‚¹/g, "₹").replace(/â\x82¹/g, "₹")
}

export default function CardOptimizerReportPage() {
    const router = useRouter()
    const { optimizerData, isLoading } = useAiFeaturesStore()
    const [activeTab, setActiveTab] = useState<"perks" | "rewards">("rewards")

    // Card background styling selector
    const getCardTheme = (tier: string) => {
        const t = tier.toLowerCase()
        if (t === "luxury") {
            return {
                bg: "bg-gradient-to-br from-[#1a1917] via-[#2d2516] to-[#0c0a07]",
                border: "border-amber-400/30",
                glow: "bg-amber-500/10",
                badge: "text-amber-400 bg-amber-500/10 border-amber-500/20",
                accent: "text-amber-400",
                chip: "from-amber-200 via-yellow-400 to-amber-600"
            }
        } else if (t === "premium") {
            return {
                bg: "bg-gradient-to-br from-[#0c1020] via-[#172554] to-[#050814]",
                border: "border-blue-500/30",
                glow: "bg-blue-500/10",
                badge: "text-blue-400 bg-blue-500/10 border-blue-500/20",
                accent: "text-blue-400",
                chip: "from-slate-200 via-slate-400 to-slate-600"
            }
        } else {
            return {
                bg: "bg-gradient-to-br from-[#0a1b15] via-[#064e3b] to-[#022c22]",
                border: "border-emerald-500/30",
                glow: "bg-emerald-500/10",
                badge: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
                accent: "text-emerald-400",
                chip: "from-emerald-200 via-teal-400 to-emerald-600"
            }
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0c0e12] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/5 blur-3xl pointer-events-none rounded-full" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#bdf692]/5 blur-3xl pointer-events-none rounded-full" />
                <div className="w-16 h-16 rounded-full border-4 border-amber-500/20 border-t-amber-400 animate-spin mb-6" />
                <h2 className="text-xl font-bold tracking-tight">Re-computing Optimization Matrix...</h2>
                <p className="text-sm text-[#71717a] mt-2">Running transaction graphs through node heuristics</p>
            </div>
        )
    }

    if (!optimizerData || !optimizerData.top_pick) {
        return (
            <div className="min-h-screen bg-[#0c0e12] text-white flex flex-col items-center justify-center p-6 text-center relative">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.03),transparent_70%)] pointer-events-none" />
                <div className="p-5 bg-[#181a1f] border border-[#27272a] rounded-full text-amber-400 mb-5 shadow-xl">
                    <Crown className="w-12 h-12" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight">No Optimization Report Active</h2>
                <p className="text-sm text-[#a1a1aa] max-w-md mt-2 mb-8">
                    Run the Reward Optimizer from the FinSprint AI Hub dashboard first to compile your personalized, transaction-driven credit card portfolio.
                </p>
                <Button 
                    onClick={() => router.push("/ai-features")}
                    className="bg-amber-400 text-black hover:bg-amber-300 font-semibold px-6 py-2.5 rounded-lg flex items-center gap-2 cursor-pointer transition-all duration-200"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Return to AI Hub
                </Button>
            </div>
        )
    }

    const { top_pick, runner_ups, summary } = optimizerData
    const topTheme = getCardTheme(top_pick.tier)

    // Format welcome benefits
    const getWelcomeBenefitsText = (card: CreditCardInfo) => {
        if (!card.welcome_benefits) return "No joining benefits specified."
        if (typeof card.welcome_benefits === "string") return cleanRupeeText(card.welcome_benefits)
        return cleanRupeeText(card.welcome_benefits.description || "")
    }

    return (
        <div className="min-h-screen bg-[#0c0e12] text-white pb-24 relative overflow-hidden">
            {/* Top decorative gradient overlays */}
            <div className="absolute top-[-200px] left-[10%] w-[600px] h-[600px] bg-amber-500/5 blur-3xl pointer-events-none rounded-full" />
            <div className="absolute top-[-200px] right-[10%] w-[600px] h-[600px] bg-blue-500/5 blur-3xl pointer-events-none rounded-full" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8 relative">
                {/* Header Navbar */}
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-[#27272a]/60 pb-6">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => router.push("/ai-features")}
                            className="p-2.5 bg-[#181a1f] border border-[#27272a] hover:border-amber-400/50 hover:bg-[#20222a] rounded-xl text-[#a1a1aa] hover:text-white transition-all cursor-pointer shadow-lg"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                        <div>
                            <span className="text-[10px] uppercase tracking-widest font-extrabold text-amber-400">Card Portfolio Matrix</span>
                            <h1 className="text-2xl font-bold tracking-tight text-white mt-0.5">Optimization Report</h1>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2.5 bg-[#181a1f]/80 backdrop-blur-md border border-amber-500/10 rounded-xl px-4 py-2 text-xs">
                        <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                        <span className="text-[#a1a1aa]">Ranked by Net Value Index</span>
                    </div>
                </div>

                {/* Hero Savings / Leakage Insights Banner */}
                {summary && (
                    <div className="relative overflow-hidden bg-gradient-to-r from-[#1c1917]/90 via-[#272520]/80 to-[#121417]/90 border border-amber-500/20 rounded-2xl p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 group">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(245,158,11,0.06),transparent_50%)] pointer-events-none" />
                        <div className="flex items-start md:items-center gap-4 relative">
                            <div className="p-3 bg-amber-500/15 text-amber-400 rounded-xl shrink-0 shadow-lg">
                                <Sparkles className="w-6 h-6 animate-pulse" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold uppercase tracking-wider text-amber-400">Pipeline Reward Opportunity</h3>
                                <p className="text-md font-bold text-white mt-1 leading-relaxed max-w-3xl">
                                    {cleanRupeeText(summary)}
                                </p>
                            </div>
                        </div>
                        <div className="shrink-0 flex items-center gap-2 relative">
                            <div className="px-4 py-2 bg-amber-500/10 border border-amber-500/20 text-amber-300 font-bold rounded-xl text-xs">
                                Optimize Active
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Content Grid: Top Pick vs Details */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left Column: Top Pick interactive visual */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className={`p-6 rounded-2xl border ${topTheme.border} ${topTheme.bg} relative overflow-hidden shadow-2xl flex flex-col justify-between aspect-[1.586/1] w-full min-h-[300px] transition-transform duration-500 hover:scale-[1.01] hover:rotate-[0.5deg] group`}>
                            {/* Inner ambient card glow */}
                            <div className={`absolute top-0 right-0 w-64 h-64 ${topTheme.glow} blur-3xl pointer-events-none rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-300`} />
                            
                            {/* Card Top Row */}
                            <div className="flex justify-between items-start z-10">
                                <div>
                                    <p className="text-xs tracking-wider text-[#a1a1aa] font-medium uppercase">{top_pick.issuer}</p>
                                    <h2 className="text-lg font-bold text-white tracking-tight leading-tight mt-0.5">{top_pick.name}</h2>
                                </div>
                                <Badge variant="outline" className={`${topTheme.badge} text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5`}>
                                    {top_pick.tier}
                                </Badge>
                            </div>

                            {/* Card Middle Row (Chip & Network) */}
                            <div className="flex justify-between items-center z-10 my-4">
                                {/* Chip */}
                                <div className={`w-12 h-9 rounded-md bg-gradient-to-br ${topTheme.chip} p-1.5 flex flex-col justify-between border border-yellow-200/30 shadow-inner relative overflow-hidden`}>
                                    <div className="absolute top-0 bottom-0 left-3 w-[1px] bg-black/20" />
                                    <div className="absolute top-0 bottom-0 left-6 w-[1px] bg-black/20" />
                                    <div className="absolute top-0 bottom-0 left-9 w-[1px] bg-black/20" />
                                    <div className="absolute left-0 right-0 top-3 h-[1px] bg-black/20" />
                                    <div className="absolute left-0 right-0 top-6 h-[1px] bg-black/20" />
                                    <div className="w-full h-full border border-black/10 rounded-sm" />
                                </div>
                                
                                <span className="font-mono text-sm tracking-wider text-[#a1a1aa]/80 uppercase">{top_pick.card_network}</span>
                            </div>

                            {/* Card Bottom Row */}
                            <div className="flex justify-between items-end z-10">
                                <div>
                                    <p className="text-[9px] text-[#71717a] font-mono tracking-widest uppercase">Cardholder</p>
                                    <p className="text-xs font-mono tracking-widest font-bold text-[#e4e4e7] uppercase mt-0.5">FINSPRINT MEMBER</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] text-[#71717a] font-mono tracking-widest uppercase">Value Rank</p>
                                    <p className="text-xs font-mono font-bold text-white mt-0.5">#01 TOP PICK</p>
                                </div>
                            </div>
                        </div>

                        {/* Top Pick Narrative Explanation */}
                        {top_pick.why_for_you && (
                            <div className="bg-[#181a1f] border border-[#27272a] rounded-2xl p-6 shadow-xl space-y-4">
                                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                    <Crown className="w-4 h-4 text-amber-400" />
                                    Why This Card Fits You Perfectly
                                </h3>
                                <p className="text-xs text-[#a1a1aa] leading-relaxed border-l-2 border-amber-400/50 pl-4 py-1 italic">
                                    "{cleanRupeeText(top_pick.why_for_you)}"
                                </p>
                            </div>
                        )}

                        {/* Key Metrics Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-[#181a1f] border border-[#27272a] rounded-xl p-4 shadow-md">
                                <span className="text-[10px] text-[#71717a] uppercase font-bold tracking-wider">Net Annual Value</span>
                                <p className="text-lg font-bold text-amber-400 mt-1">₹{top_pick.net_annual_value.toLocaleString("en-IN")}</p>
                                <p className="text-[9px] text-[#52525b] mt-0.5">Value after subtracting fee</p>
                            </div>
                            <div className="bg-[#181a1f] border border-[#27272a] rounded-xl p-4 shadow-md">
                                <span className="text-[10px] text-[#71717a] uppercase font-bold tracking-wider">Est. Monthly Reward</span>
                                <p className="text-lg font-bold text-emerald-400 mt-1">₹{top_pick.estimated_monthly_reward.toLocaleString("en-IN")}</p>
                                <p className="text-[9px] text-[#52525b] mt-0.5">Projected rewards/month</p>
                            </div>
                            <div className="bg-[#181a1f] border border-[#27272a] rounded-xl p-4 shadow-md">
                                <span className="text-[10px] text-[#71717a] uppercase font-bold tracking-wider">Annual Fee</span>
                                <p className="text-lg font-bold text-white mt-1">
                                    {top_pick.annual_fee === 0 ? "LIFETIME FREE" : `₹${top_pick.annual_fee.toLocaleString("en-IN")}`}
                                </p>
                                <p className="text-[9px] text-[#52525b] mt-0.5">Billed once a year</p>
                            </div>
                            <div className="bg-[#181a1f] border border-[#27272a] rounded-xl p-4 shadow-md">
                                <span className="text-[10px] text-[#71717a] uppercase font-bold tracking-wider">Milestone Benefit</span>
                                <p className="text-lg font-bold text-[#a1a1aa] mt-1">
                                    {top_pick.milestone_bonus_earned > 0 ? `₹${top_pick.milestone_bonus_earned.toLocaleString("en-IN")}` : "₹0"}
                                </p>
                                <p className="text-[9px] text-[#52525b] mt-0.5">Achievable spend bonus</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Rewards & Perks breakdown */}
                    <div className="lg:col-span-7 space-y-6">
                        {/* Welcome Benefit Card */}
                        <div className="bg-gradient-to-br from-[#181a1f] to-[#121417] border border-[#27272a] rounded-2xl p-6 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 blur-xl pointer-events-none rounded-full" />
                            <div className="flex gap-4 items-start">
                                <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl mt-1 shadow-md">
                                    <Gift className="w-5 h-5" />
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] text-amber-400 uppercase font-bold tracking-widest">Sign-up Welcome Benefit</span>
                                    <h4 className="text-md font-bold text-white">{top_pick.reward_type === 'reward_points' ? 'Reward Points' : top_pick.reward_type} Incentive</h4>
                                    <p className="text-xs text-[#a1a1aa] leading-relaxed mt-1">
                                        {getWelcomeBenefitsText(top_pick)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Interactive Tabbed UI for Perks vs Reward Breakdowns */}
                        <div className="bg-[#181a1f] border border-[#27272a] rounded-2xl shadow-xl overflow-hidden">
                            {/* Tab Headers */}
                            <div className="flex border-b border-[#27272a]/60 bg-[#121417]/80">
                                <button
                                    onClick={() => setActiveTab("rewards")}
                                    className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
                                        activeTab === "rewards" 
                                            ? "border-amber-400 text-white bg-amber-500/5" 
                                            : "border-transparent text-[#71717a] hover:text-white"
                                    }`}
                                >
                                    <Percent className="w-4 h-4" />
                                    Optimized Categories
                                </button>
                                <button
                                    onClick={() => setActiveTab("perks")}
                                    className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
                                        activeTab === "perks" 
                                            ? "border-amber-400 text-white bg-amber-500/5" 
                                            : "border-transparent text-[#71717a] hover:text-white"
                                    }`}
                                >
                                    <Shield className="w-4 h-4" />
                                    Premium Perks & Lounge
                                </button>
                            </div>

                            {/* Tab Content */}
                            <div className="p-6">
                                {activeTab === "rewards" ? (
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center">
                                            <h4 className="text-sm font-bold text-white">Monthly Reward Yield per Category</h4>
                                            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-bold">
                                                Active Rate Index
                                            </Badge>
                                        </div>

                                        <div className="space-y-4">
                                            {top_pick.category_rewards && top_pick.category_rewards.length > 0 ? (
                                                top_pick.category_rewards.map((reward, i) => {
                                                    // Calculate visual spend share
                                                    const maxSpend = Math.max(...top_pick.category_rewards.map(r => r.monthly_spend), 1)
                                                    const barWidth = Math.min((reward.monthly_spend / maxSpend) * 100, 100)

                                                    return (
                                                        <div key={i} className="bg-[#121417] border border-[#27272a]/80 rounded-xl p-4 space-y-3">
                                                            <div className="flex justify-between items-start">
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                                                                        <span className="text-xs font-bold text-white capitalize">{reward.category}</span>
                                                                    </div>
                                                                    <p className="text-[10px] text-[#71717a] mt-0.5">Applied rate: {reward.rate}% ({reward.card_category})</p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-xs font-bold text-emerald-400">+₹{reward.monthly_reward.toLocaleString("en-IN")}</p>
                                                                    <p className="text-[9px] text-[#71717a] mt-0.5">Earned/mo</p>
                                                                </div>
                                                            </div>
                                                            
                                                            {/* Spend Visual Bar */}
                                                            <div className="space-y-1.5">
                                                                <div className="flex justify-between text-[9px] text-[#71717a]">
                                                                    <span>Spend baseline</span>
                                                                    <span className="font-semibold text-white">₹{reward.monthly_spend.toLocaleString("en-IN")}</span>
                                                                </div>
                                                                <div className="w-full bg-[#181a1f] h-1.5 rounded-full overflow-hidden border border-[#27272a]">
                                                                    <div 
                                                                        className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full transition-all duration-500"
                                                                        style={{ width: `${barWidth}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                })
                                            ) : (
                                                <p className="text-xs text-[#71717a] py-6 text-center">No categories mapped for rewards.</p>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <h4 className="text-sm font-bold text-white">Privileged Perks & Travel Insurance</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {top_pick.key_perks && top_pick.key_perks.length > 0 ? (
                                                top_pick.key_perks.map((perk, i) => (
                                                    <div 
                                                        key={i} 
                                                        className="flex items-start gap-2.5 p-3 bg-[#121417] border border-[#27272a]/80 rounded-xl hover:border-amber-400/20 transition-all duration-200 group"
                                                    >
                                                        <div className="p-1 bg-amber-500/10 text-amber-400 rounded-md shrink-0 mt-0.5 group-hover:bg-amber-400 group-hover:text-black transition-colors">
                                                            <Check className="w-3.5 h-3.5" />
                                                        </div>
                                                        <span className="text-xs text-[#a1a1aa] leading-relaxed group-hover:text-white transition-colors">
                                                            {cleanRupeeText(perk)}
                                                        </span>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-xs text-[#71717a] py-6 col-span-2 text-center">No perks listed for this card.</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Secondary Recommendations Section: Runner-ups comparison */}
                {runner_ups && runner_ups.length > 0 && (
                    <div className="space-y-6 pt-6 border-t border-[#27272a]/60">
                        <div>
                            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                                <Wallet className="w-5 h-5 text-amber-400/80" />
                                Runner-Up Recommendations
                            </h2>
                            <p className="text-xs text-[#71717a] mt-0.5">Other suitable alternatives evaluated by our graph node scoring.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {runner_ups.map((card, idx) => {
                                const cardTheme = getCardTheme(card.tier)
                                return (
                                    <div 
                                        key={idx}
                                        className="bg-[#181a1f]/80 backdrop-blur-md border border-[#27272a] rounded-2xl p-5 hover:border-amber-500/20 transition-all duration-300 flex flex-col justify-between group shadow-xl"
                                    >
                                        <div>
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-[#71717a]">{card.issuer}</span>
                                                    <h3 className="text-sm font-bold text-white leading-snug mt-0.5">{card.name}</h3>
                                                </div>
                                                <Badge variant="outline" className={`${cardTheme.badge} text-[9px] font-extrabold tracking-widest px-2 py-0.5`}>
                                                    {card.tier}
                                                </Badge>
                                            </div>

                                            {/* Micro-Card Visual Placeholder */}
                                            <div className={`w-full h-24 rounded-xl ${cardTheme.bg} border ${cardTheme.border} p-3 flex flex-col justify-between mb-4 shadow-lg opacity-85 group-hover:opacity-100 transition-all`}>
                                                <div className="flex justify-between items-start">
                                                    <span className="text-[8px] tracking-widest font-extrabold text-white/50">{card.issuer.toUpperCase()}</span>
                                                    <span className="text-[8px] font-mono text-white/40">{card.card_network}</span>
                                                </div>
                                                <div className="flex justify-between items-end">
                                                    <span className="text-[8px] font-mono text-white/50 tracking-widest">•••• •••• •••• #{idx+2}</span>
                                                    <span className="text-[8px] font-bold text-white/60">RUNNER UP</span>
                                                </div>
                                            </div>

                                            {/* Summary stats */}
                                            <div className="grid grid-cols-3 gap-2 bg-[#121417] border border-[#27272a] rounded-lg p-2.5 text-center mb-4">
                                                <div>
                                                    <p className="text-[8px] text-[#71717a] uppercase font-bold tracking-wider">Net Annual</p>
                                                    <p className="text-xs font-bold text-amber-400 mt-0.5">₹{card.net_annual_value.toLocaleString("en-IN")}</p>
                                                </div>
                                                <div className="border-l border-[#27272a]">
                                                    <p className="text-[8px] text-[#71717a] uppercase font-bold tracking-wider">Est. Monthly</p>
                                                    <p className="text-xs font-bold text-emerald-400 mt-0.5">₹{card.estimated_monthly_reward.toLocaleString("en-IN")}</p>
                                                </div>
                                                <div className="border-l border-[#27272a]">
                                                    <p className="text-[8px] text-[#71717a] uppercase font-bold tracking-wider">Annual Fee</p>
                                                    <p className="text-xs font-bold text-white mt-0.5">
                                                        {card.annual_fee === 0 ? "Free" : `₹${card.annual_fee.toLocaleString("en-IN")}`}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Welcome benefit text */}
                                            <div className="text-[11px] text-[#a1a1aa] bg-[#121417]/50 rounded-lg p-3 border border-[#27272a]/50">
                                                <span className="font-bold text-white text-[10px] block mb-0.5">Welcome Offer:</span>
                                                {getWelcomeBenefitsText(card)}
                                            </div>
                                        </div>

                                        {/* Show 3 perks limit */}
                                        {card.key_perks && card.key_perks.length > 0 && (
                                            <div className="mt-4 pt-4 border-t border-[#27272a]/60">
                                                <p className="text-[9px] uppercase tracking-wider font-extrabold text-[#71717a] mb-2">Key Perks</p>
                                                <ul className="text-[11px] text-[#a1a1aa] space-y-1">
                                                    {card.key_perks.slice(0, 3).map((perk, i) => (
                                                        <li key={i} className="flex items-center gap-1.5 truncate">
                                                            <span className="w-1 h-1 rounded-full bg-amber-400/80" />
                                                            <span>{cleanRupeeText(perk)}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

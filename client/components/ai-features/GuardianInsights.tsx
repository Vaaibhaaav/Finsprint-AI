"use client"

import React from "react"
import { ShieldAlert, AlertTriangle, Info, ShieldCheck, DollarSign, ArrowUpRight, TrendingUp } from "lucide-react"
import { useAiFeaturesStore } from "@/store/useAiFeaturesStore"
import { Badge } from "@/components/ui/badge"

export default function GuardianInsights() {
    const { insightsData, isLoading } = useAiFeaturesStore()
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <div className="bg-[#181a1f] border border-[#27272a]/80 rounded-xl p-6 h-full flex flex-col items-center justify-center min-h-[350px] shadow-2xl relative text-center">
                <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/5 blur-2xl pointer-events-none rounded-full" />
                <div className="w-12 h-12 rounded-full border-2 border-emerald-500/20 border-t-emerald-400 animate-spin mb-4" />
                <p className="text-sm font-semibold text-white">Loading Guardian Insights...</p>
            </div>
        )
    }

    if (isLoading) {
        return (
            <div className="bg-[#181a1f] border border-[#27272a]/80 rounded-xl p-6 h-full flex flex-col items-center justify-center min-h-[350px] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/5 blur-3xl pointer-events-none rounded-full" />
                <div className="w-12 h-12 rounded-full border-2 border-emerald-500/20 border-t-emerald-400 animate-spin mb-4" />
                <p className="text-sm font-semibold text-white">Analyzing Statement Ingestion Matrix...</p>
                <p className="text-xs text-[#a1a1aa] mt-1">Guardian Engine Node 01 checking for duplicate liabilities</p>
            </div>
        )
    }

    if (!insightsData || !insightsData.anomalies || insightsData.anomalies.length === 0) {
        return (
            <div className="bg-[#181a1f] border border-[#27272a]/80 rounded-xl p-6 h-full flex flex-col items-center justify-center min-h-[350px] shadow-2xl relative text-center">
                <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/5 blur-2xl pointer-events-none rounded-full" />
                <div className="p-4 bg-[#20222a] rounded-full text-[#71717a] mb-4">
                    <ShieldCheck className="w-8 h-8 text-[#a1a1aa]" />
                </div>
                <h3 className="text-sm font-semibold text-white tracking-tight">Guardian Insights Idle</h3>
                <p className="text-xs text-[#a1a1aa] max-w-[280px] mt-1">
                    No active anomalies analyzed. Ingest statements above to analyze duplicate payments and velocities.
                </p>
            </div>
        )
    }

    const { anomalies, insights } = insightsData

    return (
        <div className="bg-[#181a1f] border border-[#27272a]/80 rounded-xl p-6 shadow-2xl h-full flex flex-col transition-all duration-300">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="text-md font-semibold text-white tracking-tight flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-rose-500" />
                        Guardian Insights
                    </h3>
                    <p className="text-xs text-[#71717a]">{insights}</p>
                </div>
                <Badge variant="outline" className="text-rose-400 bg-rose-500/5 border-rose-500/20 text-[10px] uppercase tracking-wider font-bold">
                    Node 01 Active
                </Badge>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 max-h-[380px] scrollbar-none pr-1">
                {anomalies.map((anomaly, idx) => {
                    const isHigh = anomaly.severity === "high" || anomaly.subtype === "double_payment"
                    const isMedium = anomaly.severity === "medium" || anomaly.subtype === "recurring_spike"
                    
                    return (
                        <div
                            key={idx}
                            className={`border rounded-lg p-4 transition-all duration-300 relative overflow-hidden bg-[#121417]/60 hover:bg-[#121417] ${
                                isHigh 
                                    ? "border-rose-500/30 hover:border-rose-500/50" 
                                    : isMedium 
                                        ? "border-amber-500/20 hover:border-amber-500/40" 
                                        : "border-[#27272a] hover:border-[#3f3f46]"
                            }`}
                        >
                            {/* Accent Glow */}
                            <div className={`absolute top-0 left-0 bottom-0 w-[3px] ${
                                isHigh ? "bg-rose-500" : isMedium ? "bg-amber-400" : "bg-[#27272a]"
                            }`} />

                            <div className="flex justify-between items-start mb-2 pl-2">
                                <div>
                                    <h4 className="text-xs uppercase font-bold tracking-wider text-[#a1a1aa]">
                                        {anomaly.subtype.replace("_", " ")}
                                    </h4>
                                    <h3 className="text-sm font-semibold text-white mt-0.5">
                                        {anomaly.merchant}
                                    </h3>
                                </div>
                                <Badge
                                    className={`text-[9px] uppercase tracking-widest px-2 py-0.5 font-bold ${
                                        isHigh
                                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                            : isMedium
                                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                                : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                    }`}
                                >
                                    {isHigh ? "High Severity" : isMedium ? "Warning Alert" : "Info Alert"}
                                </Badge>
                            </div>

                            {/* Custom Details for Double Payments */}
                            {anomaly.subtype === "double_payment" && (
                                <div className="grid grid-cols-2 gap-3 pl-2 my-3 py-2 border-y border-[#27272a] bg-[#1a0e10]/20">
                                    <div className="border-r border-[#27272a]">
                                        <p className="text-[10px] text-[#71717a] uppercase tracking-wider font-semibold">1st Charge</p>
                                        <p className="text-xs font-semibold text-[#a1a1aa] mt-0.5">{anomaly.first_charge_date}</p>
                                        <p className="text-sm font-bold text-white mt-0.5">₹{anomaly.amount}</p>
                                    </div>
                                    <div className="pl-1">
                                        <p className="text-[10px] text-rose-400 uppercase tracking-wider font-semibold">2nd Charge (Duplicate)</p>
                                        <p className="text-xs font-semibold text-[#a1a1aa] mt-0.5">{anomaly.second_charge_date}</p>
                                        <p className="text-sm font-bold text-rose-400 mt-0.5">₹{anomaly.amount}</p>
                                    </div>
                                </div>
                            )}

                            {/* Custom Details for Liabilities & Recurring Spikes */}
                            {(anomaly.subtype === "recurring_spike" || anomaly.subtype === "liability" || anomaly.subtype === "recurring") && (
                                <div className="grid grid-cols-3 gap-2 pl-2 my-3 py-2 border-y border-[#27272a] bg-[#1d1b18]/25">
                                    <div>
                                        <p className="text-[9px] text-[#71717a] uppercase tracking-wider font-semibold">Previous Velocity</p>
                                        <p className="text-xs font-bold text-[#a1a1aa] mt-0.5">
                                            ₹{anomaly.previous_amount ? anomaly.previous_amount.toLocaleString("en-IN") : "0"}/mo
                                        </p>
                                    </div>
                                    <div className="border-x border-[#27272a] px-2">
                                        <p className="text-[9px] text-amber-400 uppercase tracking-wider font-semibold">Current Velocity</p>
                                        <p className="text-xs font-bold text-white mt-0.5 flex items-center gap-0.5">
                                            ₹{anomaly.monthly_amount ? anomaly.monthly_amount.toLocaleString("en-IN") : "0"}/mo
                                            {anomaly.subtype === "recurring_spike" && (
                                                <TrendingUp className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                            )}
                                        </p>
                                    </div>
                                    <div className="pl-1">
                                        <p className="text-[9px] text-[#71717a] uppercase tracking-wider font-semibold">Annual Projected Cost</p>
                                        <p className="text-xs font-bold text-[#bdf692] mt-0.5">
                                            ₹{anomaly.annual_cost ? anomaly.annual_cost.toLocaleString("en-IN") : "0"}/yr
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Custom Outlier details */}
                            {anomaly.subtype === "unusual_large" && (
                                <div className="pl-2 my-3 py-2 border-y border-[#27272a] bg-[#161a22]/30 flex justify-between items-center">
                                    <div>
                                        <p className="text-[9px] text-[#71717a] uppercase tracking-wider font-semibold">Outlier Date</p>
                                        <p className="text-xs font-bold text-[#a1a1aa] mt-0.5">{anomaly.transaction_date}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] text-amber-400 uppercase tracking-wider font-semibold">Outlier Amount</p>
                                        <p className="text-sm font-bold text-white mt-0.5">₹{anomaly.amount?.toLocaleString("en-IN")}</p>
                                    </div>
                                </div>
                            )}

                            <div className="pl-2 mt-2">
                                <p className="text-xs text-[#d4d4d8] leading-relaxed">
                                    {anomaly.explanation}
                                </p>
                                
                                <div className="mt-3 flex items-start gap-1.5 bg-[#121417] border border-[#27272a] rounded px-3 py-1.5">
                                    <span className="text-[10px] font-bold text-[#bdf692] uppercase tracking-wider shrink-0 mt-0.5">
                                        Action Required:
                                    </span>
                                    <span className="text-xs font-medium text-white">
                                        {anomaly.action}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

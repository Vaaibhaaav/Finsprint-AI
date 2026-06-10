"use client"

import React, { useEffect } from "react"
import { Sparkles, Info } from "lucide-react"
import TransactionUploader from "@/components/ai-features/TransactionUploader"
import GuardianInsights from "@/components/ai-features/GuardianInsights"
import RewardOptimizer from "@/components/ai-features/RewardOptimizer"
import LiveResearchChat from "@/components/ai-features/LiveResearchChat"
import { useUserStore } from "@/store/userStore"
import { useTransactionStore } from "@/store/transactionStore"
import { useGoalsStore } from "@/store/goalsStore"
import { useApi } from "@/lib/api"

export default function AiFeaturesPage() {
    const api = useApi()
    const { fetchUser } = useUserStore()
    const { fetchAllTransactionsForUser } = useTransactionStore()
    const { fetchGoals } = useGoalsStore()

    // Fetch baseline data on mount to populate context for AI agents
    useEffect(() => {
        const initData = async () => {
            try {
                await fetchUser(api)
                await fetchAllTransactionsForUser(api)
                await fetchGoals(api)
            } catch (err) {
                console.error("Failed to load user financial baseline data:", err)
            }
        }
        initData()
    }, [api])

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto pb-12">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#27272a]/60 pb-5">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
                        <Sparkles className="w-6 h-6 text-[#bdf692] drop-shadow-[0_0_10px_rgba(189,246,146,0.3)]" />
                        FinSprint AI Hub
                    </h1>
                    <p className="text-xs text-[#a1a1aa] mt-1.5">
                        Track financial anomalies, optimize premium credit rewards, and research market opportunities with specialized autonomous agents.
                    </p>
                </div>
                
                <div className="flex items-center gap-2 bg-[#181a1f] border border-[#27272a] rounded-lg px-3 py-2 text-[11px] text-[#a1a1aa] max-w-sm">
                    <Info className="w-4 h-4 text-[#bdf692] shrink-0" />
                    <span>
                        Upload statements below to feed real-time transactions into the agent graph nodes.
                    </span>
                </div>
            </div>

            {/* Global Ingestion Header Module */}
            <div className="w-full">
                <TransactionUploader />
            </div>

            {/* Sub-Agents Interactive Grid Workspace */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* Column 1: Guardian Insights (Node 01) */}
                <div className="lg:col-span-5 h-full">
                    <GuardianInsights />
                </div>

                {/* Column 2: Live Research Assistant (Node 03) */}
                <div className="lg:col-span-7 h-full">
                    <LiveResearchChat />
                </div>
            </div>

            {/* Bottom Row: Reward Optimizer (Node 02) */}
            <div className="w-full">
                <RewardOptimizer />
            </div>
        </div>
    )
}

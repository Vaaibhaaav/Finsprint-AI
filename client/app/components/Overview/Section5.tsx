"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { useTransactionStore } from "@/store/transactionStore"
import { useUserStore } from "@/store/userStore"
import { ArrowUpRight, ArrowDownLeft } from "lucide-react"

export default function Section5() {
    const router = useRouter()
    const { transactions } = useTransactionStore()
    const { user } = useUserStore()
    const [activeItem, setActiveItem] = React.useState(-1)

    // Sort transactions by date (most recent first), take top 4
    const recentTransactions = [...(transactions || [])]
        .sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime())
        .slice(0, 4)

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
            className="bg-neutral-800 overflow-y-hidden scrollbar-hidden backdrop-blur-md border border-[#1C1C1F] p-5 rounded-2xl h-full w-full text-xs antialiased select-none flex flex-col justify-between"
        >
            <div>
                <h2 className="font-medium text-white text-[15px] tracking-tight mb-3">
                    Recent Activity
                </h2>

                <div className="flex flex-col gap-2">
                    {recentTransactions.length === 0 ? (
                        <div className="text-[#71717A] text-sm py-4 italic text-center">
                            No recent transactions found
                        </div>
                    ) : (
                        recentTransactions.map((transaction, idx) => {
                            const isIncome = transaction.Type === "income"
                            
                            return (
                                <div
                                    key={transaction.ID || idx}
                                    onClick={() => router.push("/transactions")}
                                    className={`flex flex-row p-3 items-center gap-3 rounded-xl transition-all duration-200 cursor-pointer ${
                                        activeItem === idx
                                            ? 'bg-neutral-700 opacity-90 border border-[#3F3F46]/30 shadow-md'
                                            : 'border border-[#27272a]/30 bg-neutral-900/30'
                                    }`}
                                    onMouseEnter={() => setActiveItem(idx)}
                                    onMouseLeave={() => setActiveItem(-1)}
                                >
                                    <div className={`p-2.5 rounded-lg flex items-center justify-center shrink-0 ${
                                        isIncome ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                                    }`}>
                                        {isIncome ? (
                                            <ArrowUpRight size={16} />
                                        ) : (
                                            <ArrowDownLeft size={16} />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium text-white text-sm tracking-tight truncate">
                                            {transaction.Merchant || "Unknown Merchant"}
                                        </h3>
                                        <p className="text-[#71717A] text-[11px] leading-normal truncate">
                                            {new Date(transaction.Date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} • {transaction.Category}
                                        </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <span className={`font-bold text-sm ${
                                            isIncome ? 'text-emerald-400' : 'text-[#e4e4e7]'
                                        }`}>
                                            {isIncome ? "+" : "-"}{formatCurrency(transaction.Amount)}
                                        </span>
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
"use client"

import React from "react"
import { useTransactionStore } from "@/store/transactionStore"
import { useUserStore } from "@/store/userStore"

export default function Section1() {
    const { transactions } = useTransactionStore()
    const { user } = useUserStore()

    const income = (transactions || [])
        .filter((t) => t.Type === "income")
        .reduce((sum, t) => sum + t.Amount, 0)
    const expense = (transactions || [])
        .filter((t) => t.Type === "expense")
        .reduce((sum, t) => sum + t.Amount, 0)

    const baseline = user?.MonthlyBudget || 10000
    const netWorthValue = baseline + income - expense

    const savings = income - expense
    const savingsRate = income > 0 ? Math.max(0, Math.round((savings / income) * 100)) : 31 // fallback default

    const velocityIndex = income > 0 ? Math.min(100, Math.max(0, Math.round((income / (expense || 1)) * 50))) : 68

    const formatCurrency = (amount: number) => {
        const isRupee = user?.Currency === "INR" || user?.Currency === "₹"
        return (isRupee ? "₹" : "$") + amount.toLocaleString(isRupee ? "en-IN" : "en-US", {
            maximumFractionDigits: 0
        })
    }

    const sortedTxs = [...(transactions || [])].sort(
        (a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime()
    )

    let currentBalance = baseline
    const balancePoints = sortedTxs.map((t) => {
        if (t.Type === "income") {
            currentBalance += t.Amount
        } else {
            currentBalance -= t.Amount
        }
        return currentBalance
    })

    const svgWidth = 600
    const svgHeight = 120
    const padding = 15

    let pathD = ""
    let areaD = ""

    if (balancePoints.length > 1) {
        const minVal = Math.min(...balancePoints, baseline)
        const maxVal = Math.max(...balancePoints, baseline)
        const range = maxVal - minVal || 1

        const coordinatePoints = balancePoints.map((val, idx) => {
            const x = (idx / (balancePoints.length - 1)) * svgWidth
            const y = svgHeight - padding - ((val - minVal) / range) * (svgHeight - 2 * padding)
            return { x, y }
        })

        pathD = `M ${coordinatePoints[0].x},${coordinatePoints[0].y} `
        for (let i = 1; i < coordinatePoints.length; i++) {
            pathD += `L ${coordinatePoints[i].x},${coordinatePoints[i].y} `
        }

        areaD = `${pathD} L ${svgWidth},${svgHeight} L 0,${svgHeight} Z`
    } else {
        // Fallback smooth curve line
        pathD = "M 0,105 Q 150,115 300,50 T 600,15"
        areaD = "M 0,105 Q 150,115 300,50 T 600,15 L 600,120 L 0,120 Z"
    }

    // Dynamic x-axis dates labels
    const chartLabels = sortedTxs.length > 1
        ? [
            new Date(sortedTxs[0].Date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            new Date(sortedTxs[Math.floor(sortedTxs.length / 2)].Date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            new Date(sortedTxs[sortedTxs.length - 1].Date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
          ]
        : ["Start", "Midpoint", "Current"]

    return (
        <div
            style={{
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            }}
            className="bg-neutral-800 h-full border border-[#1C1C1F] p-6 rounded-lg w-full text-xs antialiased select-none"
        >
            <div className="mb-4">
                <h2 className="text-[#FAFAFA] font-medium text-[15px] tracking-tight">
                    My Financial Velocity
                </h2>
            </div>

            <div className="flex flex-row items-end justify-between gap-4 mb-6">
                <div className="flex flex-col gap-0.5">
                    <span className="text-[#52525B] text-[11px] font-medium">Net Worth</span>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-white font-semibold text-[22px] tracking-tight leading-none">
                            {formatCurrency(netWorthValue)}
                        </span>
                        <span className="text-[#4ADE80] font-medium text-[10px]">
                            {savingsRate > 0 ? `(+${savingsRate}%)` : `(0%)`}
                        </span>
                    </div>
                </div>

                <div className="flex flex-row gap-12 text-right md:text-left pr-2">
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[#52525B] text-[11px] font-medium">Savings Rate</span>
                        <span className="text-white font-semibold text-[16px] tracking-tight">
                            {savingsRate}%
                        </span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[#52525B] text-[11px] font-medium">Velocity Index</span>
                        <span className="text-[#6EE7B7] font-semibold text-[16px] tracking-tight">
                            {velocityIndex}
                        </span>
                    </div>
                </div>
            </div>

            {/* Area Chart Rendering */}
            <div className="relative w-full h-36 mt-4">
                <div className="flex items-center gap-4 text-[10px] text-[#52525B] z-10 mb-2">
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-[2px] bg-[#6EE7B7]" />
                        <span>Cumulative Net Worth</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-[2px] bg-[#27272A]" />
                        <span>Baseline Tracking</span>
                    </div>
                </div>

                <svg className="w-full h-full overflow-visible" viewBox="0 0 600 120" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="netWorthGlow" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10B981" stopOpacity="0.12" />
                            <stop offset="100%" stopColor="#10B981" stopOpacity="0.00" />
                        </linearGradient>
                    </defs>

                    {/* Background Reference Track Lines */}
                    <path d="M 0,20 L 600,20" stroke="#1C1C1F" strokeWidth="1" strokeDasharray="3 3" />
                    <path d="M 0,60 L 600,60" stroke="#1C1C1F" strokeWidth="1" strokeDasharray="3 3" />
                    <path d="M 0,100 L 600,100" stroke="#1C1C1F" strokeWidth="1" strokeDasharray="3 3" />

                    {/* Baseline Line */}
                    <path
                        d="M 0,60 H 600"
                        fill="none"
                        stroke="#27272A"
                        strokeWidth="1.5"
                    />

                    {/* Area Gradient Fill under Main Net Worth Line */}
                    <path
                        d={areaD}
                        fill="url(#netWorthGlow)"
                    />

                    {/* Primary Net Worth Path Line */}
                    <path
                        d={pathD}
                        fill="none"
                        stroke="#6EE7B7"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                    />
                </svg>
            </div>

            <div className="flex justify-between text-[10px] text-[#3F3F46] font-medium px-1 mt-2.5 tracking-wider">
                <span>{chartLabels[0]}</span>
                <span>{chartLabels[1]}</span>
                <span>{chartLabels[2]}</span>
            </div>
        </div>
    )
}
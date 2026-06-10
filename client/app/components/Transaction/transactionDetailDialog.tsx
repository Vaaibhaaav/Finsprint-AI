'use client'

import { X, DollarSign, ShoppingBag, CalendarDays, Tag, Zap, TrendingUp, TrendingDown, User, Hash, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { TransactionType } from "@/types/types"

interface TransactionDetailDialogProps {
    transaction: TransactionType | null
    onClose: () => void
}

export function TransactionDetailDialog({ transaction, onClose }: TransactionDetailDialogProps) {
    if (!transaction) return null

    const isIncome = transaction.Amount > 0
    const formattedAmount = isIncome
        ? `+$${Number(transaction.Amount).toFixed(2)}`
        : `-$${Math.abs(Number(transaction.Amount)).toFixed(2)}`

    const formattedDate = transaction.Date
        ? new Date(transaction.Date).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        })
        : "—"

    const formattedCreatedAt = transaction.CreatedAt
        ? new Date(transaction.CreatedAt).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
        : "—"

    const identifierConfig: Record<string, { label: string; className: string }> = {
        impulsive: { label: "Impulsive", className: "bg-red-500/10 text-red-400 border border-red-500/20" },
        "well thought": { label: "Well Thought", className: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" },
        needed: { label: "Needed", className: "bg-blue-500/10 text-blue-400 border border-blue-500/20" },
        unknown: { label: "Unknown", className: "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse" },
    }

    const identifier = identifierConfig[transaction.TransactionIdentifier?.toLowerCase()] ?? identifierConfig["unknown"]

    return (
        <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
            <div className="bg-[#1c1e22] border border-neutral-800/80 rounded-xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95 duration-150">

                {/* Header */}
                <div className="flex items-start justify-between p-5 border-b border-neutral-800">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                            isIncome ? "bg-[#9aeb8e]/10" : "bg-neutral-800"
                        )}>
                            {isIncome
                                ? <TrendingUp size={18} className="text-[#9aeb8e]" />
                                : <TrendingDown size={18} className="text-neutral-400" />
                            }
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-white leading-tight">{transaction.Merchant || "Unknown Merchant"}</h2>
                            <p className="text-xs text-neutral-500 mt-0.5">{transaction.Description || "No description"}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={cn(
                            "text-xl font-bold tracking-tight",
                            isIncome ? "text-[#9aeb8e]" : "text-neutral-200"
                        )}>
                            {formattedAmount}
                        </span>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-5 space-y-4">

                    {/* Top badges row */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn(
                            "text-xs px-2.5 py-1 rounded-full font-medium",
                            isIncome ? "bg-emerald-500/10 text-emerald-400" : "bg-neutral-800 text-neutral-400"
                        )}>
                            {transaction.Type?.charAt(0).toUpperCase() + transaction.Type?.slice(1) || "Unknown"}
                        </span>
                        <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium", identifier.className)}>
                            {identifier.label}
                        </span>
                        {transaction.RiskFlag && (
                            <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                                ⚠ Risk Flagged
                            </span>
                        )}
                        {transaction.IsAITagged && (
                            <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20">
                                ✦ AI Tagged
                            </span>
                        )}
                    </div>

                    {/* Details grid */}
                    <div className="grid grid-cols-2 gap-3">
                        <DetailRow icon={<CalendarDays size={14} />} label="Date" value={formattedDate} />
                        <DetailRow icon={<Tag size={14} />} label="Category" value={transaction.Category || "—"} capitalize />
                        <DetailRow icon={<ShoppingBag size={14} />} label="Merchant" value={transaction.Merchant || "—"} />
                        <DetailRow icon={<Zap size={14} />} label="Motive" value={transaction.Motive || "—"} />
                        <DetailRow icon={<DollarSign size={14} />} label="Amount" value={formattedAmount} highlight={isIncome} />
                        <DetailRow icon={<Clock size={14} />} label="Recorded" value={formattedCreatedAt} />
                    </div>

                    {/* Divider */}
                    <div className="border-t border-neutral-800/60" />

                    {/* IDs section */}
                    <div className="space-y-2">
                        <p className="text-[11px] text-neutral-600 uppercase tracking-widest font-medium">Meta</p>
                        <div className="bg-[#131517] rounded-lg p-3 space-y-2">
                            <MetaRow label="Transaction ID" value={transaction.ID as string} />
                            <MetaRow label="User ID" value={transaction.UserID as string} />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-5 pb-5">
                    <button
                        onClick={onClose}
                        className="w-full py-2 text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors border border-neutral-800"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}

function DetailRow({
    icon,
    label,
    value,
    capitalize,
    highlight,
}: {
    icon: React.ReactNode
    label: string
    value: string
    capitalize?: boolean
    highlight?: boolean
}) {
    return (
        <div className="bg-[#131517] rounded-lg p-3 space-y-1.5">
            <div className="flex items-center gap-1.5 text-neutral-500">
                {icon}
                <span className="text-[11px] uppercase tracking-wider font-medium">{label}</span>
            </div>
            <p className={cn(
                "text-sm font-medium leading-snug",
                highlight ? "text-[#9aeb8e]" : "text-neutral-200",
                capitalize && "capitalize"
            )}>
                {value}
            </p>
        </div>
    )
}

function MetaRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-neutral-500 shrink-0">{label}</span>
            <span className="text-xs text-neutral-400 font-mono truncate text-right">{value}</span>
        </div>
    )
}
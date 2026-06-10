'use client'

import React from "react"
import { MessageSquare } from "lucide-react"

export default function ChatDefaultPage() {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center text-neutral-600 gap-3 bg-neutral-950/5 p-6 animate-fade-in">
            <div className="p-4 rounded-2xl bg-[#131517]/50 border border-neutral-800/40 text-neutral-700 shadow-inner">
                <MessageSquare size={26} strokeWidth={1.5} />
            </div>
            <div className="text-center space-y-1 max-w-xs">
                <span className="text-xs font-medium text-neutral-400 tracking-wide block">System Standby</span>
                <p className="text-[11px] text-neutral-500 leading-relaxed font-normal">
                    Select an active advisory routing node from the ledger sidebar to connect the real-time communications array.
                </p>
            </div>
        </div>
    )
}
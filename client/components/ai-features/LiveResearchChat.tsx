"use client"

import React, { useState, useRef, useEffect } from "react"
import { Send, Globe, ChevronDown, ChevronUp, Lock, RefreshCw, AlertOctagon, HelpCircle, AlertCircle, ArrowUpRight } from "lucide-react"
import { useAiFeaturesStore } from "@/store/useAiFeaturesStore"
import { useUserStore } from "@/store/userStore"
import { useTransactionStore } from "@/store/transactionStore"
import { useGoalsStore } from "@/store/goalsStore"
import { useApi } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function LiveResearchChat() {
    const api = useApi()
    const { user } = useUserStore()
    const { transactions } = useTransactionStore()
    const { goals } = useGoalsStore()

    const { 
        researchMessages, 
        sendLiveResearchMessage, 
        isLoading, 
        currentError, 
        goEnvelopeStatus,
        resetResearch
    } = useAiFeaturesStore()

    const [input, setInput] = useState<string>("")
    const [openCitations, setOpenCitations] = useState<{ [key: string]: boolean }>({})
    
    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [researchMessages, isLoading])

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || isLoading) return

        const text = input
        setInput("")
        
        const userProfile = { user, transactions, goals }
        await sendLiveResearchMessage(text, userProfile, api)
    }

    const toggleCitations = (msgId: string) => {
        setOpenCitations(prev => ({
            ...prev,
            [msgId]: !prev[msgId]
        }))
    }

    const isGated = goEnvelopeStatus === "gated_fallback"

    return (
        <div className="bg-[#181a1f] border border-[#27272a]/80 rounded-xl p-5 shadow-2xl h-full flex flex-col relative overflow-hidden min-h-[420px]">
            {/* Ambient Accent Background */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/5 blur-3xl pointer-events-none rounded-full" />
            
            {/* Header */}
            <div className="flex justify-between items-center mb-4 shrink-0 pb-3 border-b border-[#27272a]">
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />
                    <div>
                        <h3 className="text-sm font-semibold text-white tracking-tight">
                            Live Research Assistant
                        </h3>
                        <p className="text-[10px] text-[#71717a]">Dual-pass tool-calling engine active.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={resetResearch}
                        className="text-[10px] text-[#71717a] hover:text-white transition-all underline"
                    >
                        Clear Feed
                    </button>
                    <Badge variant="outline" className="text-blue-400 bg-blue-500/5 border-blue-500/20 text-[10px] uppercase tracking-wider font-bold">
                        Node 03 Active
                    </Badge>
                </div>
            </div>

            {/* Chat Timeline Feed */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4 scrollbar-none flex flex-col">
                {researchMessages.map((msg) => {
                    const isUser = msg.role === "user"
                    return (
                        <div
                            key={msg.id}
                            className={`flex flex-col max-w-[85%] ${
                                isUser ? "self-end items-end" : "self-start items-start"
                            }`}
                        >
                            <span className="text-[9px] uppercase tracking-wider font-bold text-[#71717a] mb-1 px-1">
                                {isUser ? "You" : "FinSprint AI"}
                            </span>
                            
                            <div
                                className={`rounded-xl px-4 py-2.5 text-xs leading-relaxed ${
                                    isUser
                                        ? "bg-blue-600 text-white rounded-tr-none shadow-[0_4px_12px_rgba(37,99,235,0.15)]"
                                        : "bg-[#121417]/80 text-[#e4e4e7] border border-[#27272a] rounded-tl-none"
                                }`}
                            >
                                <div className="whitespace-pre-wrap">{msg.content}</div>

                                {/* Citation Widget for Assistant message */}
                                {!isUser && msg.citations && msg.citations.length > 0 && (
                                    <div className="mt-3 border-t border-[#27272a]/60 pt-2 shrink-0">
                                        <button
                                            onClick={() => toggleCitations(msg.id)}
                                            className="flex items-center gap-1.5 text-[10px] font-semibold text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-wider"
                                        >
                                            <Globe className="w-3 h-3 text-blue-400 shrink-0" />
                                            <span>
                                                {openCitations[msg.id]
                                                    ? "Hide live source citations"
                                                    : `Show live source citations (${msg.citations.length})`}
                                            </span>
                                            {openCitations[msg.id] ? (
                                                <ChevronUp className="w-3.5 h-3.5 shrink-0" />
                                            ) : (
                                                <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                                            )}
                                        </button>

                                        {openCitations[msg.id] && (
                                            <div className="mt-2 grid grid-cols-1 gap-2 animate-slide-down">
                                                {msg.citations.map((cite, cIdx) => (
                                                    <div
                                                        key={cIdx}
                                                        className="bg-[#181a1f] border border-[#27272a] rounded p-2 text-[10px] flex flex-col justify-between"
                                                    >
                                                        <div>
                                                            <div className="flex justify-between items-start gap-1">
                                                                <span className="font-bold text-white uppercase tracking-wider text-[8px]">
                                                                    {cite.bank}
                                                                </span>
                                                                <a
                                                                    href={cite.source_url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-blue-400 hover:underline flex items-center gap-0.5 shrink-0"
                                                                >
                                                                    Source <ArrowUpRight className="w-2.5 h-2.5" />
                                                                </a>
                                                            </div>
                                                            <h5 className="font-semibold text-[#a1a1aa] mt-0.5">{cite.card_name}</h5>
                                                            <p className="text-[#71717a] mt-1 italic leading-tight">
                                                                "{cite.offer_or_deal}"
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}

                {isLoading && (
                    <div className="flex flex-col items-start max-w-[85%] self-start">
                        <span className="text-[9px] uppercase tracking-wider font-bold text-[#71717a] mb-1 px-1">
                            FinSprint AI
                        </span>
                        <div className="bg-[#121417]/80 border border-[#27272a] rounded-xl rounded-tl-none px-4 py-3 text-xs text-[#a1a1aa] flex items-center gap-2">
                            <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                            <span>Synthesizing live web metrics...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Conversational Input bar */}
            <form onSubmit={handleSend} className="relative shrink-0 flex items-center gap-2 mt-auto">
                <input
                    type="text"
                    placeholder={
                        isGated
                            ? "Workspace config required - Upload statements above"
                            : "Ask about card features, rewards optimizations..."
                    }
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={isLoading || isGated}
                    className="flex-1 bg-[#121417] border border-[#27272a] rounded-lg text-xs px-4 py-2.5 text-white placeholder-[#52525b] focus:border-blue-400/50 outline-none pr-10 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                    type="submit"
                    disabled={!input.trim() || isLoading || isGated}
                    className="absolute right-2 p-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white disabled:bg-[#27272a] disabled:text-[#71717a] transition-all"
                >
                    <Send className="w-3.5 h-3.5" />
                </button>
            </form>

            {/* High-Impact Gating Failure Locking Overlay Modal */}
            {isGated && (
                <div className="absolute inset-0 bg-[#0c0d10]/90 flex flex-col items-center justify-center p-6 text-center z-15 backdrop-blur-sm animate-fade-in">
                    <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4 animate-pulse">
                        <Lock className="w-8 h-8" />
                    </div>
                    <h3 className="text-md font-bold text-white tracking-tight flex items-center gap-1.5">
                        <AlertOctagon className="w-5 h-5 text-rose-500" />
                        FinSprint System Access Refused
                    </h3>
                    <p className="text-xs text-[#d4d4d8] leading-relaxed max-w-[340px] mt-2 mb-6">
                        {currentError || "Missing financial transaction history or goals context. The Live Research Assistant cannot provide tailored strategies without baseline context."}
                    </p>
                    
                    <div className="flex gap-4">
                        <Button
                            variant="outline"
                            onClick={resetResearch}
                            className="border-[#27272a] text-white hover:bg-[#1c1c1f] transition-all text-xs"
                        >
                            Reset System Lock
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}

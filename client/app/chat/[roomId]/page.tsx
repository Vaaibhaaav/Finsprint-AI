'use client'

import React, { useState, useRef, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Send, Loader2, ShieldCheck, Wifi, WifiOff, ArrowLeft, Terminal } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useChatStore } from "@/store/chatStore"
import { useApi } from "@/lib/api"
import { useUser, useAuth } from "@clerk/nextjs"
export default function ChatRoomPage() {
    const [inputText, setInputText] = useState("")
    const scrollRef = useRef<HTMLDivElement>(null)
    const router = useRouter()
    const params = useParams()
    const api = useApi()

    const { user } = useUser()
    const { getToken } = useAuth() 
    const currentUserId = user?.id
    const roomId = params.roomId as string

    const { messages, isConnected, generatingHistory, rooms, setActiveRoom, initWebSocket, sendMessage } = useChatStore()

    useEffect(() => {
        async function syncAndVerifyConnection() {
            if (!roomId || !currentUserId) return

            await setActiveRoom(roomId, api)

            try {
                const token = await getToken()
                if (token) {
                    initWebSocket(currentUserId, token)
                }
            } catch (err) {
                console.error("[Room View Alert] Failed to recover real-time pipeline context:", err)
            }
        }

        syncAndVerifyConnection()
    }, [roomId, currentUserId]) 
    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault()
        if (!inputText.trim() || !roomId) return

        sendMessage(inputText.trim(), currentUserId!)
        setInputText("")
    }

    const activeRoom = rooms?.find(r => r.ID === roomId)

    return (
        <>
            <div className="bg-neutral-950/20 border-b border-neutral-800/40 px-5 py-3.5 flex items-center justify-between backdrop-blur-sm">
                <div className="flex items-center gap-3 min-w-0">
                    <button
                        onClick={() => router.push('/chat')}
                        className="p-2 hover:bg-neutral-800/50 text-neutral-400 hover:text-white rounded-xl md:hidden mr-1 transition-colors border border-transparent hover:border-neutral-700/40"
                    >
                        <ArrowLeft size={14} />
                    </button>
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-neutral-800 to-neutral-900 border border-neutral-700/40 flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-md">
                        {(activeRoom?.Coach?.Name || "CH").substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 space-y-0.5">
                        <h3 className="text-xs font-bold text-white tracking-wide truncate flex items-center gap-1.5">
                            {activeRoom?.CoachID ? `Consultant Session (${activeRoom.Coach?.Name || activeRoom.CoachID})` : `Advisory Stream Channel`}
                        </h3>
                        <p className="text-[10px] text-neutral-400 font-medium flex items-center gap-1">
                            <ShieldCheck size={11} className="text-[#9aeb8e]" /> End-to-End Cryptographic Consensus
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar bg-gradient-to-b from-transparent to-neutral-950/10">
                {generatingHistory ? (
                    <div className="w-full h-full flex flex-col items-center justify-center text-neutral-500 gap-2 font-mono text-[11px]">
                        <Loader2 size={16} className="animate-spin text-[#9aeb8e]" />
                        <span className="tracking-wider text-neutral-500">SYNC_LEDGER_ENTRIES...</span>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.SenderID === currentUserId
                        const timestamp = msg.CreatedAt ? new Date(msg.CreatedAt) : new Date()
                        const timeString = format(timestamp, "hh:mm a")

                        return (
                            <div key={msg.ID} className={cn("flex flex-col max-w-[70%] group animate-fade-in-up", isMe ? "ml-auto items-end" : "mr-auto items-start")}>
                                <div className={cn(
                                    "px-3.5 py-2.5 text-xs rounded-2xl leading-relaxed break-words shadow-md transition-all duration-150 border font-normal tracking-wide",
                                    isMe
                                        ? "bg-gradient-to-br from-[#9aeb8e] to-[#80d174] text-neutral-950 border-[#9aeb8e]/30 rounded-tr-none font-medium shadow-[#9aeb8e]/5"
                                        : "bg-neutral-900/90 text-neutral-100 border-neutral-800/80 rounded-tl-none",
                                    msg.isOptimistic && "opacity-40 scale-[0.97] blur-[0.2px]"
                                )}>
                                    {msg.Content}
                                </div>
                                <span className="text-[9px] text-neutral-500 font-mono tracking-tighter mt-1.5 px-1 flex items-center gap-1 select-none">
                                    {timeString}
                                    {msg.isOptimistic && <Loader2 size={8} className="animate-spin text-neutral-500" />}
                                </span>
                            </div>
                        )
                    })
                )}
                <div ref={scrollRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-4 bg-neutral-950/20 border-t border-neutral-800/40 flex gap-2.5 items-center backdrop-blur-sm">
                <div className="flex-1 relative flex items-center">
                    <span className="absolute left-3 text-neutral-600 font-mono text-[10px] select-none pointer-events-none">
                        <Terminal size={12} />
                    </span>
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder={isConnected ? "Enter cryptographic message query node..." : "Pipeline offline. Reconnecting sync engine..."}
                        disabled={!isConnected || generatingHistory}
                        className="w-full bg-[#0d0e11]/90 border border-neutral-800/60 rounded-xl pl-8 pr-3 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-700 focus:ring-1 focus:ring-[#9aeb8e]/10 transition-all h-10 shadow-inner"
                    />
                </div>
                <button
                    type="submit"
                    disabled={!inputText.trim() || !isConnected || generatingHistory}
                    className={cn(
                        "p-2.5 h-10 w-10 rounded-xl transition-all duration-200 flex items-center justify-center active:scale-95 shadow-md shrink-0 border border-transparent",
                        inputText.trim() && isConnected && !generatingHistory
                            ? "bg-[#9aeb8e] text-neutral-950 hover:bg-[#85cc7a] hover:shadow-lg hover:shadow-[#9aeb8e]/10 cursor-pointer"
                            : "bg-neutral-800/60 text-neutral-600 border-neutral-800/20 cursor-not-allowed"
                    )}
                >
                    <Send size={13} strokeWidth={2.5} />
                </button>
            </form>
        </>
    )
}


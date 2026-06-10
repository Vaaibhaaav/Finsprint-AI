'use client'

import React, { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Search, Compass, Radio } from "lucide-react"
import { cn } from "@/lib/utils"
import { useChatStore } from "@/store/chatStore"
import { useApi } from "@/lib/api"
import { useUser, useAuth } from "@clerk/nextjs" // Imported useAuth directly here

export default function ChatLayout({ children }: { children: React.ReactNode }) {
    const [searchRoom, setSearchRoom] = useState("")
    const router = useRouter()
    const params = useParams()
    
    // Core custom REST API instance hook
    const api = useApi() 
    
    // Core Clerk State Extractors
    const { user } = useUser()
    const { getToken } = useAuth() 
    const currentUserId = user?.id
    
    const { rooms, initWebSocket, disconnectWebSocket, fetchAllRooms, setActiveRoom, isConnected } = useChatStore()
    const currentActiveRoomId = params?.roomId as string || null

    useEffect(() => {
        async function startRealTimeSession() {
            if (!currentUserId) return

            try {
                // 1. Fetch a clean, unexpired session token string independently from Clerk
                const token = await getToken()
                
                if (token) {
                    // 2. Initialize the global WebSocket pool using the string token parameter
                    initWebSocket(currentUserId, token)
                }
                
                // 3. Keep using your standard undisturbed api instance hook for REST transactions
                await fetchAllRooms(api)
                
            } catch (error) {
                console.error("Failed to establish secure session synchronization:", error)
            }
        }

        startRealTimeSession()

        return () => {
            disconnectWebSocket()
        }
    }, [currentUserId, initWebSocket, fetchAllRooms, api, getToken, disconnectWebSocket])

    const filteredRooms = rooms?.filter(room => {
        const matchingTarget = room.CoachID || room.ID || ""
        return matchingTarget.toLowerCase().includes(searchRoom.toLowerCase())
    })

    const handleRoomSelect = (roomId: string) => {
        setActiveRoom(roomId, api)
        router.push(`/chat/${roomId}`)
    }

    return (
        <div
            style={{
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            }}
            className="w-full min-h-[calc(100vh-120px)] p-6 bg-gradient-to-b from-[#0d0e11] to-[#131517] flex flex-col gap-5 antialiased"
        >
            {/* STRATEGY ROOM TOP GLASS HEADER NAVBAR */}
            <div className="w-full bg-[#1c1e22]/60 backdrop-blur-md border border-neutral-800/30 rounded-2xl p-4 flex items-center justify-between shadow-xl">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-neutral-900/80 border border-neutral-800/60 rounded-xl text-[#9aeb8e] shadow-inner">
                        <Compass size={18} className="animate-spin-slow" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                            Strategy Room
                        </h1>
                        <p className="text-[10px] font-medium tracking-wide text-neutral-400 uppercase mt-0.5">Autonomous Private Advisory Network</p>
                    </div>
                </div>

                <div className={cn(
                    "flex items-center gap-2 text-[10px] font-semibold font-mono tracking-wider px-3 py-1 rounded-xl border transition-all duration-300 shadow-sm",
                    isConnected
                        ? "bg-[#9aeb8e]/10 border-[#9aeb8e]/30 text-[#9aeb8e] shadow-[#9aeb8e]/5"
                        : "bg-rose-500/5 border-rose-500/20 text-rose-400 animate-pulse"
                )}>
                    <Radio size={12} className={cn(isConnected && "animate-pulse")} />
                    <span>{isConnected ? "SECURE_CONN_LIVE" : "DISCONNECTED"}</span>
                </div>
            </div>

            {/* SPLIT SCREEN ENGINE VIEWPORT LAYER CONTAINER */}
            <div className="w-full flex-1 grid grid-cols-1 md:grid-cols-12 gap-5 h-[calc(100vh-230px)] min-h-[500px]">

                {/* SIDEBAR NAVIGATION PANEL (4 Columns) */}
                <div className={cn(
                    "col-span-1 md:col-span-4 bg-[#1c1e22]/40 backdrop-blur-sm border border-neutral-800/20 rounded-2xl flex flex-col overflow-hidden shadow-lg transition-all",
                    currentActiveRoomId && "hidden md:flex"
                )}>
                    <div className="p-4 border-b border-neutral-800/40 space-y-3 bg-neutral-950/20">
                        <div className="relative w-full">
                            <input
                                type="text"
                                placeholder="Search active consulting routes..."
                                value={searchRoom}
                                onChange={(e) => setSearchRoom(e.target.value)}
                                className="w-full bg-[#0d0e11]/90 border border-neutral-800/60 rounded-xl text-xs pl-3 pr-9 py-2.5 text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-neutral-700 focus:ring-1 focus:ring-[#9aeb8e]/20 transition-all h-10 shadow-inner"
                            />
                            <Search className="absolute right-3 top-3 text-neutral-600" size={14} />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
                        {filteredRooms.length === 0 ? (
                            <div className="w-full h-32 flex flex-col items-center justify-center text-xs font-mono text-neutral-600 italic">
                                Empty pipeline registries.
                            </div>
                        ) : (
                            filteredRooms.map((room) => {
                                const isSelected = room.ID === currentActiveRoomId
                                return (
                                    <div
                                        key={room.ID}
                                        onClick={() => handleRoomSelect(room.ID)}
                                        className={cn(
                                            "w-full p-3 rounded-xl flex items-center gap-3.5 cursor-pointer transition-all duration-200 border relative group",
                                            isSelected
                                                ? "bg-gradient-to-r from-neutral-800/50 to-neutral-800/30 border-neutral-700/50 shadow-md text-white"
                                                : "bg-transparent border-transparent hover:bg-neutral-800/10 text-neutral-400 hover:text-neutral-200"
                                        )}
                                    >
                                        {isSelected && <div className="absolute left-0 top-3 bottom-3 w-0.5 bg-[#9aeb8e] rounded-r" />}

                                        <div className={cn(
                                            "w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border tracking-wider transition-colors shadow-sm",
                                            isSelected
                                                ? "bg-[#9aeb8e]/10 border-[#9aeb8e]/30 text-[#9aeb8e]"
                                                : "bg-[#131517] border-neutral-800/80 text-neutral-500 group-hover:border-neutral-700"
                                        )}>
                                            {(room.CoachID || "CH").substring(0, 2).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0 space-y-0.5">
                                            <span className="text-xs font-semibold block truncate">
                                                {room.CoachID ? `Consultant ${room.Coach?.Name || room.CoachID.substring(0, 8)}` : "Platform Advisory"}
                                            </span>
                                            <p className="text-[10px] text-neutral-500 font-mono tracking-tight truncate">SYSTEM_ID://{room.ID.substring(0, 6)}</p>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>

                {/* LIVE MESSAGING MAIN PANEL (8 Columns) */}
                <div className={cn(
                    "col-span-1 md:col-span-8 bg-[#1c1e22]/40 backdrop-blur-sm border border-neutral-800/20 rounded-2xl flex flex-col overflow-hidden shadow-lg relative",
                    !currentActiveRoomId && "hidden md:flex",
                    currentActiveRoomId && "flex"
                )}>
                    {children}
                </div>
            </div>
        </div>
    )
}
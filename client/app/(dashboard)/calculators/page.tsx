'use client'

import React, { useState } from 'react'
import { Sparkles, ArrowLeft, Bell, CheckCircle2, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function Page() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [isSubscribed, setIsSubscribed] = useState(false)

    const handleNotifyMe = (e: React.FormEvent) => {
        e.preventDefault()
        if (email.trim()) {
            setIsSubscribed(true)
            setEmail('')
        }
    }

    return (
        <div className="w-full h-[calc(100vh-120px)] flex items-center justify-center p-4">
            <div className="bg-neutral-800 border border-neutral-800/60 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl relative overflow-hidden space-y-6">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-[2px] bg-gradient-to-r from-transparent via-[#9aeb8e]/60 to-transparent" />
                <div className="mx-auto w-14 h-14 bg-[#9aeb8e]/5 border border-[#9aeb8e]/10 rounded-2xl flex items-center justify-center text-[#9aeb8e] shadow-inner relative group">
                    <Sparkles size={24} className="animate-pulse group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div className="space-y-2">
                    <h1 className="text-xl font-bold tracking-tight text-white">Feature Sprint in Progress</h1>
                    <p className="text-xs text-neutral-400 max-w-xs mx-auto leading-relaxed">
                        We are currently optimizing this analytical calculator engine to maximize your tracking velocity index. 
                    </p>
                </div>
                <div className="bg-[#131517] border border-neutral-800/40 rounded-xl p-3 text-left space-y-2">
                    <div className="flex items-center gap-2 text-[11px] text-neutral-500 font-medium uppercase tracking-wider">
                        <span>Expected Parameters</span>
                    </div>
                    <div className="space-y-1.5 text-xs">
                        <div className="flex items-center gap-2 text-neutral-300">
                            <ChevronRight size={12} className="text-[#9aeb8e]" />
                            <span>Dynamic projection algorithms</span>
                        </div>
                        <div className="flex items-center gap-2 text-neutral-400">
                            <ChevronRight size={12} className="text-neutral-600" />
                            <span>Automated velocity updates</span>
                        </div>
                    </div>
                </div>
                <div className="pt-2">
                    {!isSubscribed ? (
                        <form onSubmit={handleNotifyMe} className="flex flex-col gap-2">
                            <div className="relative w-full">
                                <input 
                                    type="email" 
                                    required
                                    placeholder="Enter your workspace email" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-[#131517] border border-neutral-800 rounded-lg text-xs px-3 py-2.5 text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-[#9aeb8e]"
                                />
                            </div>
                            <button 
                                type="submit"
                                className="w-full bg-[#9aeb8e] hover:bg-[#85cc7a] text-neutral-950 font-semibold text-xs py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-98 shadow-sm"
                            >
                                <Bell size={13} />
                                <span>Notify Me on Deployment</span>
                            </button>
                        </form>
                    ) : (
                        <div className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-lg flex items-center gap-2 text-emerald-400 text-xs text-left animate-in fade-in zoom-in-95 duration-200">
                            <CheckCircle2 size={16} className="flex-shrink-0" />
                            <span>Registration logged. We will notify you once this engine reaches production.</span>
                        </div>
                    )}
                </div>

                <div className="pt-2 border-t border-neutral-800/60 flex justify-center">
                    <button 
                        onClick={() => router.back()}
                        className="text-xs text-neutral-500 hover:text-neutral-300 flex items-center gap-1.5 transition-colors group"
                    >
                        <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
                        <span>Return to Workspace</span>
                    </button>
                </div>

            </div>
        </div>
    )
}
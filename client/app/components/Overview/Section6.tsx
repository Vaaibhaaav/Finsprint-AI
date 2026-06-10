"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { useDigestStore } from "@/store/digestStore"
import { BookOpen } from "lucide-react"

export default function Section6() {
    const router = useRouter()
    const { digests } = useDigestStore()

    const latestDigest = digests && digests.length > 0 ? digests[0] : null

    return (
        <div
            style={{
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            }}
            className="bg-neutral-800 backdrop-blur-md border border-[#1C1C1F] p-5 rounded-2xl h-full w-full text-xs antialiased select-none flex flex-col justify-between"
        >
            <div className="flex items-center gap-2 mb-2">
                <BookOpen size={16} className="text-[#6EE7B7]" />
                <h2 className="font-medium text-white text-[15px] tracking-tight">
                    Weekly Digest Snippet
                </h2>
            </div>

            <div className="my-auto py-2">
                {latestDigest ? (
                    <p className="text-[#A1A1AA] text-[13px] leading-relaxed tracking-wide line-clamp-3">
                        {latestDigest.Summary}
                    </p>
                ) : (
                    <p className="text-[#A1A1AA] text-[13px] leading-relaxed tracking-wide">
                        Discretionary spending is down <span className="text-white font-medium">8%</span> this week. Keep up the sprint velocity!
                    </p>
                )}
            </div>

            <div className="pt-1">
                <button 
                    onClick={() => router.push("/digests")}
                    className="text-[#6EE7B7] hover:text-[#34D399] font-medium text-[12px] transition-colors duration-200 cursor-pointer bg-transparent border-none p-0"
                >
                    View Full Digest
                </button>
            </div>
        </div>
    )
}
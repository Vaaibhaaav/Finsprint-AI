"use client"

import { GiftIcon, PiggyBank } from "lucide-react"
import React from "react"
import { useRouter } from "next/navigation"

type ItemType = {
    title: string
    description: string
    icon: React.ReactNode
    path: string
}

const CalculatorHubItems: ItemType[] = [
    {
        title: "Savings Sprint",
        description: "Calculate velocity and growth targets for your financial sprint goals.",
        icon: <PiggyBank size={16} className="text-[#A1A1AA]" />,
        path: "/calculators"
    },
    {
        title: "Dream Item Tracker",
        description: "Estimate how long it will take to purchase luxury and baseline products.",
        icon: <GiftIcon size={16} className="text-[#A1A1AA]" />,
        path: "/calculators"
    }
]

export default function Section2() {
    const router = useRouter()
    const [activeItem, setActiveItem] = React.useState(-1)

    return (
        <div 
            style={{
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            }}
            className="bg-neutral-800 backdrop-blur-md border border-[#1C1C1F] p-5 rounded-2xl h-full w-full text-xs antialiased select-none flex flex-col justify-between"
        >
            <div>
                <h2 className="font-medium text-white text-[15px] tracking-tight mb-3">
                    Calculator Hub
                </h2>
                
                <div className="flex flex-col gap-2">
                    {CalculatorHubItems.map((item, idx) => (
                        <div 
                            key={idx}
                            onClick={() => router.push(item.path)}
                            className={`flex flex-row p-3 items-center gap-3 rounded-xl transition-all duration-200 cursor-pointer ${
                                activeItem === idx 
                                    ? 'bg-neutral-700 opacity-90 border border-[#3F3F46]/30 shadow-md' 
                                    : 'border border-[#27272a]/30 bg-neutral-900/30'
                            }`} 
                            onMouseEnter={() => setActiveItem(idx)}
                            onMouseLeave={() => setActiveItem(-1)}
                        >
                            <div className="bg-[#131316] p-2.5 rounded-lg flex items-center justify-center shrink-0">
                                {item.icon}
                            </div>
                            <div className="flex flex-col gap-0.5 min-w-0">
                                <h3 className="font-medium text-white text-sm tracking-tight truncate">
                                    {item.title}
                                </h3>
                                <p className="text-[#71717A] text-[11px] leading-normal line-clamp-2">
                                    {item.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
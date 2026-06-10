'use client'

import { useUserStore } from "@/store/userStore"
import { useUser } from "@clerk/nextjs"
import {
    Home,
    TrendingUp,
    FileText,
    List,
    Plus,
    Target,
    LayoutGrid,
    Zap,
    Crown,
    BookOpen,
    Users,
    CalendarDays,
    Settings,
    Sparkles,
} from "lucide-react"
import { useRouter, usePathname } from "next/navigation"

const sidebarData = [
    {
        category: "Overview",
        items: [
            { label: "Dashboard", icon: Home, path: "/dashboard" },
            { label: "Analytics", icon: TrendingUp, path: "/analytics" },
        ],
    },
    {
        category: "TRANSACTIONS",
        items: [
            { label: "All Transactions", icon: List, path: "/transactions" },
        ],
    },
    {
        category: "GOALS",
        items: [
            { label: "Goal Overview", icon: Target, path: "/goals" },
            { label: "Add New Goal", icon: Plus, path: "/goals/new" },
        ],
    },
    {
        category: "AI-Features",
        items: [{ label: "Explore AI Features", icon: Sparkles, path: "/ai-features" }],
    },
    {
        category: "DIGESTS",
        items: [{ label: "Weekly Review", icon: BookOpen, path: "/digests" }],
    },
    {
        category: "COACHES",
        items: [
            { label: "View Coaches", icon: Users, path: "/coaches" },
        ],
    },
    {
        category: "SESSIONS",
        items: [{ label: "Upcoming Sessions", icon: CalendarDays, path: "/sessions" }],
    },
    
]

export default function SideBar({ changeActiveItem }: { changeActiveItem: (item: string) => void }) {
    const router = useRouter()
    const pathname = usePathname()
    const { user: clerkUser } = useUser();
    const { user: storeUser } = useUserStore();
    return (
        <div
            style={{
                width: "240px",
                height: "100vh",
                borderRight: "1px solid #1C1C1F",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                padding: "18px",
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                WebkitFontSmoothing: "antialiased",
                MozOsxFontSmoothing: "grayscale",
                userSelect: "none",
                boxSizing: "border-box",
                flexShrink: 0,
            }}
            className="bg-[#121417]"
        >
            <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "0 6px",
                        marginBottom: "20px",
                    }}
                >
                    <span style={{ color: "#9aeb8e", display: "flex", alignItems: "center" }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                        </svg>
                    </span>
                    <span style={{ color: "#ffffff", fontWeight: 700, fontSize: "20px", letterSpacing: "-0.5px" }}>
                        FinSprint
                    </span>
                </div>

                <button
                    onClick={() => {
                        if (clerkUser) {
                            router.push("/profile")
                        } else {
                            router.push("/sign-in")
                        }
                    }}
                    style={{
                        width: "100%",
                        backgroundColor: "transparent",
                        border: "1px solid #27272A",
                        color: "#D4D4D8",
                        fontSize: "11px",
                        fontWeight: 500,
                        padding: "6px 16px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        marginBottom: "24px",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1C1C1F")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                    {clerkUser ? "PROFILE" : "SIGN UP / LOGIN"}
                </button>

                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px",
                        overflowY: "auto",
                        scrollbarWidth: "none",
                        msOverflowStyle: "none",
                    }}
                >
                    {sidebarData.map(({ category, items }) => (
                        <div key={category} style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                            <span style={{ fontSize: "10px", fontWeight: 500, color: "#444449", letterSpacing: "0.08em", padding: "0 6px" }}>
                                {category}
                            </span>

                            {items.map((item) => {
                                const isActive = pathname === item.path || pathname.startsWith(item.path + "/")
                                const Icon = item.icon
                                return (
                                    <button
                                        key={item.label}
                                        onClick={() => {
                                            changeActiveItem(item.label)
                                            router.push(category.toLowerCase())
                                        }}
                                        style={{
                                            width: "100%",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "10px",
                                            padding: "6px 9px",
                                            borderRadius: "5px",
                                            border: "none",
                                            cursor: "pointer",
                                            backgroundColor: isActive ? "#bdf692" : "transparent",
                                            color: isActive ? "black" : "#A1A1AA",
                                            fontFamily: "inherit",
                                            fontSize: "13px",
                                            fontWeight: isActive ? 600 : 400,
                                            transition: "all 0.12s ease",
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isActive) {
                                                e.currentTarget.style.backgroundColor = "#1C1C1F"
                                                e.currentTarget.style.color = "#ffffff"
                                                const icon = e.currentTarget.querySelector(".nav-icon") as HTMLElement
                                                if (icon) icon.style.color = "#ffffff"
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isActive) {
                                                e.currentTarget.style.backgroundColor = "transparent"
                                                e.currentTarget.style.color = "#A1A1AA"
                                                const icon = e.currentTarget.querySelector(".nav-icon") as HTMLElement
                                                if (icon) icon.style.color = "#444449"
                                            }
                                        }}
                                    >
                                        <span
                                            className="nav-icon"
                                            style={{
                                                color: isActive ? "black" : "#444449",
                                                display: "flex",
                                                alignItems: "center",
                                                flexShrink: 0,
                                                transition: "color 0.12s",
                                            }}
                                        >
                                            <Icon size={15} strokeWidth={2} />
                                        </span>
                                        <span style={{ color: "inherit" }}>{item.label}</span>
                                    </button>
                                )
                            })}
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ paddingTop: "12px", borderTop: "1px solid #1C1C1F", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div 
                    onClick={() => router.push("/profile")}
                    style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}
                >
                    <div style={{ width: "26px", height: "26px", borderRadius: "50%", overflow: "hidden", border: "1px solid #27272A" }}>
                        <img
                            src={clerkUser?.imageUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"}
                            alt="Profile"
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                    </div>
                    <span style={{ color: "#E4E4E7", fontSize: "11px", fontWeight: 500 }}>
                        {clerkUser?.fullName}
                    </span>
                </div>

                <button
                    onClick={() => router.push("/profile")}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#444449", display: "flex", padding: "2px" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#A1A1AA")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#444449")}
                    aria-label="Settings"
                >
                    <Settings size={15} strokeWidth={2} />
                </button>
            </div>
        </div>
    )
}
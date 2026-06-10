'use client'
import { useState } from "react"
import SideBar from "../components/Dashboard/SideBar"
import TopBar from "../components/Overview/TopBar"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [activeItem, setActiveItem] = useState("Overview")
    const changeActiveItem = (item: string) => {
        setActiveItem(item)
    }

    return (

        <div
            style={{
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            }}
            className="flex flex-row w-screen h-screen overflow-hidden bg-[#121417] text-white">
            <SideBar changeActiveItem={changeActiveItem} />
            <main className="flex-1 min-w-0 flex flex-col h-full p-2">
                <TopBar />
                <div className="flex-1 overflow-y-auto">
                    {children}
                </div>
            </main>
        </div>
    )
}
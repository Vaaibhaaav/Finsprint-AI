"use client"

import React, { useEffect } from "react"
import Section1 from "@/app/components/Overview/Section1"
import Section2 from "@/app/components/Overview/Section2"
import Section3 from "@/app/components/Overview/Section3"
import Section4 from "@/app/components/Overview/Section4"
import Section5 from "@/app/components/Overview/Section5"
import Section6 from "@/app/components/Overview/Section6"
import { useUserStore } from "@/store/userStore"
import { useTransactionStore } from "@/store/transactionStore"
import { useGoalsStore } from "@/store/goalsStore"
import { useSessionStore } from "@/store/sessionStore"
import { useDigestStore } from "@/store/digestStore"
import { useApi } from "@/lib/api"

export default function Page() {
    const api = useApi()
    const { fetchUser } = useUserStore()
    const { fetchAllTransactionsForUser } = useTransactionStore()
    const { fetchGoals } = useGoalsStore()
    const { getSessionsForUser } = useSessionStore()
    const { getDigests } = useDigestStore()

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                await Promise.all([
                    fetchUser(api),
                    fetchAllTransactionsForUser(api),
                    fetchGoals(api),
                    getSessionsForUser(api),
                    getDigests(api)
                ])
            } catch (err) {
                console.error("Error fetching overview data:", err)
            }
        }
        loadDashboardData()
    }, [api])

    return (
        <div className="text-white w-full p-4 flex flex-col gap-4 bg-[#131316] h-full overflow-hidden">

            <div className="grid grid-cols-3 grid-rows-3 gap-4 flex-1 min-h-0">

                <div className="col-span-2 row-span-2 min-h-0">
                    <Section1 />
                </div>

                <div className="col-span-1 min-h-0">
                    <Section5 />
                </div>

                <div className="col-span-1 min-h-0">
                    <Section4 />
                </div>


                <div className="col-span-1 min-h-0">
                    <Section2 />
                </div>

                <div className="col-span-1 min-h-0">
                    <Section3 />
                </div>

                <div className="col-span-1 min-h-0">
                    <Section6 />
                </div>

            </div>
        </div>
    )
}   
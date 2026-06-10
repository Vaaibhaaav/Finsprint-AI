"use client"

import { useEffect } from "react"
import { useUserStore } from "@/store/userStore"
import { useApi } from "@/lib/api"

export default function UserInitializer({ children }: { children: React.ReactNode }) {
  const { fetchUser } = useUserStore()
  const api = useApi()

  useEffect(() => {
    fetchUser(api)
  }, [fetchUser, api]) 

  return <>{children}</>
}
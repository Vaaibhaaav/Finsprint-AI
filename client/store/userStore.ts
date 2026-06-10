import { create } from "zustand"
import { persist } from "zustand/middleware"
import { User } from "@/types/types"

interface UserStore {
    user: User | null
    setUser: (user: User | null) => void
    clearUser: () => void
    fetchUser: (api: any) => Promise<void>
}

export const useUserStore = create<UserStore>()(
    persist(
        (set) => ({
            user: null,
            setUser: (user) => set({ user }),
            clearUser: () => set({ user: null }),
            fetchUser: async (api: any) => {
                const response = await api.get("/api/v1/user/user-details")
                set({ user: response.data })
            },
        }),
        {
            name: "user-storage",
            partialize: (state) => ({ user: state.user }),
        }
    )
)
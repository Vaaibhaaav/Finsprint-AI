import { AvailabilitySlot, AvailabilitySlotRequest, CoachRequest, CoachType } from "@/types/types"
import { create } from "zustand"

type CoachesStore = {
    loading: boolean
    err: string | null
    coaches: CoachType[] | null
    selectedCoach: CoachType | null
    setSelectedCoach: (coach: CoachType | null) => void
    fetchCoaches: (api: any) => Promise<void>
    availabiltySlots: AvailabilitySlot[] | null
    fetchAvailabiltySlots: (coachId: string, api: any) => Promise<void>
    RegisterAsCoach: (request: CoachRequest, api: any) => Promise<void>
    postAvailabiltySlot: (request: AvailabilitySlotRequest, api: any) => Promise<void>
}

export const useCoachesStore = create<CoachesStore>()((set) => ({
    loading: false,
    err: null,
    coaches: null,
    selectedCoach: null,

    setSelectedCoach: (coach) => set({ selectedCoach: coach }),

    fetchCoaches: async (api) => {
        set({ loading: true, err: null })
        try {
            const response = await api.get("/api/v1/coach")
            const coachesData = response.data.data || response.data

            set({ coaches: coachesData, loading: false })
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || "Failed to fetch coaches"
            set({ err: errorMsg, loading: false })
        }
    },

    RegisterAsCoach: async (request, api) => {
        set({ loading: true, err: null })
        try {
            const response = await api.post("/api/v1/coach", request)
            const newCoach = response.data.data || response.data

            set((state) => ({
                coaches: state.coaches ? [...state.coaches, newCoach] : [newCoach],
                loading: false,
            }))
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || "Registration failed"
            set({ err: errorMsg, loading: false })
            throw error
        }
    },
    availabiltySlots: null,
    postAvailabiltySlot: async (request, api) => {
        set({ loading: true, err: null })
        try {
            const response = await api.post("/api/v1/coach/availability_slots", request)
            set({ loading: false })
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || "Failed to post availabilty slot"
            set({ err: errorMsg, loading: false })
        }
    },
    fetchAvailabiltySlots: async (coachId: string, api) => {
        set({ loading: true, err: null })
        try {
            const response = await api.get(`/api/v1/coach/availability_slots/${coachId}`)
            const availabiltySlotsData = response.data.data || response.data

            set({ availabiltySlots: availabiltySlotsData, loading: false })
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || "Failed to fetch availabilty slots"
            set({ err: errorMsg, loading: false })
        }
    },
}))
import { create } from "zustand"
import { persist } from "zustand/middleware"
import { Digests } from "../types/types"

interface DigestStore {
    generatingDigest: boolean
    err: string | null
    digests: Digests[]
    selectedDigest: Digests | null
    getDigests: (api: any) => Promise<void>
    generateNewDigest: (api: any) => Promise<void>
    setSelectedDigest: (digest: Digests | null) => void
}

export const useDigestStore = create<DigestStore>()(
    persist(
        (set) => ({
            generatingDigest: false,
            err: null,
            digests: [],
            selectedDigest: null,
            getDigests: async (api: any) => {
                set({ generatingDigest: true })
                try {
                    const response = await api.get("/api/v1/digests")
                    const data = response.data
                    set({ digests: data })
                } catch (error) {
                    set({ err: "Failed to fetch digests" })
                } finally {
                    set({ generatingDigest: false })
                }
            },
            setSelectedDigest: (digest: Digests | null) => {
                set({ selectedDigest: digest })
            },
            generateNewDigest: async (api: any) => {
                set({ generatingDigest: true })
                try {
                    const response = await api.get("/api/v1/digest/generate")
                    const data = await response.json()
                    set({ digests: [...data.digests, data.digest] })
                } catch (error) {
                    set({ err: "Failed to generate digest" })
                } finally {
                    set({ generatingDigest: false })
                }
            },
        }),
        {
            name: "digests",
            partialize(state) {
                return {
                    generatingDigest: state.generatingDigest,
                }
            },
        }
    )
)

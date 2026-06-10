import { create } from "zustand"
import { persist } from "zustand/middleware"
import {
    SessionRequest, Session
} from "@/types/types"

interface SessionStore {
    loading: boolean
    err: string
    sessions: Session[] | null
    setSessionData: (sessions: Session[]) => void
    selectedSession: Session | null
    bookSessionRequest: (bookRequest: SessionRequest, api: any) => Promise<void>
    getSessionsForUser: (api: any) => Promise<void>
    getSessionsForCoach: (api: any) => Promise<void>
    handleSessionActionCoach: (sessionId: string, action: "accepted" | "rejected", api: any) => Promise<void>
}

export const useSessionStore = create<SessionStore>()(
    persist(
        (set) => ({
            loading: false,
            err: "",
            selectedSession: null,
            sessions: null,
            bookSessionRequest: async (bookRequest: SessionRequest, api: any) => {
                set({ loading: true })
                try {
                    const sessionPayload = {
                        stripe_payment_id: bookRequest.StripePaymentId,
                    };
                    const response = await api.post(`/api/v1/session?coach_id=${bookRequest.CoachId}&slot_id=${bookRequest.SlotId}`, sessionPayload);
                    set((state) => ({ sessions: [...(state.sessions || []), response.data] }))
                } catch (error) {
                    set({ err: error as string })
                } finally {
                    set({ loading: false })
                }
            },
            setSessionData: (sessions: Session[]) => {
                set({ sessions })
            },
            getSessionsForUser: async (api: any) => {
                set({ loading: true })
                try {
                    const response = await api.get(`/api/v1/user/sessions`)
                    set({ sessions: response.data.data })
                } catch (error) {
                    set({ err: error as string })
                } finally {
                    set({ loading: false })
                }
            },
            getSessionsForCoach: async (api: any) => {
                set({ loading: true })
                try {
                    const response = await api.get(`/api/v1/coach/sessions`)
                    console.log(response)
                    set({ sessions: response.data.data })
                } catch (error) {
                    set({ err: error as string })
                } finally {
                    set({ loading: false })
                }
            },
            handleSessionActionCoach: async (sessionId: string, action: "accepted" | "rejected", api: any) => {
                try {
                    const handlePayload = {
                        session_id: sessionId,
                        status: action
                    };

                    const response = await api.post(`/api/v1/coach/session/handleActions`, handlePayload);

                    set((state) => {
                        const currentData = Array.isArray(state.sessions) ? state.sessions : [];
                        const updatedData = currentData.map((session: any) =>
                            session.ID === sessionId ? { ...session, Status: action } : session
                        );
                        return { sessions: updatedData };
                    });
                } catch (error) {
                    console.error("Failed to update session status:", error);
                }
            },
        }),
        {
            name: "session-storage",
        }
    )
)
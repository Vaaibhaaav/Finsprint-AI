import { create } from "zustand"
import { persist } from "zustand/middleware"

// Helper to parse message field safely into a string to prevent React child render errors
const parseMessageContent = (message: any): string => {
    if (!message) return ""
    if (typeof message === "string") return message
    if (Array.isArray(message)) {
        return message
            .map((msgItem: any) => {
                if (typeof msgItem === "string") return msgItem
                if (msgItem && typeof msgItem === "object") {
                    return msgItem.text || msgItem.content || ""
                }
                return ""
            })
            .filter(Boolean)
            .join("\n")
    }
    if (typeof message === "object") {
        return message.text || message.content || ""
    }
    return ""
}

export interface Citation {
    card_name: string
    bank: string
    offer_or_deal: string
    source_url: string
}

export interface BaseMessage {
    id: string
    role: "user" | "assistant" | "system"
    content: string
    citations?: Citation[]
}

export interface Anomaly {
    type: string
    subtype: string
    merchant: string
    amount?: number
    monthly_amount?: number
    previous_amount?: number
    annual_cost?: number
    charge_count?: number
    category?: string
    severity: "high" | "medium" | "low"
    first_charge_date?: string
    second_charge_date?: string
    transaction_date?: string
    explanation: string
    action: string
    rupee_impact?: number
}

export interface InsightsData {
    anomalies: Anomaly[]
    insights: string
}

export interface CardRewardBreakdown {
    category: string
    card_category: string
    monthly_spend: number
    rate: number
    monthly_reward: number
}

export interface CreditCardInfo {
    card_id: string
    name: string
    issuer: string
    tier: string
    image_url: string
    annual_fee: number
    card_network: string
    estimated_monthly_reward: number
    net_annual_value: number
    final_ranking_score: number
    milestone_bonus_earned: number
    intent_boost_applied: number
    category_rewards: CardRewardBreakdown[]
    key_perks: string[]
    reward_type: string
    description: string
    welcome_benefits?: {
        description?: string
        bonus_points?: number
    } | string
    why_for_you?: string
}

export interface MissedReward {
    merchant: string
    amount: number
    date: string
    category: string
    reward_earned: number
    what_you_missed: string
}

export interface OptimizerData {
    top_pick: CreditCardInfo | null
    runner_ups: CreditCardInfo[]
    missed_rewards: MissedReward[]
    summary: string
}

export type GoEnvelopeStatus = "success" | "gated_fallback" | "internal_error" | null

interface AiFeaturesStore {
    isLoading: boolean
    currentError: string | null
    insightsData: InsightsData | null
    optimizerData: OptimizerData | null
    researchMessages: BaseMessage[]
    goEnvelopeStatus: GoEnvelopeStatus
    lastInsightsCallTimestamp: number | null
    lastCardOptimizerCallTimestamp: number | null
    
    setLoading: (loading: boolean) => void
    setError: (error: string | null) => void
    clearInsights: () => void
    clearOptimizer: () => void
    resetResearch: () => void
    
    uploadAndFetchInsights: (
        file: File, 
        api: any
    ) => Promise<void>
    
    calculateOptimizedCards: (
        userContextPrompt: string, 
        userProfile: any, 
        api: any
    ) => Promise<void>
    
    sendLiveResearchMessage: (
        userMessageText: string, 
        userProfile: any, 
        api: any
    ) => Promise<void>
}

export const useAiFeaturesStore = create<AiFeaturesStore>()(
    persist(
        (set, get) => ({
            isLoading: false,
            currentError: null,
            insightsData: null,
            optimizerData: null,
            researchMessages: [
                {
                    id: "system-welcome",
                    role: "assistant",
                    content: "Welcome to your Live Research Assistant. Ask me anything about card benefits, reward strategies, or live bank offers in India. I will personalize my recommendations using your financial goals and transactions profile."
                }
            ],
            goEnvelopeStatus: null,
            lastInsightsCallTimestamp: null,
            lastCardOptimizerCallTimestamp: null,

            setLoading: (loading) => set({ isLoading: loading }),
            setError: (error) => set({ currentError: error }),
            clearInsights: () => set({ insightsData: null }),
            clearOptimizer: () => set({ optimizerData: null }),
            resetResearch: () => set({
                researchMessages: [
                    {
                        id: "system-welcome",
                        role: "assistant",
                        content: "Welcome to your Live Research Assistant. Ask me anything about card benefits, reward strategies, or live bank offers in India. I will personalize my recommendations using your financial goals and transactions profile."
                    }
                ],
                goEnvelopeStatus: null,
                currentError: null
            }),

           uploadAndFetchInsights: async (file, api) => {
            const lastCall = get().lastInsightsCallTimestamp
            const tenDaysInMs = 10 * 24 * 60 * 60 * 1000
            if (lastCall && Date.now() - lastCall < tenDaysInMs) {
                const daysLeft = Math.ceil((tenDaysInMs - (Date.now() - lastCall)) / (24 * 60 * 60 * 1000))
                const errorMsg = `You have already analyzed a statement recently. Please wait ${daysLeft} more day${daysLeft > 1 ? "s" : ""} before running statement analysis again.`
                set({ currentError: errorMsg })
                return
            }

            set({ isLoading: true, currentError: null, goEnvelopeStatus: null })
            try {
                const base64String = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader()
                    reader.onload = () => {
                        const result = reader.result as string
                        const base64 = result.split(",")[1] || result
                        resolve(base64)
                    }
                    reader.onerror = (error) => reject(error)
                    reader.readAsDataURL(file)
                })

                const payload = {
                    message: "Analyze this uploaded statement for anomalies and insights",
                    Transactions: base64String 
                }

                const response = await api.post("/api/v1/ai/handle_insights", payload)
                const responseData = response.data

                if (responseData.status === "success" && responseData.payload) {
                    set({
                        insightsData: {
                            anomalies: responseData.payload.anomalies || [],
                            insights: responseData.payload.insights || "Anomalies lookup completed."
                        },
                        goEnvelopeStatus: "success",
                        isLoading: false,
                        lastInsightsCallTimestamp: Date.now()
                    })
                } else if (responseData.status === "internal_error") {
                    set({
                        currentError: responseData.message || "AI pipeline exception.",
                        goEnvelopeStatus: "internal_error",
                        isLoading: false
                    })
                } else {
                    set({
                        insightsData: null,
                        goEnvelopeStatus: responseData.status || "success",
                        isLoading: false
                    })
                }
            } catch (error: any) {
                const errorMsg = error.response?.data?.error || error.message || "Failed to process statement insights"
                set({
                    currentError: errorMsg,
                    goEnvelopeStatus: "internal_error",
                    isLoading: false
                })
            }
        },

    calculateOptimizedCards: async (userContextPrompt, userProfile, api) => {
        const lastCall = get().lastCardOptimizerCallTimestamp
        const oneDayInMs = 24 * 60 * 60 * 1000
        if (lastCall && Date.now() - lastCall < oneDayInMs) {
            const timeDiff = oneDayInMs - (Date.now() - lastCall)
            const hoursLeft = Math.floor(timeDiff / (60 * 60 * 1000))
            const minutesLeft = Math.ceil((timeDiff % (60 * 60 * 1000)) / (60 * 1000))
            let timeMsg = ""
            if (hoursLeft > 0) {
                timeMsg = `${hoursLeft} hour${hoursLeft > 1 ? "s" : ""} and ${minutesLeft} minute${minutesLeft > 1 ? "s" : ""}`
            } else {
                timeMsg = `${minutesLeft} minute${minutesLeft > 1 ? "s" : ""}`
            }
            const errorMsg = `You have already optimized your cards recently. Please wait ${timeMsg} before running card optimization again.`
            set({ currentError: errorMsg })
            return
        }

        set({ isLoading: true, currentError: null })
        try {
            const payload = {
                message: userContextPrompt || "",
                // user_profile: {
                //     user: {
                //         id: userProfile.user?.Id || "",
                //         name: userProfile.user?.Name || "",
                //         email: userProfile.user?.Email || ""
                //     },
                //     transactions: (userProfile.transactions || []).map((t: any) => ({
                //         ID: t.ID || "",
                //         Amount: Number(t.Amount) || 0,
                //         TransactionType: t.Type || "",
                //         Merchant: t.Merchant || "",
                //         Category: t.Category || "",
                //         Description: t.Description || "",
                //         Motive: t.Motive || ""
                //     })),
                //     goals: (userProfile.goals || []).map((g: any) => ({
                //         ID: g.ID || "",
                //         Description: g.Description || "",
                //         TargetAmount: Number(g.TargetAmount) || 0,
                //         Deadline: g.Deadline ? g.Deadline.split("T")[0] : "",
                //         WeeklyTarget: Number(g.WeeklyTarget) || 0,
                //         SavedAmount: Number(g.SavedAmount) || 0
                //     }))
                // }
            }

            const response = await api.post("/api/v1/ai/card_optimizer", payload)
            const responseData = response.data

            if (responseData.status === "success" && responseData.payload) {
                const payloadData = responseData.payload
                const cardData = payloadData.card_data || []
                const topPick = payloadData.top_pick || (cardData.length > 0 ? cardData[0] : null)
                const runnerUps = payloadData.runner_ups || (cardData.length > 1 ? cardData.slice(1) : [])
                const summaryText = payloadData.insights || payloadData.summary || ""

                set({
                    optimizerData: {
                        top_pick: topPick,
                        runner_ups: runnerUps,
                        missed_rewards: payloadData.missed_rewards || [],
                        summary: summaryText
                    },
                    lastCardOptimizerCallTimestamp: Date.now(),
                    goEnvelopeStatus: "success",
                    isLoading: false
                })
            } else if (responseData.status === "internal_error") {
                set({
                    currentError: responseData.message || "Optimisation processing failed.",
                    goEnvelopeStatus: "internal_error",
                    isLoading: false
                })
            } else {
                set({
                    optimizerData: null,
                    goEnvelopeStatus: responseData.status,
                    isLoading: false
                })
            }
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || error.message || "Failed to calculate card rewards optimization"
            set({
                currentError: errorMsg,
                goEnvelopeStatus: "internal_error",
                isLoading: false
            })
        }
    },

    sendLiveResearchMessage: async (userMessageText, userProfile, api) => {
        if (!userMessageText.trim()) return

        const userMsgId = `user-${Date.now()}`
        const userMsg: BaseMessage = {
            id: userMsgId,
            role: "user",
            content: userMessageText
        }

        const currentMessages = get().researchMessages
        set({
            researchMessages: [...currentMessages, userMsg],
            isLoading: true,
            currentError: null,
            goEnvelopeStatus: null
        })

        try {
            const historyPayload = get().researchMessages.map(msg => ({
                role: msg.role === "assistant" ? "assistant" : "user",
                content: msg.content
            }))

            const payload = {
                message: userMessageText,
                history: historyPayload, 
            }

            const response = await api.post("/api/v1/ai/research", payload)
            const responseData = response.data

            if (responseData.status === "gated_fallback") {
                set({
                    goEnvelopeStatus: "gated_fallback",
                    currentError: parseMessageContent(responseData.message) || "Gating Failure: Missing financial transaction/goals context.",
                    isLoading: false
                })
            } else if (responseData.status === "success") {
                const assistantMsgId = `assistant-${Date.now()}`
                
                // Parse citations if they exist
                let citations: Citation[] | undefined = undefined
                if (responseData.payload && responseData.payload.live_results) {
                    citations = responseData.payload.live_results.map((res: any) => ({
                        card_name: res.card_name || "Card Info",
                        bank: res.bank || "Partner Bank",
                        offer_or_deal: res.offer_or_deal || res.content || "",
                        source_url: res.source_url || res.source || "#"
                    }))
                }

                const assistantMsg: BaseMessage = {
                    id: assistantMsgId,
                    role: "assistant",
                    content: parseMessageContent(responseData.message) || responseData.payload?.insights || "",
                    citations
                }

                set({
                    researchMessages: [...get().researchMessages, assistantMsg],
                    goEnvelopeStatus: "success",
                    isLoading: false
                })
            } else {
                set({
                    goEnvelopeStatus: responseData.status,
                    currentError: parseMessageContent(responseData.message) || "Conversation query failed.",
                    isLoading: false
                })
            }
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || error.message || "Failed to send research message"
            set({
                currentError: errorMsg,
                goEnvelopeStatus: "internal_error",
                isLoading: false
            })
        }
    }
        }),
        {
            name: "ai-features-storage",
            partialize: (state) => ({
                insightsData: state.insightsData,
                lastInsightsCallTimestamp: state.lastInsightsCallTimestamp,
                optimizerData: state.optimizerData,
                lastCardOptimizerCallTimestamp: state.lastCardOptimizerCallTimestamp
            })
        }
    )
)

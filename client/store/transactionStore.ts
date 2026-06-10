import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { CreateTransactionRequest, TransactionType } from "@/types/types"
import axios from "axios"

interface TransactionStore {
    activeTransaction: TransactionType | null
    loading: boolean
    err: string | null
    setActiveTransaction: (transaction: TransactionType | null) => void
    transactions: TransactionType[]
    setTransactions: (transactions: TransactionType[]) => void
    fetchAllTransactionsForUser: (api: any) => Promise<void>
    postNewTransaction: (newTransaction: CreateTransactionRequest, api: any) => Promise<void>
    deleteTransaction: (transactionId: string, api: any) => Promise<void>
}

export const useTransactionStore = create<TransactionStore>()(
    persist(
        (set, get) => ({
            activeTransaction: null,
            loading: false,
            err: null,
            transactions: [],

            setActiveTransaction: (transaction) => set({ activeTransaction: transaction }),
            setTransactions: (transactions) => set({ transactions }),

            fetchAllTransactionsForUser: async (api) => {
                set({ loading: true, err: null })
                try {
                    const response = await api.get("/api/v1/transactions")
                    if (response.status === 200 && response.data) {
                        set({ transactions: response.data, loading: false })
                    } else {
                        set({ transactions: [], loading: false })
                    }
                } catch (error: any) {
                    const fallbackErr = error.response?.data?.error || error.message || "Failed to fetch transactions"
                    set({ err: fallbackErr, loading: false })
                }
            },

            postNewTransaction: async (newTransaction, api) => {
                set({ loading: true, err: null })
                try {
                    const response = await api.post("/api/v1/transactions", newTransaction)

                    if (response.status === 200 || response.status === 201) {
                        const newTx = response.data.data
                        set({
                            transactions: [...get().transactions, newTx],
                            loading: false
                        })
                    }
                } catch (error: any) {
                    const fallbackErr = error.response?.data?.error || error.message || "Failed to create transaction"
                    set({ err: fallbackErr, loading: false })
                }
            },

            deleteTransaction: async (transactionId, api) => {
                set({ loading: true, err: null })
                try {
                    const response = await api.delete(`/api/v1/transactions/${transactionId}`)
                    const updatedTransactions = get().transactions.filter(t => t.ID !== transactionId)
                    set({ transactions: updatedTransactions, loading: false })
                } catch (error: any) {
                    const fallbackErr = error.response?.data?.error || error.message || "Failed to delete transaction"
                    set({ err: fallbackErr, loading: false })
                }
            }
        }),
        {
            name: "transaction-storage",
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                activeTransaction: state.activeTransaction
            }),
        }
    )
)
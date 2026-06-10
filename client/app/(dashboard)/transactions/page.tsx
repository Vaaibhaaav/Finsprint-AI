'use client'

import React, { useEffect, useState } from "react"
import { Plus, Upload, Calendar as CalendarIcon, Search, Pencil, Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, SlidersHorizontal, DollarSign, X, ShoppingBag } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { CreateTransactionRequest, type, TransactionIdentifier } from "@/types/types"
import { useTransactionStore } from "@/store/transactionStore"
import { useApi } from "@/lib/api"
import { TransactionDetailDialog } from "@/app/components/Transaction/transactionDetailDialog"


export default function TransactionsPage() {
    const [search, setSearch] = useState("")
    const [addTransaction, setAddTransaction] = useState(false)
    const [deleting, setDeleting] = useState(false);
    const { activeTransaction, transactions, setActiveTransaction, deleteTransaction, loading, fetchAllTransactionsForUser, postNewTransaction } = useTransactionStore()
    const api = useApi()
    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                await fetchAllTransactionsForUser(api)
            } catch (error) {
                console.error("Failed to retrieve auth token:", error)
            }
        }
        fetchTransactions()
        return () => {
            setActiveTransaction(null)
        }
    }, [])

    console.log("FETCH TRANSACTIONS", transactions)

    if (addTransaction) {
        return <AddNewTransaction isOpen={addTransaction} postNewTransaction={postNewTransaction} onClose={() => setAddTransaction(false)} />
    }

    if (activeTransaction) {
        return (
            <TransactionDetailDialog
                transaction={activeTransaction}
                onClose={() => setActiveTransaction(null)}
            />
        )
    }


    return (
        <div className="relative w-full h-full space-y-4 text-slate-200">
            <div className="bg-[#1c1e22] border border-neutral-800/40 rounded-xl flex flex-row justify-between p-4 items-center shadow-md">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight text-white">Transactions Hub</h1>
                </div>
                <div className="flex items-center gap-3">
                    <button className="hover:bg-[#85cc7a] bg-[#9aeb8e] text-neutral-950 font-medium text-xs px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all duration-200 active:scale-95 shadow-sm"
                        onClick={() => setAddTransaction(true)}
                    >
                        <Plus size={16} strokeWidth={2.5} />
                        <span>Add New Transaction</span>
                    </button>
                    <button className="hover:bg-neutral-700 bg-neutral-800 text-neutral-300 font-medium text-xs px-4 py-2.5 rounded-lg flex items-center gap-2 border border-neutral-700/60 transition-all duration-200 active:scale-95">
                        <Upload size={16} />
                        <span>Bulk Import Transactions</span>
                    </button>
                </div>
            </div>

            <div className="bg-[#1c1e22] border border-neutral-800/40 rounded-xl p-5 shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">

                    <div className="space-y-1.5">
                        <label className="text-xs text-neutral-400 font-medium tracking-wide">Date Range</label>
                        <DatePicker />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs text-neutral-400 font-medium tracking-wide">Category</label>
                        <select className="w-full bg-[#131517] border border-neutral-800 rounded-lg text-sm px-3 py-2 text-neutral-300 focus:outline-none focus:ring-1 focus:ring-[#9aeb8e] appearance-none cursor-pointer">
                            <option>Groceries, Tech, Utilities...</option>
                            <option>Income</option>
                            <option>Cloud Services</option>
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs text-neutral-400 font-medium tracking-wide">Account</label>
                        <select className="w-full bg-[#131517] border border-neutral-800 rounded-lg text-sm px-3 py-2 text-neutral-300 focus:outline-none focus:ring-1 focus:ring-[#9aeb8e] appearance-none cursor-pointer">
                            <option>Checking, Stripe</option>
                            <option>Chase Checking</option>
                            <option>Stripe Account</option>
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs text-neutral-400 font-medium tracking-wide">Description/Amount</label>
                        <div className="relative w-full">
                            <input
                                type="text"
                                placeholder="Search"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-[#131517] border border-neutral-800 rounded-lg text-sm pl-3 pr-9 py-2 text-neutral-300 focus:outline-none focus:ring-1 focus:ring-[#9aeb8e] placeholder:text-neutral-600"
                            />
                            <Search className="absolute right-3 top-2.5 text-neutral-600" size={16} />
                        </div>
                    </div>

                </div>
            </div>

            <div className="bg-[#1c1e22] border border-neutral-800/40 rounded-xl shadow-md overflow-hidden">
                <div className="p-4 border-b border-neutral-800/60">
                    <h2 className="text-md font-medium text-white flex items-center gap-2">
                        <SlidersHorizontal size={16} className="text-neutral-400" />
                        Transactions Table
                    </h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-neutral-800 text-[11px] uppercase tracking-wider text-neutral-400 bg-[#17191c]">
                                <th className="py-3 px-4 font-medium cursor-pointer hover:text-white">Date ▲</th>
                                <th className="py-3 px-4 font-medium">Merchant</th>
                                <th className="py-3 px-4 font-medium cursor-pointer hover:text-white">AI Marked Risky</th>
                                <th className="py-3 px-4 font-medium cursor-pointer hover:text-white">Category</th>
                                <th className="py-3 px-4 font-medium cursor-pointer hover:text-white">Type</th>
                                <th className="py-3 px-4 font-medium cursor-pointer hover:text-white text-right">Amount</th>
                                <th className="py-3 px-4 font-medium text-center">Transaction Identifier</th>
                                <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800/50 text-sm">
                            {transactions?.map((tx, idx) => (
                                <tr key={idx}
                                    onClick={() => {
                                        if (!deleting) {
                                            setActiveTransaction(tx)
                                        }
                                    }}
                                    className={`${tx.RiskFlag ? 'bg-red-900/20' : 'hover:bg-neutral-800/20'}  transition-colors group`}>
                                    <td className="py-3 px-4 text-neutral-400 whitespace-nowrap">{tx?.Date ? new Date(tx.Date).toLocaleDateString() : "—"}</td>

                                    <td className="py-3 px-4">
                                        <div className="flex items-center">
                                            {tx.Merchant}
                                        </div>
                                    </td>

                                    <td className="py-3 px-4 text-neutral-200 font-medium">{tx.RiskFlag ? "Risky" : "Not Risky"}</td>

                                    <td className="py-3 px-4">
                                        <span className={cn(
                                            "text-xs px-2 py-0.5 rounded font-medium",
                                            tx.Category === "Income" ? "text-emerald-400 bg-emerald-500/10" : "text-neutral-400 bg-neutral-800"
                                        )}>
                                            {tx.Category}
                                        </span>
                                    </td>

                                    <td className="py-3 px-4 text-neutral-400">{tx.Type}</td>

                                    <td className={cn(
                                        "py-3 px-4 text-right font-semibold whitespace-nowrap",
                                        tx.Type === "expense" ? "text-red-500" : "text-green-500"
                                    )}>
                                        {tx.Type === "expense" ? `-$${Math.abs(Number(tx.Amount)).toFixed(2)}` : `+$${Number(tx.Amount).toFixed(2)}`}
                                    </td>

                                    <td className="py-3 px-4 text-center">
                                        <span className={cn(
                                            "inline-block px-2 py-0.5 rounded-full text-[11px] font-medium tracking-wide",
                                            tx.TransactionIdentifier === "impulsive" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400 animate-pulse"
                                        )}>
                                            {tx.TransactionIdentifier}
                                        </span>
                                    </td>

                                    <td className="py-3 px-4 text-right opacity-40 group-hover:opacity-100 transition-opacity">
                                        <div className="flex justify-end gap-2">
                                            <button className="p-1 hover:text-[#9aeb8e] transition-colors">
                                                <Pencil size={14} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setDeleting(true)
                                                    deleteTransaction(tx.ID as string, api)
                                                }}
                                                className="p-1 hover:text-red-400 transition-colors">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="bottom-0 p-4 border-t border-neutral-800 flex items-center justify-between bg-[#17191c]">
                    <span className="text-xs text-neutral-500">Showing 1-{Math.min(9, transactions?.length || 0)} of {transactions?.length} transactions</span>
                    <div className="flex items-center gap-1">
                        <button className="p-1.5 rounded bg-neutral-800 text-neutral-500 cursor-not-allowed"><ChevronsLeft size={14} /></button>
                        <button className="p-1.5 rounded bg-neutral-800 text-neutral-500 cursor-not-allowed"><ChevronLeft size={14} /></button>
                        <button className="px-2.5 py-1 text-xs rounded font-medium bg-[#9aeb8e] text-black">1</button>
                        <button className="px-2.5 py-1 text-xs rounded font-medium bg-neutral-800 text-neutral-400 hover:text-white transition-colors">2</button>
                        <button className="px-2.5 py-1 text-xs rounded font-medium bg-neutral-800 text-neutral-400 hover:text-white transition-colors">3</button>
                        <button className="p-1.5 rounded bg-neutral-800 text-neutral-400 hover:text-white transition-colors"><ChevronRight size={14} /></button>
                        <button className="p-1.5 rounded bg-neutral-800 text-neutral-400 hover:text-white transition-colors"><ChevronsRight size={14} /></button>
                    </div>
                </div>
            </div>
        </div>
    )
}

function DatePicker() {
    const [date, setDate] = React.useState<Date>()

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "w-full justify-start text-left font-normal bg-[#131517] border-neutral-800 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-lg h-9",
                        !date && "text-neutral-500"
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4 text-neutral-500" />
                    {date ? format(date, "PPP") : <span>Date Range</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-[#1c1e22] border border-neutral-800" align="start">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="bg-[#1c1e22] text-slate-200 rounded-lg p-2"
                />
            </PopoverContent>
        </Popover>
    )
}

interface AddNewTransactionProps {
    isOpen: boolean
    onClose: () => void
    postNewTransaction: (newTransaction: CreateTransactionRequest, api: any) => Promise<void>
}

export function AddNewTransaction({ isOpen, onClose, postNewTransaction }: AddNewTransactionProps) {
    const [description, setDescription] = useState("")
    const [amount, setAmount] = useState("")
    const [merchantName, setMerchantName] = useState("")
    const [date, setDate] = useState<Date>()
    const [type, setType] = useState("")
    const [behavior, setBehavior] = useState("Unknown")
    const [category, setCategory] = useState("")
    const [customCategory, setCustomCategory] = useState("")
    const [selectedOtherCategory, setSelectedOtherCategory] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    if (!isOpen) return null
    const api = useApi()
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!date) {
            alert("Please pick a transaction date")
            return
        }
        if (!type || type === "Select Type") {
            alert("Please select a transaction type (Income/Expense)")
            return
        }

        const finalCategory = selectedOtherCategory ? customCategory : category
        if (!finalCategory || finalCategory === "Select Category") {
            alert("Please select or enter a category")
            return
        }

        setIsSubmitting(true)
        try {
            const transactionPayload: CreateTransactionRequest = {
                Description: description,
                Amount: parseFloat(amount),
                Merchant: merchantName,
                Date: date,
                Type: type.toLocaleLowerCase() as type,
                TransactionIdentifier: behavior.toLocaleLowerCase() as TransactionIdentifier || "impulsive",
                Category: finalCategory.toLocaleLowerCase(),
                Motive: "",
            }


            await postNewTransaction(transactionPayload, api)

            setDescription("")
            setAmount("")
            setMerchantName("")
            setDate(undefined)
            setType("")
            setBehavior("Unknown")
            setCategory("")
            setCustomCategory("")
            setSelectedOtherCategory(false)

            onClose()
        } catch (err) {
            console.error("Failed to save transaction: ", err)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#1c1e22] border border-neutral-800/80 rounded-xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-150">

                <div className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-5">
                    <div>
                        <h2 className="text-lg font-semibold text-white">Add New Transaction</h2>
                        <p className="text-xs text-neutral-400 mt-0.5">Record a new income or expense item.</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">

                    <div className="space-y-1.5">
                        <label className="text-xs text-neutral-400 font-medium tracking-wide">Description</label>
                        <input
                            type="text"
                            required
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="e.g., Stripe Payout, Grocery Store"
                            className="w-full bg-[#131517] border border-neutral-800 rounded-lg text-sm px-3 py-2 text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-[#9aeb8e]"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs text-neutral-400 font-medium tracking-wide">Amount*</label>
                        <div className="relative w-full">
                            <span className="absolute left-3 top-2.5 text-neutral-500 text-sm">
                                <DollarSign size={16} />
                            </span>
                            <input
                                type="number"
                                step="0.01"
                                required
                                min="0.01"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                className="w-full bg-[#131517] border border-neutral-800 rounded-lg text-sm pl-8 pr-3 py-2 text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-[#9aeb8e]"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs text-neutral-400 font-medium tracking-wide">Merchant Name</label>
                        <div className="relative w-full">
                            <span className="absolute left-3 top-2.5 text-neutral-500 text-sm">
                                <ShoppingBag size={16} />
                            </span>
                            <input
                                type="text"
                                required
                                value={merchantName}
                                onChange={(e) => setMerchantName(e.target.value)}
                                placeholder="Merchant Name"
                                className="w-full bg-[#131517] border border-neutral-800 rounded-lg text-sm pl-8 pr-3 py-2 text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-[#9aeb8e]"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs text-neutral-400 font-medium tracking-wide">Date</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        type="button"
                                        className={cn(
                                            "w-full justify-start text-left font-normal bg-[#131517] border-neutral-800 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-lg h-9 text-xs px-3",
                                            !date && "text-neutral-500"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-3.5 w-3.5 text-neutral-500" />
                                        {date ? format(date, "MMM dd, yyyy") : <span>Pick date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 bg-[#1c1e22] border border-neutral-800" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={date}
                                        onSelect={setDate}
                                        className="bg-[#1c1e22] text-slate-200 rounded-lg p-2"
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs text-neutral-400 font-medium tracking-wide">Type</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="w-full bg-[#131517] border border-neutral-800 rounded-lg text-xs px-3 py-2 text-neutral-300 focus:outline-none focus:ring-1 focus:ring-[#9aeb8e] h-9 cursor-pointer"
                            >
                                <option value="">Select Type</option>
                                <option value="Expense">Expense</option>
                                <option value="Income">Income</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs text-neutral-400 font-medium tracking-wide">Identify This Transaction</label>
                            <select
                                value={behavior}
                                onChange={(e) => setBehavior(e.target.value)}
                                className="w-full bg-[#131517] border border-neutral-800 rounded-lg text-sm px-3 py-2 text-neutral-300 focus:outline-none focus:ring-1 focus:ring-[#9aeb8e] cursor-pointer"
                            >
                                <option value="Impulsive">Impulsive</option>
                                <option value="Well Thought">Well Thought</option>
                                <option value="Needed">Needed</option>
                                <option value="Unknown">Unknown</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs text-neutral-400 font-medium tracking-wide">Select a Category</label>
                            <select
                                value={category}
                                className="w-full bg-[#131517] border border-neutral-800 rounded-lg text-sm px-3 py-2 text-neutral-300 focus:outline-none focus:ring-1 focus:ring-[#9aeb8e] cursor-pointer"
                                onChange={(e) => {
                                    const val = e.target.value
                                    setCategory(val)
                                    if (val === "Other") {
                                        setSelectedOtherCategory(true)
                                    } else {
                                        setSelectedOtherCategory(false)
                                        setCustomCategory("")
                                    }
                                }}
                            >
                                <option value="">Select Category</option>
                                <option value="Food">Food</option>
                                <option value="House">House</option>
                                <option value="Clothing">Clothing</option>
                                <option value="Rent">Rent</option>
                                <option value="Entertainment">Entertainment</option>
                                <option value="Transportation">Transportation</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>

                    {/* Custom Category input layout conditional visibility */}
                    {selectedOtherCategory && (
                        <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                            <label className="text-xs text-neutral-400 font-medium tracking-wide">Custom Category Name</label>
                            <input
                                type="text"
                                required
                                value={customCategory}
                                onChange={(e) => setCustomCategory(e.target.value)}
                                placeholder="Enter custom category"
                                className="w-full bg-[#131517] border border-neutral-800 rounded-lg text-sm px-3 py-2 text-neutral-300 focus:outline-none focus:ring-1 focus:ring-[#9aeb8e]"
                            />
                        </div>
                    )}

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800 mt-6">
                        <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 text-xs font-medium bg-[#9aeb8e] hover:bg-[#85cc7a] text-neutral-950 rounded-lg transition-all active:scale-95 shadow-sm disabled:opacity-50 disabled:pointer-events-none"
                        >
                            {isSubmitting ? "Saving..." : "Save Transaction"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
"use client"

import React, { useState, useEffect } from "react"
import { useUserStore } from "@/store/userStore"
import { useApi } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
    User as UserIcon, 
    Mail, 
    Phone, 
    DollarSign, 
    CreditCard, 
    Calendar, 
    Crown, 
    Check, 
    AlertCircle,
    Copy,
    CheckCircle2
} from "lucide-react"
import { useClerk } from "@clerk/nextjs"

export default function ProfilePage() {
    const api = useApi()
    const { user, setUser, fetchUser } = useUserStore()
    const {signOut} = useClerk()
    // Form states
    const [name, setName] = useState("")
    const [budget, setBudget] = useState(10000)
    const [currency, setCurrency] = useState("USD")
    const [phoneNumber, setPhoneNumber] = useState("")
    
    // UI states
    const [isSaving, setIsSaving] = useState(false)
    const [saveSuccess, setSaveSuccess] = useState(false)
    const [copiedId, setCopiedId] = useState(false)

    // Load user data on mount
    useEffect(() => {
        const initUser = async () => {
            if (!user) {
                try {
                    await fetchUser(api)
                } catch (err) {
                    console.error("Failed to fetch user details:", err)
                }
            }
        }
        initUser()
    }, [api])

    // Sync state when user store loads
    useEffect(() => {
        if (user) {
            setName(user.Name || "")
            setBudget(user.MonthlyBudget || 10000)
            setCurrency(user.Currency || "USD")
            setPhoneNumber(user.PhoneNumber || "")
        }
    }, [user])

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        setIsSaving(true)
        setSaveSuccess(false)

        try {
            // Mock backend save by updating the Zustand persisted store locally
            const updatedUser = {
                ...user,
                Name: name,
                MonthlyBudget: Number(budget),
                Currency: currency,
                PhoneNumber: phoneNumber
            }
            
            setUser(updatedUser)
            setSaveSuccess(true)
            
            // Auto hide success alert after 3 seconds
            setTimeout(() => setSaveSuccess(false), 3000)
        } catch (err) {
            console.error("Failed to save profile changes:", err)
        } finally {
            setIsSaving(false)
        }
    }

    const handleCopyStripeId = () => {
        if (!user?.StripeCustomerID) return
        navigator.clipboard.writeText(user.StripeCustomerID)
        setCopiedId(true)
        setTimeout(() => setCopiedId(false), 2000)
    }

    if (!user) {
        return (
            <div className="min-h-[500px] flex flex-col items-center justify-center p-6 text-center text-white bg-[#131316] h-full overflow-hidden">
                <div className="w-12 h-12 rounded-full border-2 border-emerald-500/20 border-t-emerald-400 animate-spin mb-4" />
                <h3 className="text-md font-semibold text-white">Loading Profile Context...</h3>
            </div>
        )
    }

    const initials = user.Name
        ? user.Name.split(" ").map(n => n[0]).join("").toUpperCase()
        : "U"

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto pb-12 text-white bg-[#131316] min-h-full">
            {/* Header */}
            <div className="border-b border-[#27272a]/60 pb-5">
                <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
                    <UserIcon className="w-6 h-6 text-emerald-400" />
                    Account Settings
                </h1>
                <p className="text-xs text-[#a1a1aa] mt-1.5">
                    Configure your financial boundaries, currency formats, and review your plan boundaries.
                </p>
            </div>

            {/* Dynamic Success Alert Banner */}
            {saveSuccess && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center gap-3 animate-fade-in">
                    <CheckCircle2 className="w-5 h-5 shrink-0 animate-bounce" />
                    <div>
                        <p className="text-xs font-semibold">Profile Saved Successfully</p>
                        <p className="text-[10px] opacity-80 mt-0.5">Your monthly budget & tracking rules are updated across the dashboard.</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* Column 1: Card Overview */}
                <div className="lg:col-span-5 flex flex-col justify-between border border-[#27272a]/80 bg-[#181a1f]/80 backdrop-blur-md rounded-2xl p-6 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl pointer-events-none rounded-full" />
                    
                    <div className="space-y-6 flex-1 flex flex-col justify-center items-center text-center py-6">
                        {/* Avatar */}
                        <div className="relative group">
                            <div className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-extrabold text-white border-2 bg-neutral-800 ${
                                user.IsPro 
                                    ? "border-amber-400/50 shadow-[0_0_20px_rgba(245,158,11,0.2)]" 
                                    : "border-[#27272a]"
                            }`}>
                                {user.AvatarUrl ? (
                                    <img src={user.AvatarUrl} alt={user.Name} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    <span>{initials}</span>
                                )}
                            </div>
                            {user.IsPro && (
                                <div className="absolute bottom-0 right-0 bg-amber-400 text-black p-1.5 rounded-full shadow-lg">
                                    <Crown className="w-4 h-4" />
                                </div>
                            )}
                        </div>

                        <div className="space-y-1">
                            <h2 className="text-lg font-bold text-white tracking-tight">{user.Name || "User"}</h2>
                            <p className="text-xs text-[#71717a] flex items-center justify-center gap-1.5">
                                <Mail className="w-3.5 h-3.5" />
                                {user.Email}
                            </p>
                        </div>

                        {/* Badges details */}
                        <div className="flex gap-2.5">
                            {user.IsPro ? (
                                <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold tracking-widest px-3 py-1 uppercase">
                                    Pro Member
                                </Badge>
                            ) : (
                                <Badge className="bg-[#27272a] text-[#a1a1aa] border border-[#3f3f46] text-[10px] font-bold tracking-widest px-3 py-1 uppercase">
                                    Standard Member
                                </Badge>
                            )}

                            <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold tracking-widest px-3 py-1 uppercase">
                                {user.Role || "User"}
                            </Badge>
                        </div>
                    </div>

                    {/* Metadata lines */}
                    <div className="border-t border-[#27272a]/60 pt-4 mt-6 space-y-2.5 text-xs text-[#a1a1aa] font-medium">
                        <div className="flex justify-between items-center">
                            <span className="text-[#52525B] flex items-center gap-1.5">
                                <Calendar className="w-4 h-4" />
                                Member Since
                            </span>
                            <span>{new Date(user.CreatedAt || Date.now()).toLocaleDateString("en-US", { year: "numeric", month: "long" })}</span>
                        </div>
                        {user.StripeCustomerID && (
                            <div className="flex justify-between items-center">
                                <span className="text-[#52525B] flex items-center gap-1.5">
                                    <CreditCard className="w-4 h-4" />
                                    Customer Reference
                                </span>
                                <button 
                                    onClick={handleCopyStripeId}
                                    className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
                                >
                                    <span className="font-mono text-[10px] truncate max-w-[120px]">{user.StripeCustomerID}</span>
                                    {copiedId ? (
                                        <Check className="w-3 h-3 text-emerald-400" />
                                    ) : (
                                        <Copy className="w-3 h-3 text-[#52525b]" />
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Column 2: Edit Form controls */}
                <div className="lg:col-span-7 border border-[#27272a]/80 bg-[#181a1f]/80 backdrop-blur-md rounded-2xl p-6 shadow-xl flex flex-col justify-between">
                    <form onSubmit={handleSave} className="space-y-5 flex-1">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Configure Boundaries</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Name Input */}
                            <div className="space-y-1.5">
                                <label className="text-[11px] text-[#71717a] font-bold uppercase tracking-wider">Full Name</label>
                                <div className="relative">
                                    <Input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="bg-[#121417] border border-[#27272a] text-white focus:border-emerald-400/50 rounded-lg outline-none text-xs w-full py-2"
                                        placeholder="Enter full name"
                                    />
                                </div>
                            </div>

                            {/* Phone Input */}
                            <div className="space-y-1.5">
                                <label className="text-[11px] text-[#71717a] font-bold uppercase tracking-wider flex items-center gap-1">
                                    <Phone className="w-3 h-3" /> Phone Number
                                </label>
                                <Input
                                    type="text"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    className="bg-[#121417] border border-[#27272a] text-white focus:border-emerald-400/50 rounded-lg outline-none text-xs w-full py-2"
                                    placeholder="Enter phone number"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Budget Input */}
                            <div className="space-y-1.5">
                                <label className="text-[11px] text-[#71717a] font-bold uppercase tracking-wider flex items-center gap-1">
                                    <DollarSign className="w-3 h-3" /> Monthly Target Budget
                                </label>
                                <Input
                                    type="number"
                                    value={budget}
                                    onChange={(e) => setBudget(Number(e.target.value))}
                                    className="bg-[#121417] border border-[#27272a] text-white focus:border-emerald-400/50 rounded-lg outline-none text-xs w-full py-2"
                                    placeholder="Enter budget limit"
                                />
                            </div>

                            {/* Currency Selection */}
                            <div className="space-y-1.5">
                                <label className="text-[11px] text-[#71717a] font-bold uppercase tracking-wider">Local Currency</label>
                                <select
                                    value={currency}
                                    onChange={(e) => setCurrency(e.target.value)}
                                    className="bg-[#121417] border border-[#27272a] text-white focus:border-emerald-400/50 rounded-lg outline-none text-xs w-full p-2 h-[34px] cursor-pointer"
                                >
                                    <option value="USD">USD ($) - United States Dollar</option>
                                    <option value="INR">INR (₹) - Indian Rupee</option>
                                    <option value="EUR">EUR (€) - Euro</option>
                                    <option value="GBP">GBP (£) - British Pound</option>
                                </select>
                            </div>
                        </div>

                        {/* Pro Perks Highlight Box */}
                        {user.IsPro && (
                            <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl space-y-2 mt-4">
                                <h4 className="text-[10px] uppercase tracking-wider font-extrabold text-amber-400 flex items-center gap-1">
                                    <Crown className="w-3.5 h-3.5" />
                                    Active Pro Features
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-[#a1a1aa]">
                                    <div className="flex items-center gap-1.5">
                                        <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                        <span>Autonomous agent routing</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                        <span>Real-time statement anomalies</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                        <span>Unlimited card optimization</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                        <span>Direct coaching chat lines</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="pt-4 mt-auto gap-md">
                            <Button
                                type="submit"
                                disabled={isSaving}
                                className="bg-emerald-400 text-black hover:bg-emerald-300 font-semibold px-6 py-2.5 rounded-lg w-full md:w-auto text-xs cursor-pointer transition-all duration-150 disabled:opacity-50"
                            >
                                {isSaving ? "Saving Settings..." : "Save Changes"}
                            </Button>
                            <Button
                                type="button"
                                onClick={()=>signOut()}
                                className="bg-emerald-400 text-black hover:bg-emerald-300 font-semibold px-6 py-2.5 rounded-lg w-full md:w-auto text-xs cursor-pointer transition-all duration-150 disabled:opacity-50"
                            >
                               Logout
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

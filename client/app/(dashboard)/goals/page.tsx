'use client'

import React, { useEffect, useState } from 'react'
import { Plus, Target, Calendar, TrendingUp, DollarSign, X, FileText, CheckCircle2 } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from "@/lib/utils"
import { GoalRequest, GoalType } from '@/types/types'
import { useApi } from '@/lib/api'
import { useGoalsStore } from '@/store/goalsStore'
import { useRouter } from 'next/navigation'



export default function GoalsPage() {
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const api = useApi();
    const { loading, err, goals, selectedGoal, setSelectedGoal, fetchGoals, postNewGoal, updateGoal, deleteGoal } = useGoalsStore();
    const handleCreateGoal = (goal: GoalRequest) => {
        postNewGoal(goal, api)
        setIsCreateOpen(false)

    }

    useEffect(() => {
        fetchGoals(api)
        console.log("fetching goals");
        console.log(goals);
        return () => {
            setSelectedGoal(null)
        }
    }, [])

    return (
        <div className="w-full overflow-y-auto scrollbar-hidden space-y-4 text-slate-200">
            <div className="bg-neutral-800 border border-neutral-800/40 rounded-xl flex flex-row justify-between p-4 items-center shadow-md my-2">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight text-white">Financial Goals</h1>
                    <p className="text-xs text-neutral-400 mt-0.5">Track, schedule, and fund your short and long-term milestones.</p>
                </div>
                <button
                    onClick={() => setIsCreateOpen(true)}
                    className="hover:bg-[#85cc7a] bg-[#9aeb8e] text-neutral-950 font-medium text-xs px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all duration-200 active:scale-95 shadow-sm"
                >
                    <Plus size={16} strokeWidth={2.5} />
                    <span>Add New Goal</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {goals.map((goal) => {
                    const progressPercentage = Math.min(100, Math.round((goal.SavedAmount / goal.TargetAmount) * 100))

                    return (
                        <div
                            key={goal.ID}
                            onClick={() => setSelectedGoal(goal)}
                            className="bg-neutral-800 border border-neutral-800/60 rounded-xl p-5 hover:border-neutral-700/80 transition-all cursor-pointer group flex flex-col justify-between space-y-4 relative overflow-hidden"
                        >
                            {goal.IsActive && (
                                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#9aeb8e]/40 to-transparent" />
                            )}

                            <div>
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <h3 className="font-semibold text-white group-hover:text-[#9aeb8e] transition-colors">{goal.Name}</h3>
                                        <span className="inline-block text-[10px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700/30">
                                            {goal.Type}
                                        </span>
                                    </div>
                                    <div className={cn(
                                        "p-2 rounded-lg bg-[#131517] border border-neutral-800",
                                        progressPercentage === 100 ? "text-[#9aeb8e]" : "text-neutral-400"
                                    )}>
                                        {progressPercentage === 100 ? <CheckCircle2 size={18} /> : <Target size={18} />}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 mt-4 pt-2 border-t border-neutral-800/40">
                                    <div>
                                        <p className="text-[10px] text-neutral-500 uppercase tracking-wider">Saved</p>
                                        <p className="text-sm font-semibold text-white">${goal.SavedAmount}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-neutral-500 uppercase tracking-wider">Target</p>
                                        <p className="text-sm font-semibold text-neutral-400">${goal.TargetAmount}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-neutral-500">Progress</span>
                                        <span className="font-medium text-neutral-300">{progressPercentage}%</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-[#131517] rounded-full overflow-hidden border border-neutral-900">
                                        <div
                                            className={cn(
                                                "h-full transition-all duration-500 rounded-full",
                                                progressPercentage === 100 ? "bg-emerald-400" : "bg-[#9aeb8e]"
                                            )}
                                            style={{ width: `${progressPercentage}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-1.5 text-xs text-neutral-400 pt-1">
                                    <Calendar size={13} className="text-neutral-500" />
                                    <span>Target: {format(new Date(goal.Deadline), "MMM dd, yyyy")}</span>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            <GoalDetailsDialog goal={selectedGoal} onClose={() => setSelectedGoal(null)} updateGoal={updateGoal} />

            <CreateGoalDialog isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onSubmit={handleCreateGoal} />

        </div>
    )
}

function GoalDetailsDialog({
    goal,
    onClose,
    updateGoal
}: {
    goal: GoalType | null;
    onClose: () => void;
    updateGoal: (goal: any, api: any) => Promise<void> | void
}) {
    const api = useApi()
    const router = useRouter()
    const [isDepositing, setIsDepositing] = useState(false)
    if (!goal) return null
    const progressPercentage = Math.min(100, Math.round((goal.SavedAmount / goal.TargetAmount) * 100))

    const handleWeeklyDeposit = async () => {
        setIsDepositing(true)
        try {
            const updatedPayload = {
                id: goal.ID,
                name: goal.Name,
                type: goal.Type,
                description: goal.Description,
                target_amount: goal.TargetAmount,
                saved_amount: goal.SavedAmount + (goal.WeeklyTarget || 0),
                weekly_target: goal.WeeklyTarget,
                deadline: goal.Deadline,
                is_active: goal.IsActive
            }

            onClose()

            await updateGoal(updatedPayload, api)
            router.refresh()
        } catch (error) {
            console.error("Failed to deposit weekly amount:", error)
        } finally {
            setIsDepositing(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#1c1e22] border border-neutral-800 rounded-xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-150">

                <div className="flex items-start justify-between border-b border-neutral-800 pb-4 mb-4">
                    <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-[#9aeb8e] bg-[#9aeb8e]/10 px-2 py-0.5 rounded">
                            {goal.Type}
                        </span>
                        <h2 className="text-lg font-semibold text-white mt-1.5">{goal.Name}</h2>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors">
                        <X size={16} />
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="space-y-1 bg-[#131517] p-3 rounded-lg border border-neutral-800/60">
                        <span className="text-[11px] font-medium text-neutral-500 flex items-center gap-1">
                            <FileText size={12} /> Description
                        </span>
                        <p className="text-xs text-neutral-300 leading-relaxed">{goal.Description || "No description provided."}</p>
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                            <span className="text-neutral-400">Completion Metrics</span>
                            <span className="font-semibold text-[#9aeb8e]">{progressPercentage}% Reached</span>
                        </div>
                        <div className="w-full h-2 bg-[#131517] rounded-full overflow-hidden border border-neutral-900">
                            <div className="h-full bg-[#9aeb8e] transition-all duration-300" style={{ width: `${progressPercentage}%` }} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="bg-[#131517] p-2.5 rounded-lg border border-neutral-800/40">
                            <p className="text-neutral-500 font-medium">Saved Balance</p>
                            <p className="text-sm font-bold text-white mt-0.5">${goal.SavedAmount}</p>
                        </div>
                        <div className="bg-[#131517] p-2.5 rounded-lg border border-neutral-800/40">
                            <p className="text-neutral-500 font-medium">Target Cap Amount</p>
                            <p className="text-sm font-bold text-neutral-300 mt-0.5">${goal.TargetAmount}</p>
                        </div>
                        <div className="bg-[#131517] p-2.5 rounded-lg border border-neutral-800/40">
                            <p className="text-neutral-500 font-medium flex items-center gap-1"><TrendingUp size={12} /> Weekly Velocity</p>
                            <p className="text-sm font-bold text-white mt-0.5">${goal.WeeklyTarget}/wk</p>
                        </div>
                        <div className="bg-[#131517] p-2.5 rounded-lg border border-neutral-800/40">
                            <p className="text-neutral-500 font-medium flex items-center gap-1"><Calendar size={12} /> Milestone Date</p>
                            <p className="text-sm font-bold text-neutral-300 mt-0.5">
                                {goal.Deadline ? format(new Date(goal.Deadline), "MMM dd, yyyy") : "—"}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-neutral-800 mt-5">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isDepositing}
                        className="px-4 py-1.5 text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                        Dismiss View
                    </button>
                    <button
                        type="button"
                        onClick={handleWeeklyDeposit}
                        disabled={isDepositing}
                        className="px-4 py-1.5 text-xs font-medium bg-[#9aeb8e] hover:bg-[#85cc7a] text-neutral-950 rounded-lg font-medium transition-all active:scale-95 disabled:opacity-50"
                    >
                        {isDepositing ? "Processing..." : "Weekly Deposit Done"}
                    </button>
                </div>
            </div>
        </div>
    )
}


interface CreateGoalDialogProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (goal: GoalRequest) => void
}

function CreateGoalDialog({ isOpen, onClose, onSubmit }: CreateGoalDialogProps) {
    const [name, setName] = useState('')
    const [type, setType] = useState('Savings')
    const [description, setDescription] = useState('')
    const [targetAmount, setTargetAmount] = useState('')
    const [savedAmount, setSavedAmount] = useState('')
    const [weeklyTarget, setWeeklyTarget] = useState('')
    const [deadline, setDeadline] = useState('')

    if (!isOpen) return null

    const handleSubmitForm = (e: React.FormEvent) => {
        e.preventDefault()

        const finalDeadline = deadline ? new Date(deadline) : new Date()

        onSubmit({
            Name: name,
            Type: type,
            Description: description,
            TargetAmount: targetAmount ? parseFloat(targetAmount) : 0,
            SavedAmount: savedAmount ? parseFloat(savedAmount) : 0,
            WeeklyTarget: weeklyTarget ? parseFloat(weeklyTarget) : 0,
            Deadline: finalDeadline
        })

        setName('')
        setDescription('')
        setTargetAmount('')
        setSavedAmount('')
        setWeeklyTarget('')
        setDeadline('')
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#1c1e22] border border-neutral-800 rounded-xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-150">

                <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-4">
                    <div>
                        <h2 className="text-lg font-semibold text-white">Create Saving Goal</h2>
                        <p className="text-xs text-neutral-400 mt-0.5">Initialize a new financial destination parameters.</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors">
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={handleSubmitForm} className="space-y-3.5">

                    <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2 space-y-1">
                            <label className="text-[11px] text-neutral-400 font-medium">Goal Name</label>
                            <input
                                type="text" required placeholder="e.g., Down Payment" value={name} onChange={e => setName(e.target.value)}
                                className="w-full bg-[#131517] border border-neutral-800 rounded-lg text-xs px-3 py-2 text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-[#9aeb8e]"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[11px] text-neutral-400 font-medium">Type</label>
                            <select value={type} onChange={e => setType(e.target.value)} className="w-full bg-[#131517] border border-neutral-800 rounded-lg text-xs px-2 py-2 text-neutral-300 focus:outline-none focus:ring-1 focus:ring-[#9aeb8e] h-[32px] cursor-pointer">
                                <option>Savings</option>
                                <option>Investment</option>
                                <option>Retirement</option>
                                <option>Expense Prep</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[11px] text-neutral-400 font-medium">Description Context</label>
                        <textarea
                            rows={2} placeholder="Detail the intent of this allocation matrix..." value={description} onChange={e => setDescription(e.target.value)}
                            className="w-full bg-[#131517] border border-neutral-800 rounded-lg text-xs px-3 py-2 text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-[#9aeb8e] resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-[11px] text-neutral-400 font-medium">Target Cap ($)</label>
                            <div className="relative">
                                <span className="absolute left-2.5 top-2 text-neutral-600 text-[11px]"><DollarSign size={13} /></span>
                                <input
                                    type="number" required placeholder="5,000" value={targetAmount} onChange={e => setTargetAmount(e.target.value)}
                                    className="w-full bg-[#131517] border border-neutral-800 rounded-lg text-xs pl-6 pr-2 py-1.5 text-neutral-200 focus:outline-none focus:ring-1 focus:ring-[#9aeb8e]"
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[11px] text-neutral-400 font-medium">Starting Balance ($)</label>
                            <div className="relative">
                                <span className="absolute left-2.5 top-2 text-neutral-600 text-[11px]"><DollarSign size={13} /></span>
                                <input
                                    type="number" placeholder="0" value={savedAmount} onChange={e => setSavedAmount(e.target.value)}
                                    className="w-full bg-[#131517] border border-neutral-800 rounded-lg text-xs pl-6 pr-2 py-1.5 text-neutral-200 focus:outline-none focus:ring-1 focus:ring-[#9aeb8e]"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-[11px] text-neutral-400 font-medium">Weekly Installment ($)</label>
                            <input
                                type="number" placeholder="50" value={weeklyTarget} onChange={e => setWeeklyTarget(e.target.value)}
                                className="w-full bg-[#131517] border border-neutral-800 rounded-lg text-xs px-3 py-1.5 text-neutral-200 focus:outline-none focus:ring-1 focus:ring-[#9aeb8e]"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[11px] text-neutral-400 font-medium">Deadline Milestone</label>
                            <input
                                type="date" required value={deadline} onChange={e => setDeadline(e.target.value)}
                                className="w-full bg-[#131517] border border-neutral-800 rounded-lg text-xs px-2 py-1.5 text-neutral-300 focus:outline-none focus:ring-1 focus:ring-[#9aeb8e] text-left appearance-none"
                            />
                        </div>
                    </div>

                    {/* Form Buttons Footer */}
                    <div className="flex items-center justify-end gap-2 pt-4 border-t border-neutral-800 mt-5">
                        <button
                            type="button" onClick={onClose}
                            className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-xs font-medium bg-[#9aeb8e] hover:bg-[#85cc7a] text-neutral-950 rounded-lg transition-all active:scale-95 shadow-sm"
                        >
                            Initialize Goal
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
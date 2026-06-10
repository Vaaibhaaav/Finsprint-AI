'use client'

import React, { useEffect, useState } from 'react'
import { Star, Mail, DollarSign, X, Shield, MessageSquare, Calendar, Award, UserPlus, Clock, RefreshCw } from 'lucide-react'
import { CoachRequest, CoachType, AvailabilitySlotRequest, Frequency, AvailabilitySlot } from "@/types/types"
import { useCoachesStore } from '@/store/coachesStore'
import { useApi } from '@/lib/api'
import { useSession, useUser } from '@clerk/nextjs'
import { useSessionStore } from '@/store/sessionStore'
import { useRouter } from 'next/navigation'
import { useChatStore } from '@/store/chatStore'

export default function CoachesPage() {
    const [isRegisterOpen, setIsRegisterOpen] = useState(false)
    const [isAvailabilityOpen, setIsAvailabilityOpen] = useState(false)
    const [role, setRole] = useState("coach")
    const { user } = useUser();
    const { bookSessionRequest } = useSessionStore()
    const { RegisterAsCoach, fetchCoaches, coaches, selectedCoach, setSelectedCoach, availabiltySlots, fetchAvailabiltySlots, postAvailabiltySlot } = useCoachesStore()
    const api = useApi()
    const router = useRouter();
    const { getOrCreateRoom, activeRoomId } = useChatStore();
    const handleRoutingToMessage = async (coachId: string) => {
        if (user?.id === coachId) {
            alert("Coach id and user Id can't be same.")
            return
        }
        const room = await getOrCreateRoom(user?.id!, coachId, api)
        router.push(`/chat/${activeRoomId}`)
    }
    const handleRegisterCoach = async (newCoachData: CoachRequest) => {
        await RegisterAsCoach(newCoachData, api)
        setIsRegisterOpen(false)
    }

    const handleCreateAvailability = async (availabilityData: AvailabilitySlotRequest) => {
        console.log("Submitting Availability:", availabilityData)
        await postAvailabiltySlot(availabilityData, api)
        setIsAvailabilityOpen(false)
    }

    useEffect(() => {
        if (selectedCoach) {
            fetchAvailabiltySlots(selectedCoach.ID, api)
        }
    }, [selectedCoach, api])

    const handleDeleteSlot = async (slotId: string) => {
        console.log("Deleting slot ID:", slotId)
        alert(`Slot deletion pipeline triggered for slot: ${slotId}`)
    }

    const handleBookSession = (coachId: string, slotId: string) => {
        bookSessionRequest({
            CoachId: coachId,
            SlotId: slotId,
            StripePaymentId: "abc"
        }, api)
        console.log("Book session clicked for coach:", coachId, "slot:", slotId)
    }

    useEffect(() => {
        fetchCoaches(api)
    }, [api])

    return (
        <div className="w-full overflow-y-auto scrollbar-hidden space-y-4 text-slate-200Skin my-2">

            <div className="bg-neutral-800 border border-neutral-800/40 rounded-xl flex flex-row justify-between p-4 items-center shadow-md">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight text-white">Strategy Coaches</h1>
                    <p className="text-xs text-neutral-400 mt-0.5">Book sessions with certified experts to maximize your sprint velocity index.</p>
                </div>
                {role !== "coach" && (
                    <button
                        onClick={() => setIsRegisterOpen(true)}
                        className="hover:bg-neutral-700 bg-neutral-800 text-neutral-200 border border-neutral-700/60 font-medium text-xs px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all duration-200 active:scale-95 shadow-sm"
                    >
                        <UserPlus size={16} className="text-[#9aeb8e]" />
                        <span>Register as a Coach</span>
                    </button>
                )}
                {role === "coach" && (
                    <button
                        onClick={() => setIsAvailabilityOpen(true)} // Toggles the slots dialog
                        className="hover:bg-neutral-700 bg-neutral-800 text-neutral-200 border border-neutral-700/60 font-medium text-xs px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all duration-200 active:scale-95 shadow-sm"
                    >
                        <Clock size={16} className="text-[#9aeb8e]" />
                        <span>Add Availability Slots</span>
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {!coaches && <div>
                    <h1 className="text-neutral-400 font-light text-base">No Coaches Found . Please try again later</h1>
                </div>}
                {coaches?.map((coach) => {
                    if (true) {
                        return (
                            <div
                                key={coach.ID}
                                className="bg-neutral-800 border border-neutral-800/60 rounded-xl p-5 hover:border-neutral-700/80 transition-all flex flex-col justify-between space-y-5 shadow-sm"
                            >
                                <div onClick={() => setSelectedCoach(coach)} className="cursor-pointer space-y-3.5 group">
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={coach.AvatarURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"}
                                            alt={coach.Name}
                                            className="w-12 h-12 rounded-full object-cover border border-neutral-700 bg-neutral-800"
                                        />
                                        <div>
                                            <h3 className="font-semibold text-white group-hover:text-[#9aeb8e] transition-colors">{coach.Name}</h3>
                                            <p className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5">
                                                <Mail size={12} /> {coach.Email}
                                            </p>
                                        </div>
                                    </div>

                                    <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                                        {coach.Bio || "No biographical context configured for this strategist."}
                                    </p>

                                    <div className="flex items-center justify-between pt-2 border-t border-neutral-800/40 text-xs">
                                        <div className="flex items-center gap-1 text-amber-400 bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10">
                                            <Star size={13} fill="currentColor" />
                                            <span className="font-semibold">{coach.Rating.toFixed(1)}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-neutral-500 text-[10px] block uppercase tracking-wider">Rate</span>
                                            <span className="font-semibold text-white">${coach.SessionPrice}<span className="text-neutral-500 font-normal">/hr</span></span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2.5 pt-1">
                                    <button
                                        onClick={() => handleRoutingToMessage(coach.ID)}
                                        className="bg-neutral-800 hover:bg-neutral-700 border border-neutral-700/50 text-neutral-300 text-xs py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                                    >
                                        <MessageSquare size={14} />
                                        <span>Message</span>
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); alert(`Booking intake pipeline initialized for ${coach.Name}`); }}
                                        className="bg-[#9aeb8e] hover:bg-[#85cc7a] text-neutral-950 text-xs font-medium py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm"
                                    >
                                        <Calendar size={14} />
                                        <span>Book Session</span>
                                    </button>
                                </div>
                            </div>
                        )
                    }
                })}
            </div>

            <CoachDetailsDialog
                coach={selectedCoach}
                onClose={() => setSelectedCoach(null)}
                onDeleteSlot={handleDeleteSlot}
                availabiltySlots={availabiltySlots}
                onBookSession={handleBookSession}
            />
            <RegisterCoachDialog isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} onSubmit={handleRegisterCoach} />

            <AddAvailabilityDialog isOpen={isAvailabilityOpen} onClose={() => setIsAvailabilityOpen(false)} onSubmit={handleCreateAvailability} />

        </div>
    )
}

function CoachDetailsDialog({
    coach,
    onClose,
    onDeleteSlot,
    availabiltySlots,
    onBookSession
}: {
    coach: CoachType | null;
    onClose: () => void;
    onDeleteSlot: (slotId: string) => void;
    availabiltySlots: AvailabilitySlot[] | null;
    onBookSession: (coachId: string, slotId: string) => void;
}) {
    const { user } = useUser();
    if (!coach) return null
    const isCurrentCoachProfile = user?.id === coach.ID


    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#1c1e22] border border-neutral-800 rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto scrollbar-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 text-xs">

                <div className="flex items-start justify-between border-b border-neutral-800 pb-4 mb-4">
                    <div className="flex items-center gap-3">
                        <img
                            src={coach.AvatarURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"}
                            alt={coach.Name}
                            className="w-14 h-14 rounded-full object-cover border border-neutral-700"
                        />
                        <div>
                            <h2 className="text-base font-semibold text-white">{coach.Name} {isCurrentCoachProfile && <span className="text-[10px] text-[#9aeb8e] bg-[#9aeb8e]/10 px-1.5 py-0.5 rounded ml-1 border border-[#9aeb8e]/20">You</span>}</h2>
                            <p className="text-neutral-400 mt-0.5">{coach.Email}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors">
                        <X size={16} />
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="space-y-1 bg-[#131517] p-3 rounded-lg border border-neutral-800/60">
                        <span className="text-neutral-500 font-medium tracking-wide block">BIOGRAPHY</span>
                        <p className="text-neutral-300 leading-relaxed">{coach.Bio || "No bio context provided."}</p>
                    </div>

                    <div className="space-y-1.5">
                        <span className="text-neutral-500 font-medium tracking-wide flex items-center gap-1">
                            <Award size={13} /> CORE FOCUS SPECIALTIES
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                            {coach.Specialties?.map((spec, index) => (
                                <span key={index} className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700/40 font-medium">
                                    {spec}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2 border-t border-neutral-800/60 pt-3">
                        <span className="text-neutral-500 font-medium tracking-wide flex items-center gap-1">
                            <Clock size={13} /> ADVISOR AVAILABILITY SLOTS
                        </span>

                        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                            {availabiltySlots?.length === 0 ? (
                                <p className="text-neutral-500 italic py-1">No operational blocks published currently.</p>
                            ) : (
                                availabiltySlots?.map((slot) => {
                                    const formattedTime = new Date(slot.StartTime).toLocaleString([], {
                                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                    });

                                    return (
                                        <div
                                            key={slot.ID}
                                            className="bg-[#131517] border border-neutral-800/50 p-2 rounded-lg flex items-center justify-between transition-all hover:border-neutral-800"
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className={`w-1.5 h-1.5 rounded-full ${slot.IsBooked ? 'bg-neutral-600' : 'bg-emerald-400 animate-pulse'}`} />
                                                <span className={`${slot.IsBooked ? 'text-neutral-500 line-through' : 'text-neutral-300 font-medium'}`}>
                                                    {formattedTime}
                                                </span>
                                            </div>

                                            {isCurrentCoachProfile ? (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onDeleteSlot(slot.ID); }}
                                                    className="px-2 py-1 text-[10px] text-red-400 hover:text-red-300 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 hover:border-red-500/20 rounded transition-all font-medium"
                                                >
                                                    Delete
                                                </button>
                                            ) : (
                                                <button
                                                    disabled={slot.IsBooked}
                                                    onClick={(e) => { e.stopPropagation(); onBookSession(coach.ID, slot.ID); }}
                                                    className={`px-2 py-1 text-[10px] font-medium rounded transition-all ${slot.IsBooked
                                                        ? 'bg-neutral-800 text-neutral-600 border border-neutral-800/40 cursor-not-allowed'
                                                        : 'bg-[#9aeb8e]/10 text-[#9aeb8e] border border-[#9aeb8e]/20 hover:bg-[#9aeb8e]/20'
                                                        }`}
                                                >
                                                    {slot.IsBooked ? 'Reserved' : 'Book'}
                                                </button>
                                            )}
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                        <div className="bg-[#131517] p-2.5 rounded-lg border border-neutral-800/40">
                            <p className="text-neutral-500 font-medium">Performance Valuation</p>
                            <p className="text-sm font-bold text-amber-400 mt-0.5 flex items-center gap-1">
                                <Star size={13} fill="currentColor" /> {coach.Rating?.toFixed(1) || "5.0"} / 5.0
                            </p>
                        </div>
                        <div className="bg-[#131517] p-2.5 rounded-lg border border-neutral-800/40">
                            <p className="text-neutral-500 font-medium">Rate Matrix Parameter</p>
                            <p className="text-sm font-bold text-white mt-0.5">${coach.SessionPrice} USD / hr</p>
                        </div>
                    </div>

                    <div className="bg-emerald-500/5 border border-emerald-500/10 p-2.5 rounded-lg flex items-center gap-2 text-emerald-400">
                        <Shield size={14} />
                        <span>Finsprint Platform Verified Advisor Network Account</span>
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-neutral-800 mt-5 gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-1.5 font-medium bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors"
                    >
                        Close Details
                    </button>
                    {!isCurrentCoachProfile && (
                        <button
                            onClick={() => { onClose(); alert(`Messaging ${coach.Name}`); }}
                            className="px-4 py-1.5 font-medium bg-[#9aeb8e] text-neutral-950 rounded-lg transition-colors"
                        >
                            Direct Message
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

interface RegisterProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (data: CoachRequest) => void
}

function RegisterCoachDialog({ isOpen, onClose, onSubmit }: RegisterProps) {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [price, setPrice] = useState('')
    const [bio, setBio] = useState('')
    const [specialties, setSpecialties] = useState('')
    const [avatar, setAvatar] = useState('')

    if (!isOpen) return null

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSubmit({
            Name: name,
            Email: email,
            Phone: phone,
            Bio: bio,
            SessionPrice: Number(price) || 50,
            Specialties: specialties.split(',').map(s => s.trim()).filter(Boolean),
            AvatarURL: avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"
        })

        setName(''); setEmail(''); setPhone(''); setPrice(''); setBio(''); setSpecialties(''); setAvatar('')
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 text-xs">
            <div className="bg-[#1c1e22] border border-neutral-800 rounded-xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-150">

                <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-4">
                    <div>
                        <h2 className="text-base font-semibold text-white">Join Advisor Directory</h2>
                        <p className="text-neutral-400 mt-0.5">Publish your consulting parameters to user marketplace.</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors">
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={handleFormSubmit} className="space-y-3.5">

                    <div className="space-y-1">
                        <label className="text-neutral-400 font-medium">Full Name</label>
                        <input
                            type="text" required placeholder="e.g., Jane Doe" value={name} onChange={e => setName(e.target.value)}
                            className="w-full bg-[#131517] border border-neutral-800 rounded-lg px-3 py-2 text-neutral-200 focus:outline-none focus:ring-1 focus:ring-[#9aeb8e]"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-neutral-400 font-medium">Business Email</label>
                            <input
                                type="email" required placeholder="jane@example.com" value={email} onChange={e => setEmail(e.target.value)}
                                className="w-full bg-[#131517] border border-neutral-800 rounded-lg px-3 py-1.5 text-neutral-200 focus:outline-none focus:ring-1 focus:ring-[#9aeb8e]"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-neutral-400 font-medium">Phone Number</label>
                            <input
                                type="tel" required placeholder="+1 (555) 000-0000" value={phone} onChange={e => setPhone(e.target.value)}
                                className="w-full bg-[#131517] border border-neutral-800 rounded-lg px-3 py-1.5 text-neutral-200 focus:outline-none focus:ring-1 focus:ring-[#9aeb8e]"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1 col-span-1">
                            <label className="text-neutral-400 font-medium">Rate ($ / hr)</label>
                            <div className="relative">
                                <span className="absolute left-2.5 top-1.5 text-neutral-600"><DollarSign size={13} /></span>
                                <input
                                    type="number" required placeholder="100" value={price} onChange={e => setPrice(e.target.value)}
                                    className="w-full bg-[#131517] border border-neutral-800 rounded-lg pl-6 pr-2 py-1.5 text-neutral-200 focus:outline-none focus:ring-1 focus:ring-[#9aeb8e]"
                                />
                            </div>
                        </div>
                        <div className="space-y-1 col-span-2">
                            <label className="text-neutral-400 font-medium">Avatar Photo URL</label>
                            <input
                                type="url" placeholder="https://unsplash.com/... (optional)" value={avatar} onChange={e => setAvatar(e.target.value)}
                                className="w-full bg-[#131517] border border-neutral-800 rounded-lg px-3 py-1.5 text-neutral-200 focus:outline-none focus:ring-1 focus:ring-[#9aeb8e]"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-neutral-400 font-medium">Specialties (Comma Separated)</label>
                        <input
                            type="text" required placeholder="Velocity Planning, Tax Prep, High-Yield" value={specialties} onChange={e => setSpecialties(e.target.value)}
                            className="w-full bg-[#131517] border border-neutral-800 rounded-lg px-3 py-2 text-neutral-200 focus:outline-none focus:ring-1 focus:ring-[#9aeb8e]"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-neutral-400 font-medium">Professional Bio</label>
                        <textarea
                            rows={2} required placeholder="Briefly detail your consulting methodology profile..." value={bio} onChange={e => setBio(e.target.value)}
                            className="w-full bg-[#131517] border border-neutral-800 rounded-lg px-3 py-2 text-neutral-200 focus:outline-none focus:ring-1 focus:ring-[#9aeb8e] resize-none"
                        />
                    </div>

                    {/* Footer buttons */}
                    <div className="flex items-center justify-end gap-2 pt-4 border-t border-neutral-800 mt-5">
                        <button
                            type="button" onClick={onClose}
                            className="px-4 py-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-[#9aeb8e] hover:bg-[#85cc7a] text-neutral-950 font-medium rounded-lg transition-all active:scale-95 shadow-sm"
                        >
                            Submit Registration
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

interface AvailabilityProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (data: AvailabilitySlotRequest) => void
}

function AddAvailabilityDialog({ isOpen, onClose, onSubmit }: AvailabilityProps) {
    const [startTime, setStartTime] = useState('')
    const [endTime, setEndTime] = useState('')
    const [frequency, setFrequency] = useState<Frequency>(Frequency.Everyday)

    if (!isOpen) return null

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (new Date(startTime) >= new Date(endTime)) {
            alert("End Time must be chronological after Start Time.")
            return
        }

        onSubmit({
            StartTime: new Date(startTime),
            EndTime: new Date(endTime),
            Frequency: frequency
        })

        // Reset local form values
        setStartTime('')
        setEndTime('')
        setFrequency(Frequency.Everyday)
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 text-xs">
            <div className="bg-[#1c1e22] border border-neutral-800 rounded-xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95 duration-150">

                <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-4">
                    <div>
                        <h2 className="text-base font-semibold text-white">Configure Availability Matrix</h2>
                        <p className="text-neutral-400 mt-0.5">Define your operational hours structure for bookings.</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors">
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={handleFormSubmit} className="space-y-4">

                    <div className="space-y-1">
                        <label className="text-neutral-400 font-medium">Session Batch Start Time</label>
                        <input
                            type="datetime-local"
                            required
                            value={startTime}
                            onChange={e => setStartTime(e.target.value)}
                            className="w-full bg-[#131517] border border-neutral-800 rounded-lg px-3 py-2 text-neutral-200 focus:outline-none focus:ring-1 focus:ring-[#9aeb8e]"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-neutral-400 font-medium">Session Batch End Time</label>
                        <input
                            type="datetime-local"
                            required
                            value={endTime}
                            onChange={e => setEndTime(e.target.value)}
                            className="w-full bg-[#131517] border border-neutral-800 rounded-lg px-3 py-2 text-neutral-200 focus:outline-none focus:ring-1 focus:ring-[#9aeb8e]"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-neutral-400 font-medium">Recurrence Loop Parameter</label>
                        <div className="relative">
                            <select
                                value={frequency}
                                onChange={e => setFrequency(e.target.value as Frequency)}
                                className="w-full bg-[#131517] border border-neutral-800 rounded-lg px-3 py-2 text-neutral-200 focus:outline-none focus:ring-1 focus:ring-[#9aeb8e] appearance-none cursor-pointer capitalize"
                            >
                                {Object.values(Frequency).map((f) => (
                                    <option key={f} value={f} className="bg-[#1c1e22]">
                                        {f}
                                    </option>
                                ))}
                            </select>
                            <span className="absolute right-3 top-2.5 pointer-events-none text-neutral-500">
                                <RefreshCw size={12} className="animate-spin-slow" />
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-4 border-t border-neutral-800 mt-5">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-[#9aeb8e] hover:bg-[#85cc7a] text-neutral-950 font-medium rounded-lg transition-all active:scale-95 shadow-sm"
                        >
                            Publish Slots
                        </button>
                    </div>

                </form>
            </div>
        </div>
    )
}
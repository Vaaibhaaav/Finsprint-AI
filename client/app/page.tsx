"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { 
    Sparkles, 
    ArrowRight, 
    Shield, 
    TrendingUp, 
    Globe, 
    Crown, 
    Check, 
    Zap, 
    Lock,
    Cpu,
    ArrowUpRight,
    Menu,
    X,
    Wallet,
    AlertCircle,
    Users,
    BookOpen,
    Calculator,
    Target,
    Calendar,
    Flame
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function LandingPage() {
    const router = useRouter()
    const { isSignedIn } = useUser()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    return (
        <div 
            style={{
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            }}
            className="min-h-screen bg-[#07080a] text-white overflow-x-hidden font-sans relative selection:bg-emerald-500/30"
        >
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293708_1px,transparent_1px),linear-gradient(to_bottom,#1f293708_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
            
            <div className="absolute top-[-300px] left-[5%] w-[800px] h-[800px] bg-emerald-500/5 blur-3xl pointer-events-none rounded-full" />
            <div className="absolute top-[20%] right-[-100px] w-[700px] h-[700px] bg-amber-500/5 blur-3xl pointer-events-none rounded-full" />
            <div className="absolute bottom-[10%] left-[-100px] w-[800px] h-[800px] bg-blue-600/5 blur-3xl pointer-events-none rounded-full" />

            <header className="sticky top-0 z-50 bg-[#07080a]/75 backdrop-blur-xl border-b border-neutral-900">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => router.push("/")}>
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-400 to-emerald-600 flex items-center justify-center text-black shadow-lg">
                            <span className="font-extrabold text-lg">F</span>
                        </div>
                        <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent">
                            FinSprint
                        </span>
                    </div>

                    {/* Desktop Menu */}
                    <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-[#a1a1aa] tracking-wide">
                        <a href="#features" className="hover:text-white transition-colors">Features</a>
                        <a href="#bento" className="hover:text-white transition-colors">Some Features</a>
                        <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
                        <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Documentation</a>
                    </nav>

                    {/* CTAs */}
                    <div className="hidden md:flex items-center gap-3">
                        {isSignedIn ? (
                            <Button 
                                onClick={() => router.push("/overview")}
                                className="bg-emerald-400 text-black hover:bg-emerald-300 font-bold text-xs px-5 py-2 rounded-lg transition-all shadow-[0_0_20px_rgba(52,211,153,0.15)] flex items-center gap-1.5 cursor-pointer"
                            >
                                Enter Dashboard
                                <ArrowRight className="w-3.5 h-3.5" />
                            </Button>
                        ) : (
                            <>
                                <Button 
                                    onClick={() => router.push("/sign-in")}
                                    variant="ghost" 
                                    className="text-xs text-white hover:text-emerald-400 hover:bg-[#181a1f]/50 font-semibold cursor-pointer"
                                >
                                    Sign In
                                </Button>
                                <Button 
                                    onClick={() => router.push("/sign-up")}
                                    className="bg-emerald-400 text-black hover:bg-emerald-300 font-bold text-xs px-5 py-2 rounded-lg transition-all cursor-pointer shadow-lg"
                                >
                                    Get Started
                                </Button>
                            </>
                        )}
                    </div>

                    <button 
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-2 text-white hover:text-emerald-400 transition-colors"
                        aria-label="Toggle Menu"
                    >
                        {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>

                {mobileMenuOpen && (
                    <div className="md:hidden border-b border-neutral-900 bg-[#07080a] py-6 px-6 space-y-4 animate-slide-down">
                        <nav className="flex flex-col gap-4 text-sm font-semibold text-[#a1a1aa]">
                            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="hover:text-white transition-colors">Features</a>
                            <a href="#bento" onClick={() => setMobileMenuOpen(false)} className="hover:text-white transition-colors">Hub</a>
                            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="hover:text-white transition-colors">Pricing</a>
                        </nav>
                        <div className="pt-4 border-t border-neutral-900/60 flex flex-col gap-3">
                            {isSignedIn ? (
                                <Button 
                                    onClick={() => {
                                        setMobileMenuOpen(false)
                                        router.push("/overview")
                                    }}
                                    className="bg-emerald-400 text-black hover:bg-emerald-300 font-bold text-xs py-2.5 rounded-lg w-full flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                    Enter Dashboard
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </Button>
                            ) : (
                                <>
                                    <Button 
                                        onClick={() => {
                                            setMobileMenuOpen(false)
                                            router.push("/sign-in")
                                        }}
                                        variant="outline" 
                                        className="border-neutral-800 text-white hover:bg-[#181a1f] text-xs py-2.5 rounded-lg w-full cursor-pointer"
                                    >
                                        Sign In
                                    </Button>
                                    <Button 
                                        onClick={() => {
                                            setMobileMenuOpen(false)
                                            router.push("/sign-up")
                                        }}
                                        className="bg-emerald-400 text-black hover:bg-emerald-300 font-bold text-xs py-2.5 rounded-lg w-full cursor-pointer shadow-lg"
                                    >
                                        Get Started Free
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </header>

            <section className="py-20 md:py-28 relative">
                <div className="max-w-5xl mx-auto px-6 text-center space-y-8">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] uppercase tracking-widest font-bold animate-pulse">
                        <Sparkles className="w-3.5 h-3.5 animate-spin-slow" />
                        Complete Financial Platform With AI Automation
                    </div>

                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-none text-white max-w-4xl mx-auto">
                        Your Complete Capital Velocity, <br />
                        <span className="bg-gradient-to-r from-emerald-400 via-[#bdf692] to-amber-300 bg-clip-text text-transparent drop-shadow-sm">
                            Organized in Real-Time.
                        </span>
                    </h1>

                    <p className="text-xs md:text-sm text-[#a1a1aa] max-w-2xl mx-auto leading-relaxed font-medium">
                        FinSprint combines custom AI uploader nodes with human specialist coaching, calculators, goal tracking, and automated weekly digests in a single high-fidelity dashboard.
                    </p>

                    <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
                        {isSignedIn ? (
                            <Button 
                                onClick={() => router.push("/overview")}
                                className="bg-emerald-400 text-black hover:bg-emerald-300 font-bold text-xs px-8 py-3 h-auto rounded-xl shadow-[0_0_30px_rgba(52,211,153,0.2)] flex items-center gap-2 cursor-pointer transition-transform hover:scale-[1.02]"
                            >
                                Enter Dashboard
                                <ArrowRight className="w-4 h-4" />
                            </Button>
                        ) : (
                            <>
                                <Button 
                                    onClick={() => router.push("/sign-up")}
                                    className="bg-emerald-400 text-black hover:bg-emerald-300 font-bold text-xs px-8 py-3 h-auto rounded-xl shadow-[0_0_30px_rgba(52,211,153,0.15)] flex items-center gap-2 cursor-pointer transition-transform hover:scale-[1.02]"
                                >
                                    Get Started Free
                                    <ArrowRight className="w-4 h-4" />
                                </Button>
                                <Button 
                                    onClick={() => router.push("/sign-in")}
                                    variant="outline" 
                                    className="border-neutral-800 text-white hover:bg-neutral-900/50 text-xs px-8 py-3 h-auto rounded-xl cursor-pointer"
                                >
                                    Watch Live Demo
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </section>

            <section id="bento" className="py-16 md:py-24 border-t border-neutral-900/60 bg-[#090b0e]/40 relative">
                <div className="max-w-7xl mx-auto px-6 space-y-12">
                    <div className="text-center space-y-3 max-w-2xl mx-auto">
                        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Some Features We Offer</h2>
                        <p className="text-xs text-[#71717a] leading-relaxed">
                            A modern workspace layout organizing our database state, active calculators, uploader models, and coaching grids.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-min pt-4">
                        
                        <div className="md:col-span-2 md:row-span-2 bg-[#121417]/60 border border-neutral-900 hover:border-emerald-500/20 rounded-3xl p-6 shadow-xl flex flex-col justify-between transition-all duration-300 hover:scale-[1.005] group overflow-hidden min-h-[360px] relative">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 blur-3xl pointer-events-none rounded-full" />
                            <div>
                                <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold uppercase tracking-wider mb-4">
                                    Node 01 • AI Anomaly Guardian
                                </Badge>
                                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-emerald-400" />
                                    Guardian Auditing Engine
                                </h3>
                                <p className="text-xs text-[#a1a1aa] leading-relaxed max-w-xl mb-6">
                                    Upload statement PDFs to parse transaction baseline parameters. The uploader flags recurring duplicates, orphan subscriptions, and silent price jumps automatically.
                                </p>
                            </div>

                            <div className="bg-neutral-950/60 border border-neutral-900 rounded-2xl p-5 space-y-4">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-semibold text-white">Inspected Statement: HDFC_MAY.pdf</span>
                                    <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded text-[10px]">Audit Done</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="p-3 bg-rose-500/5 border border-rose-500/10 text-rose-400 rounded-xl text-xs space-y-1">
                                        <div className="flex items-center gap-1.5 font-bold">
                                            <AlertCircle className="w-4 h-4 shrink-0" />
                                            <span>Price Hike: Netflix</span>
                                        </div>
                                        <p className="text-[10px] text-[#a1a1aa] leading-tight">Increased to ₹649/mo (+15% vs April)</p>
                                    </div>
                                    <div className="p-3 bg-amber-500/5 border border-amber-500/10 text-amber-400 rounded-xl text-xs space-y-1">
                                        <div className="flex items-center gap-1.5 font-bold">
                                            <AlertCircle className="w-4 h-4 shrink-0" />
                                            <span>Duplicate Charge</span>
                                        </div>
                                        <p className="text-[10px] text-[#a1a1aa] leading-tight">Double billing detected at 'Zomato' (₹480)</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-[#121417]/60 border border-neutral-900 hover:border-blue-500/20 rounded-3xl p-6 shadow-xl flex flex-col justify-between transition-all duration-300 hover:scale-[1.005] group overflow-hidden min-h-[360px] relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-2xl pointer-events-none rounded-full" />
                            <div>
                                <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[9px] font-bold uppercase tracking-wider mb-4">
                                    Specialists • Coaching Network
                                </Badge>
                                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                                    <Users className="w-5 h-5 text-blue-400" />
                                    1:1 Financial Coaches
                                </h3>
                                <p className="text-xs text-[#a1a1aa] leading-relaxed mb-6">
                                    Book live video slots with certified financial coaches. Discuss custom investment allocations, tax plans, and high-velocity savings.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <div className="bg-[#0c0d10]/80 border border-neutral-900 rounded-2xl p-4 flex gap-3.5 items-center">
                                    <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center font-bold text-white shrink-0">
                                        JD
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-white text-xs truncate">Jonathan Doe</h4>
                                        <p className="text-[10px] text-[#71717a] mt-0.5 truncate">Specialty: Tax Optimization</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <Badge className="bg-emerald-500/10 text-emerald-400 border-none text-[8px] font-bold">Slot Free</Badge>
                                    </div>
                                </div>
                                
                                <Button 
                                    onClick={() => router.push("/coaches")}
                                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2 w-full rounded-xl transition-all cursor-pointer"
                                >
                                    Browse Slots
                                </Button>
                            </div>
                        </div>

                        <div className="bg-[#121417]/60 border border-neutral-900 hover:border-emerald-500/20 rounded-3xl p-6 shadow-xl flex flex-col justify-between transition-all duration-300 hover:scale-[1.005] group overflow-hidden min-h-[200px] relative">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-2xl pointer-events-none rounded-full" />
                            <div>
                                <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold uppercase tracking-wider mb-3">
                                    Platform • Digests
                                </Badge>
                                <h3 className="text-md font-bold text-white mb-1.5 flex items-center gap-2">
                                    <BookOpen className="w-4 h-4 text-emerald-400" />
                                    Weekly Reviews
                                </h3>
                                <p className="text-[11px] text-[#a1a1aa] leading-relaxed mb-4">
                                    Automatically consolidates your weekly spends, impulse counts, and budget margins into clear review summaries.
                                </p>
                            </div>
                            
                            <div className="bg-[#0c0d10] p-2.5 rounded-xl border border-neutral-900 text-[10px] text-[#6ee7b7] font-semibold flex items-center justify-between">
                                <span>Discretionary spends down 8%</span>
                                <span className="text-[#71717a] font-normal text-[9px]">Digest #12</span>
                            </div>
                        </div>

                        <div className="md:col-span-2 bg-[#121417]/60 border border-neutral-900 hover:border-blue-500/20 rounded-3xl p-6 shadow-xl flex flex-col justify-between transition-all duration-300 hover:scale-[1.005] group overflow-hidden min-h-[200px] relative">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 blur-3xl pointer-events-none rounded-full" />
                            <div>
                                <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[9px] font-bold uppercase tracking-wider mb-3">
                                    Node 03 • AI Citation Assistant
                                </Badge>
                                <h3 className="text-md font-bold text-white mb-1.5 flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-blue-400" />
                                    Live Research Engine
                                </h3>
                                <p className="text-[11px] text-[#a1a1aa] leading-relaxed mb-4 max-w-xl">
                                    Query live bank terms, airline partnerships, and credit campaigns. The assistant references results with source domains dynamically.
                                </p>
                            </div>

                            <div className="bg-neutral-950/60 border border-neutral-900 rounded-xl p-3 flex justify-between items-center gap-4 text-[10px]">
                                <div className="flex-1 flex gap-2 items-center">
                                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                                    <span className="text-[#a1a1aa] truncate font-medium">Mapped best dining rewards at 4 partner banks with direct links</span>
                                </div>
                                <span className="text-blue-400 font-mono text-[9px] shrink-0">Source: smartbuy.com</span>
                            </div>
                        </div>

                        <div className="bg-[#121417]/60 border border-neutral-900 hover:border-amber-500/20 rounded-3xl p-6 shadow-xl flex flex-col justify-between transition-all duration-300 hover:scale-[1.005] group overflow-hidden min-h-[220px] relative">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 blur-2xl pointer-events-none rounded-full" />
                            <div>
                                <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-bold uppercase tracking-wider mb-3">
                                    Tools • Calculator Hub
                                </Badge>
                                <h3 className="text-md font-bold text-white mb-1.5 flex items-center gap-2">
                                    <Calculator className="w-4 h-4 text-amber-400" />
                                    Calculators
                                </h3>
                                <p className="text-[11px] text-[#a1a1aa] leading-relaxed mb-4">
                                    Interactive calculators estimate velocity schedules and track growth for luxury target items.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-center text-[10px]">
                                <div className="p-2 bg-neutral-900/60 border border-neutral-900 rounded-lg text-white font-semibold">
                                    Savings Sprint
                                </div>
                                <div className="p-2 bg-neutral-900/60 border border-neutral-900 rounded-lg text-white font-semibold">
                                    Dream Tracker
                                </div>
                            </div>
                        </div>

                        <div className="md:col-span-2 bg-[#121417]/60 border border-neutral-900 hover:border-amber-500/20 rounded-3xl p-6 shadow-xl flex flex-col justify-between transition-all duration-300 hover:scale-[1.005] group overflow-hidden min-h-[220px] relative">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 blur-3xl pointer-events-none rounded-full" />
                            <div>
                                <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-bold uppercase tracking-wider mb-3">
                                    Node 02 • AI Rewards Optimizer
                                </Badge>
                                <h3 className="text-md font-bold text-white mb-1.5 flex items-center gap-2">
                                    <Wallet className="w-4 h-4 text-amber-400" />
                                    Reward Optimizer
                                </h3>
                                <p className="text-[11px] text-[#a1a1aa] leading-relaxed mb-4 max-w-xl">
                                    Deploy our routing heuristics node to dynamically score credit card networks. Generates interactive card reports detailing joining benefits and net rewards.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-gradient-to-br from-[#1a1917] to-[#0c0a07] border border-amber-400/20 rounded-xl text-[10px] space-y-1">
                                    <span className="font-bold text-white block">IDFC First Wealth</span>
                                    <span className="text-amber-400 font-semibold font-mono">Net Value: ₹43,920</span>
                                </div>
                                <div className="p-3 bg-gradient-to-br from-[#0c1020] to-[#050814] border border-blue-500/20 rounded-xl text-[10px] space-y-1">
                                    <span className="font-bold text-white block">HDFC Business Regalia</span>
                                    <span className="text-blue-400 font-semibold font-mono">Net Value: ₹36,588</span>
                                </div>
                            </div>
                        </div>

                        {/* Bento Card 7: Active Goals (col-span-1) */}
                        <div className="bg-[#121417]/60 border border-neutral-900 hover:border-emerald-500/20 rounded-3xl p-6 shadow-xl flex flex-col justify-between transition-all duration-300 hover:scale-[1.005] group overflow-hidden min-h-[220px] relative">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-2xl pointer-events-none rounded-full" />
                            <div>
                                <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold uppercase tracking-wider mb-3">
                                    Goals • Target Milestones
                                </Badge>
                                <h3 className="text-md font-bold text-white mb-1.5 flex items-center gap-2">
                                    <Target className="w-4 h-4 text-emerald-400" />
                                    Active Target Goals
                                </h3>
                                <p className="text-[11px] text-[#a1a1aa] leading-relaxed mb-4">
                                    Establish active goals, allocate saved bounds, and track percentages via interactive linear meters.
                                </p>
                            </div>

                            <div className="space-y-1.5 bg-neutral-950/60 p-3 rounded-xl border border-neutral-900">
                                <div className="flex justify-between text-[9px] text-[#71717a] font-semibold">
                                    <span>Emergency Fund Target</span>
                                    <span className="text-emerald-400">85% Complete</span>
                                </div>
                                <div className="w-full bg-[#181a1f] h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-emerald-400 h-full w-[85%] rounded-full" />
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-16 md:py-24 border-t border-neutral-900/60 bg-[#090b0e]/40">
                <div className="max-w-5xl mx-auto px-6 space-y-12">
                    <div className="text-center space-y-3">
                        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Flexible Membership Tiers</h2>
                        <p className="text-xs text-[#71717a]">Choose the tier that maps to your financial sprint targets.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto pt-4 items-stretch">
                        {/* Standard Card */}
                        <div className="bg-[#121417]/40 border border-neutral-900 rounded-2xl p-6 flex flex-col justify-between shadow-xl space-y-8 relative">
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-400">Standard Plan</h3>
                                    <p className="text-2xl font-extrabold mt-1 text-white">₹0 <span className="text-xs text-[#71717a] font-normal">/ lifetime free</span></p>
                                </div>
                                <p className="text-[11px] text-[#a1a1aa] font-medium leading-relaxed">
                                    Analyze transactions, set active savings sprint goals, and perform localized manual calculations.
                                </p>
                                <ul className="space-y-2.5 text-[11px] text-[#a1a1aa] font-medium">
                                    <li className="flex items-center gap-2">
                                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                        <span>Manual transaction logging</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                        <span>Active financial goal tracks</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                        <span>Local calculator hub items</span>
                                    </li>
                                </ul>
                            </div>
                            <Button 
                                onClick={() => router.push("/sign-up")}
                                variant="outline" 
                                className="border-neutral-800 text-white hover:bg-neutral-900 w-full text-xs cursor-pointer py-2.5 rounded-lg"
                            >
                                Start Free Account
                            </Button>
                        </div>

                        {/* Pro Card */}
                        <div className="bg-[#161a22] border border-amber-400/20 rounded-2xl p-6 flex flex-col justify-between shadow-2xl space-y-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 bg-amber-400 text-black font-extrabold text-[8px] px-3 py-1 uppercase tracking-wider rounded-bl-lg">
                                Recommended
                            </div>
                            <div className="absolute top-[-50px] right-[-50px] w-40 h-40 bg-amber-500/5 blur-3xl pointer-events-none rounded-full" />
                            
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                                        <Crown className="w-4 h-4 text-amber-400" />
                                        Pro Member
                                    </h3>
                                    <p className="text-2xl font-extrabold mt-1 text-white">₹1,499 <span className="text-xs text-[#71717a] font-normal">/ month</span></p>
                                </div>
                                <p className="text-[11px] text-[#a1a1aa] font-medium leading-relaxed">
                                    Unlock full agent routing heuristics, infinite uploader analyses, and live cited assistants.
                                </p>
                                <ul className="space-y-2.5 text-[11px] text-[#a1a1aa] font-medium">
                                    <li className="flex items-center gap-2">
                                        <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                        <span>Dual-pass uploader AI guardian</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                        <span>Unlimited card optimizations</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                        <span>Live assistant engine with citations</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                        <span>Priority 1:1 coaching booking</span>
                                    </li>
                                </ul>
                            </div>
                            <Button 
                                onClick={() => router.push("/sign-up")}
                                className="bg-amber-400 text-black hover:bg-amber-300 font-extrabold w-full text-xs cursor-pointer py-2.5 rounded-lg shadow-lg"
                            >
                                Upgrade to Pro
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t border-neutral-900 bg-[#07080a]">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-[#71717a]">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-emerald-400 flex items-center justify-center text-black font-extrabold text-xs">
                            F
                        </div>
                        <span className="font-bold text-white tracking-tight">FinSprint</span>
                    </div>

                    <p className="font-medium text-center md:text-left">
                        © {new Date().getFullYear()} FinSprint. All rights reserved. Powered by autonomous agent graphs.
                    </p>

                    <div className="flex gap-6 font-semibold">
                        <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-0.5">
                            GitHub <ArrowUpRight className="w-3 h-3" />
                        </a>
                        <a href="#features" className="hover:text-white transition-colors">Privacy</a>
                        <a href="#features" className="hover:text-white transition-colors">Terms</a>
                    </div>
                </div>
            </footer>
        </div>
    )
}

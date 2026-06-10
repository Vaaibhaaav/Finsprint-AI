"use client"

import React, { useState, useRef, DragEvent, ChangeEvent, useEffect } from "react"
import { UploadCloud, FileSpreadsheet, FileText, CheckCircle, AlertCircle, RefreshCw } from "lucide-react"
import { useUserStore } from "@/store/userStore"
import { useTransactionStore } from "@/store/transactionStore"
import { useGoalsStore } from "@/store/goalsStore"
import { useAiFeaturesStore } from "@/store/useAiFeaturesStore"
import { useApi } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

export default function TransactionUploader() {
    const api = useApi()
    const { user } = useUserStore()
    const { transactions } = useTransactionStore()
    const { goals } = useGoalsStore()
    
    const { uploadAndFetchInsights, isLoading, currentError, goEnvelopeStatus, lastInsightsCallTimestamp } = useAiFeaturesStore()
    
    const [file, setFile] = useState<File | null>(null)
    const [dragActive, setDragActive] = useState<boolean>(false)
    const [uploadProgress, setUploadProgress] = useState<number>(0)
    const [validationError, setValidationError] = useState<string | null>(null)
    const [customContext, setCustomContext] = useState<string>("")
    
    const [mounted, setMounted] = useState(false)
    const [timeRemaining, setTimeRemaining] = useState({ days: 0, hours: 0, minutes: 0 })

    const tenDaysInMs = 10 * 24 * 60 * 60 * 1000
    const nextCallTime = lastInsightsCallTimestamp ? lastInsightsCallTimestamp + tenDaysInMs : 0
    const isRateLimited = mounted && lastInsightsCallTimestamp ? (Date.now() < nextCallTime) : false

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (!mounted || !lastInsightsCallTimestamp) return

        const calculateTimeRemaining = () => {
            const now = Date.now()
            const diff = nextCallTime - now
            if (diff <= 0) {
                setTimeRemaining({ days: 0, hours: 0, minutes: 0 })
                return
            }
            const days = Math.floor(diff / (24 * 60 * 60 * 1000))
            const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
            const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000))
            setTimeRemaining({ days, hours, minutes })
        }

        calculateTimeRemaining()
        const interval = setInterval(calculateTimeRemaining, 60000)
        return () => clearInterval(interval)
    }, [mounted, lastInsightsCallTimestamp, nextCallTime])

    const fileInputRef = useRef<HTMLInputElement>(null)

    const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB limit

    const validateFile = (selectedFile: File): boolean => {
        setValidationError(null)
        
        const fileExt = selectedFile.name.split(".").pop()?.toLowerCase()
        if (fileExt !== "pdf" && fileExt !== "csv") {
            setValidationError("Unsupported format. Please upload a PDF or CSV file.")
            return false
        }
        
        if (selectedFile.size > MAX_FILE_SIZE) {
            setValidationError("File is too large. Maximum size allowed is 10MB.")
            return false
        }
        
        return true
    }

    const handleDrag = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true)
        } else if (e.type === "dragleave") {
            setDragActive(false)
        }
    }

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0]
            if (validateFile(droppedFile)) {
                setFile(droppedFile)
            }
        }
    }

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0]
            if (validateFile(selectedFile)) {
                setFile(selectedFile)
            }
        }
    }

    const triggerFileInput = () => {
        fileInputRef.current?.click()
    }

    const handleUpload = async () => {
        if (!file || isRateLimited) return

        setUploadProgress(10)
        const interval = setInterval(() => {
            setUploadProgress((prev) => {
                if (prev >= 90) {
                    clearInterval(interval)
                    return 90
                }
                return prev + 15
            })
        }, 120)

        try {
            await uploadAndFetchInsights(file, api)
            setUploadProgress(100)
        } catch (err) {
            console.error(err)
        } finally {
            clearInterval(interval)
        }
    }

    const handleReset = () => {
        setFile(null)
        setUploadProgress(0)
        setValidationError(null)
        setCustomContext("")
    }

    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return "0 Bytes"
        const k = 1024
        const sizes = ["Bytes", "KB", "MB"]
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    }

    const isPdf = file?.name.toLowerCase().endsWith(".pdf")

    return (
        <div className="bg-[#181a1f] border border-[#27272a]/80 rounded-xl p-6 shadow-2xl relative overflow-hidden transition-all duration-300">
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 blur-3xl pointer-events-none rounded-full" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/5 blur-3xl pointer-events-none rounded-full" />
            
            <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                    <h2 className="text-lg font-semibold text-white tracking-tight mb-1 flex items-center gap-2">
                        <span>Transaction Ingestion Portal</span>
                        {isLoading && (
                            <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />
                        )}
                    </h2>
                    <p className="text-xs text-[#a1a1aa] mb-4">
                        Upload bank account statements for auto-tagging duplicate charges, EMIs, and credit card optimization.
                    </p>

                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept=".pdf,.csv"
                        onChange={handleFileChange}
                        disabled={isLoading || isRateLimited}
                    />

                    {!file ? (
                        <div
                            onDragEnter={!isRateLimited ? handleDrag : undefined}
                            onDragOver={!isRateLimited ? handleDrag : undefined}
                            onDragLeave={!isRateLimited ? handleDrag : undefined}
                            onDrop={!isRateLimited ? handleDrop : undefined}
                            onClick={!isRateLimited ? triggerFileInput : undefined}
                            className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center transition-all duration-300 ${
                                isRateLimited
                                    ? "border-[#27272a]/50 bg-[#121417]/20 text-[#52525b] cursor-not-allowed"
                                    : dragActive
                                        ? "border-[#bdf692] bg-[#bdf692]/5 shadow-[0_0_15px_rgba(189,246,146,0.1)] cursor-pointer"
                                        : "border-[#27272a] hover:border-[#3f3f46] hover:bg-[#1f2128] cursor-pointer"
                            }`}
                        >
                            <div className={`p-3 bg-[#20222a] rounded-full mb-3 transition-colors ${isRateLimited ? "text-[#3f3f46]" : "text-[#a1a1aa] group-hover:text-white"}`}>
                                <UploadCloud className={`w-8 h-8 ${dragActive && !isRateLimited ? "text-[#bdf692] animate-bounce" : ""}`} />
                            </div>
                            {isRateLimited ? (
                                <>
                                    <p className="text-sm font-medium text-[#71717a] mb-1">
                                        Upload Ingestion Locked
                                    </p>
                                    <p className="text-xs text-[#52525b]">
                                        Statement analysis is restricted to 1 call every 10 days
                                    </p>
                                </>
                            ) : (
                                <>
                                    <p className="text-sm font-medium text-white mb-1">
                                        Drag & drop statement or <span className="text-[#bdf692] hover:underline">browse</span>
                                    </p>
                                    <p className="text-xs text-[#71717a]">
                                        Supports PDF and CSV bank formats (Max 10MB)
                                    </p>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="border border-[#27272a] rounded-lg p-5 bg-[#121417]/40 flex items-start gap-4">
                            <div className="p-3 bg-[#20222a] rounded-lg text-emerald-400">
                                {isPdf ? (
                                    <FileText className="w-8 h-8" />
                                ) : (
                                    <FileSpreadsheet className="w-8 h-8" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate mb-1">
                                    {file.name}
                                </p>
                                <p className="text-xs text-[#71717a] mb-2">
                                    {formatBytes(file.size)}
                                </p>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                        Selected
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={handleReset}
                                disabled={isLoading || isRateLimited}
                                className="text-xs text-[#71717a] hover:text-white transition-colors"
                            >
                                Change file
                            </button>
                        </div>
                    )}

                    {/* Rate Limit Info warning banner */}
                    {isRateLimited && (
                        <div className="mt-3 flex items-start gap-2 text-xs text-amber-400 bg-amber-950/20 border border-amber-900/30 rounded-md p-3 animate-fade-in">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold">Analysis rate limit active</p>
                                <p className="text-[#d4d4d8] mt-0.5">
                                    To maintain pipeline throughput, statement uploads are restricted to 1 call per 10 days. Next upload available in: <span className="text-amber-300 font-semibold">{timeRemaining.days}d {timeRemaining.hours}h {timeRemaining.minutes}m</span>
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Validation or store errors */}
                    {(validationError || currentError) && !isRateLimited && (
                        <div className="mt-3 flex items-start gap-2 text-xs text-rose-400 bg-rose-950/20 border border-rose-900/30 rounded-md p-3">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold">Upload issue</p>
                                <p className="text-[#d4d4d8] mt-0.5">{validationError || currentError}</p>
                            </div>
                        </div>
                    )}

                    {goEnvelopeStatus === "success" && !isLoading && (
                        <div className="mt-3 flex items-start gap-2 text-xs text-emerald-400 bg-emerald-950/20 border border-emerald-900/30 rounded-md p-3 animate-fade-in">
                            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold">Ingestion completed</p>
                                <p className="text-[#d4d4d8] mt-0.5">Your transactions have been ingested and analyzed for duplicate charges and rewards optimization.</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Message Context Input side */}
                <div className="flex-1 flex flex-col justify-between">
                    <div>
                        <label className="text-xs font-semibold uppercase tracking-wider text-[#71717a] block mb-2">
                            Custom Context / Message
                        </label>
                        <Textarea
                            placeholder={isRateLimited ? "Custom instruction inputs are locked while rate limit is active." : "Add specific instructions (e.g. 'Identify duplicates larger than 1000' or 'Optimize for lounge access rewards')"}
                            value={customContext}
                            onChange={(e) => setCustomContext(e.target.value)}
                            disabled={isLoading || isRateLimited}
                            className="bg-[#121417] border-[#27272a] text-white placeholder-[#52525b] focus:border-[#bdf692]/50 text-xs min-h-[110px] resize-none rounded-lg disabled:opacity-50"
                        />
                        <p className="text-[10px] text-[#71717a] mt-2">
                            * Custom prompts are ingested as explicit variables in the agent node calculation graphs.
                        </p>
                    </div>

                    <div className="mt-6 flex flex-col gap-2">
                        {isLoading && (
                            <div className="w-full">
                                <div className="flex justify-between items-center mb-1 text-xs font-medium text-white">
                                    <span className="flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                        Processing statement on Go proxy...
                                    </span>
                                    <span>{uploadProgress}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-[#27272a] rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-emerald-500 to-[#bdf692] transition-all duration-300 rounded-full"
                                        style={{ width: `${uploadProgress}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 mt-2">
                            {file && (
                                <Button
                                    variant="outline"
                                    onClick={handleReset}
                                    disabled={isLoading || isRateLimited}
                                    className="border-[#27272a] text-white hover:bg-[#1f2128] transition-all duration-200"
                                >
                                    Cancel
                                </Button>
                            )}
                            <Button
                                onClick={handleUpload}
                                disabled={!file || isLoading || isRateLimited}
                                className={`font-semibold transition-all duration-200 rounded-lg ${
                                    file && !isLoading && !isRateLimited
                                        ? "bg-[#bdf692] text-black hover:bg-[#a6e27c] hover:scale-[1.02] shadow-[0_0_20px_rgba(189,246,146,0.25)]"
                                        : "bg-[#27272a] text-[#71717a] cursor-not-allowed"
                                }`}
                            >
                                {isLoading ? "Processing..." : isRateLimited ? "Rate Limited" : "Analyze Ingestion"}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

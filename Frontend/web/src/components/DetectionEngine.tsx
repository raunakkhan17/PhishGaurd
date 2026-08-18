"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import {
  Search,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  ExternalLink,
  Copy,
  History,
  BarChart3,
  RefreshCw,
  Zap,
  Target,
  Brain,
} from "lucide-react"
import { detectionService, type URLCheckResponse, type DetectionStats } from "../services/detectionService"

import Toast from "./Toast"

const DetectionEngine: React.FC = () => {
  const [url, setUrl] = useState("")
  const [isScanning, setIsScanning] = useState(false)
  const [result, setResult] = useState<URLCheckResponse | null>(null)
  const [scanHistory, setScanHistory] = useState<URLCheckResponse[]>([])
  const [stats, setStats] = useState<DetectionStats | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<{
    message: string
    type: "success" | "error"
    isVisible: boolean
  } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
    loadStats()
    loadHistory()
  }, [])

  const loadStats = () => {
    const currentStats = detectionService.getStats()
    setStats(currentStats)
  }

  const loadHistory = () => {
    const history = detectionService.getHistory()
    setScanHistory(history)
  }

  const handleScan = async () => {
    if (!url.trim()) return

    setIsScanning(true)
    setResult(null)
    setError(null)

    try {
      const scanResult = await detectionService.checkURL(url)
      setResult(scanResult)
      loadStats() // Refresh stats
      loadHistory() // Refresh history

      setToast({
        message: "URL analysis completed successfully!",
        type: "success",
        isVisible: true,
      })
    } catch (err: any) {
      const errorMessage = err?.message || err?.response?.data?.message || "Failed to analyze URL. Please try again."
      setError(errorMessage)
      setToast({
        message: errorMessage,
        type: "error",
        isVisible: true,
      })
      console.error("Scan failed:", err)
    } finally {
      setIsScanning(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setToast({
        message: "Copied to clipboard!",
        type: "success",
        isVisible: true,
      })
    } catch (error) {
      setToast({
        message: "Failed to copy to clipboard",
        type: "error",
        isVisible: true,
      })
    }
  }

  const handleHistoryItemClick = (item: URLCheckResponse) => {
    setUrl(item.url)
    setResult(item)
    setShowHistory(false)
  }

  const clearHistory = () => {
    detectionService.clearHistory()
    setScanHistory([])
    setToast({
      message: "Scan history cleared!",
      type: "success",
      isVisible: true,
    })
  }

  const resetStats = () => {
    detectionService.resetStats()
    loadStats()
    setToast({
      message: "Statistics reset!",
      type: "success",
      isVisible: true,
    })
  }

  const closeToast = () => {
    setToast(null)
  }

  const getSafetyColor = (rating: string) => {
    switch (rating) {
      case "SAFE":
        return "text-emerald-600 bg-emerald-100"
      case "SUSPICIOUS":
        return "text-yellow-600 bg-yellow-100"
      case "DANGEROUS":
        return "text-red-600 bg-red-100"
      default:
        return "text-gray-600 bg-gray-100"
    }
  }

  const getSafetyIcon = (rating: string) => {
    switch (rating) {
      case "SAFE":
        return <CheckCircle className="h-8 w-8 text-emerald-600" />
      case "SUSPICIOUS":
        return <AlertTriangle className="h-8 w-8 text-yellow-600" />
      case "DANGEROUS":
        return <AlertTriangle className="h-8 w-8 text-red-600" />
      default:
        return <Shield className="h-8 w-8 text-gray-600" />
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreBarColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100
    if (percentage >= 80) return "bg-emerald-500"
    if (percentage >= 60) return "bg-yellow-500"
    return "bg-red-500"
  }

  const getEnhancedScoreColor = (percentage: number) => {
    if (percentage >= 90) return "from-emerald-500 to-emerald-600"
    if (percentage >= 80) return "from-green-500 to-green-600"
    if (percentage >= 70) return "from-yellow-500 to-yellow-600"
    if (percentage >= 50) return "from-orange-500 to-orange-600"
    return "from-red-500 to-red-600"
  }

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case "low":
        return "bg-emerald-100 text-emerald-800 border-emerald-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "critical":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getRiskLevelIcon = (level: string) => {
    switch (level) {
      case "low":
        return <CheckCircle className="h-4 w-4" />
      case "medium":
        return <AlertTriangle className="h-4 w-4" />
      case "high":
        return <AlertTriangle className="h-4 w-4" />
      case "critical":
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Shield className="h-4 w-4" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatDomainAge = (days: number) => {
    if (days > 365) {
      const years = Math.floor(days / 365)
      return `${years} year${years > 1 ? "s" : ""}`
    }
    return `${days} day${days > 1 ? "s" : ""}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Toast Notification */}
      {toast && <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={closeToast} />}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="text-center mb-6">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-semibold mb-2">
            <Brain className="h-3 w-3" />
            <span>Powered by KAYACH</span>
            <Zap className="h-3 w-3" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent mb-2">
            Advanced Phishing Detection
          </h1>
          <p className="text-sm text-gray-600 max-w-2xl mx-auto mb-4 leading-relaxed">
            Analyze URLs in real-time using intelligence to protect yourself from phishing.
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-4 mb-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Input Section */}
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-800 mb-2 flex items-center">
                <Target className="h-3 w-3 mr-1 text-blue-600" />
                Enter URL to Analyze
              </label>
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleScan()}
                  placeholder="https://example.com or www.example.com..."
                  className="w-full px-3 py-2 pr-10 text-sm border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-100 focus:outline-none transition-all duration-300 bg-white/90"
                  disabled={isScanning}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                <button
                  onClick={handleScan}
                  disabled={!url.trim() || isScanning}
                  className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-bold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm"
                >
                  {isScanning ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Shield className="h-3 w-3" />
                      <span>Analyze URL</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg font-semibold hover:bg-gray-200 transition-all duration-300 border-2 border-gray-200 hover:border-gray-300 text-sm"
                >
                  <History className="h-3 w-3" />
                  <span>History ({scanHistory.length})</span>
                </button>
              </div>

              {/* Error Display */}
              {error && (
                <div className="mt-3 bg-red-50 border-2 border-red-200 text-red-700 px-3 py-2 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-3 w-3" />
                    <span className="font-semibold text-xs">{error}</span>
                  </div>
                </div>
              )}

              {/* History Dropdown */}
              {showHistory && (
                <div className="absolute z-10 mt-2 w-full bg-white rounded-lg shadow-2xl border border-gray-200 max-h-48 overflow-y-auto">
                  <div className="p-2 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-lg">
                    <h4 className="font-bold text-gray-800 text-xs">Scan History</h4>
                    <button
                      onClick={clearHistory}
                      className="text-red-600 hover:text-red-800 font-semibold text-xs px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                  {scanHistory.length === 0 ? (
                    <div className="p-3 text-center text-gray-500">
                      <History className="h-4 w-4 mx-auto mb-1 opacity-50" />
                      <p className="text-xs">No scan history yet</p>
                    </div>
                  ) : (
                    scanHistory.map((item, index) => (
                      <button
                        key={index}
                        onClick={() => handleHistoryItemClick(item)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-gray-900 truncate">{item.url}</span>
                          <div
                            className={`flex items-center space-x-1 px-2 py-0.5 rounded-full ${getSafetyColor(item.safetyRating)}`}
                          >
                            <span className="text-xs font-bold">{item.score}%</span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">{formatDate(item.timestamp)}</div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="lg:w-64">
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-3 rounded-lg border-2 border-blue-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-800 flex items-center text-xs">
                    <BarChart3 className="h-3 w-3 mr-1 text-blue-600" />
                    Live Statistics
                  </h3>
                  <button
                    onClick={resetStats}
                    className="text-blue-600 hover:text-blue-800 p-1 rounded-lg hover:bg-blue-100 transition-colors"
                    title="Reset Statistics"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </button>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-white rounded-lg shadow-sm">
                    <span className="text-gray-600 font-medium text-xs">URLs Analyzed</span>
                    <span className="font-bold text-lg text-blue-600">
                      {stats?.totalUrlsAnalyzed.toLocaleString() || "0"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white rounded-lg shadow-sm">
                    <span className="text-gray-600 font-medium text-xs">Threats Blocked</span>
                    <span className="font-bold text-lg text-red-600">
                      {stats?.threatsDetected.toLocaleString() || "0"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white rounded-lg shadow-sm">
                    <span className="text-gray-600 font-medium text-xs">Success Rate</span>
                    <span className="font-bold text-lg text-emerald-600">
                      {stats?.successRate.toFixed(1) || "100"}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {isScanning && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 mb-4">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mb-3 animate-pulse">
                <div className="animate-spin rounded-full h-6 w-6 border-3 border-white border-t-transparent"></div>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-1">HGC Algorithm Processing...</h3>
              <p className="text-gray-600 mb-3 text-xs">Advanced threat detection in progress</p>
              <div className="max-w-sm mx-auto bg-gray-200 rounded-full h-1.5 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-full rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        )}

        {result && !isScanning && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-4 mb-4 animate-fadeIn">
            <div
              className={`p-4 rounded-lg mb-4 border-2 ${
                result.safetyRating === "SAFE"
                  ? "bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200"
                  : result.safetyRating === "SUSPICIOUS"
                    ? "bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200"
                    : "bg-gradient-to-r from-red-50 to-pink-50 border-red-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className={`p-2 rounded-lg ${
                      result.safetyRating === "SAFE"
                        ? "bg-emerald-100"
                        : result.safetyRating === "SUSPICIOUS"
                          ? "bg-yellow-100"
                          : "bg-red-100"
                    }`}
                  >
                    {getSafetyIcon(result.safetyRating)}
                  </div>
                  <div>
                    <h2
                      className={`text-lg font-bold mb-1 ${
                        result.safetyRating === "SAFE"
                          ? "text-emerald-800"
                          : result.safetyRating === "SUSPICIOUS"
                            ? "text-yellow-800"
                            : "text-red-800"
                      }`}
                    >
                      {result.safetyRating === "SAFE"
                        ? "SECURE URL ✓"
                        : result.safetyRating === "SUSPICIOUS"
                          ? "SUSPICIOUS URL ⚠️"
                          : "DANGEROUS URL ⛔"}
                    </h2>
                    <div className="flex items-center space-x-2">
                      <div className={`px-2 py-1 rounded-full border-2 ${getRiskLevelColor(result.safetyLevel)}`}>
                        <div className="flex items-center space-x-1">
                          {getRiskLevelIcon(result.safetyLevel)}
                          <span className="font-bold text-xs">Risk: {result.safetyLevel.toUpperCase()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-1">
                  <button
                    onClick={() => copyToClipboard(result.url)}
                    className="p-2 bg-white rounded-lg border-2 border-gray-300 hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md"
                    title="Copy URL"
                  >
                    <Copy className="h-3 w-3 text-gray-600" />
                  </button>
                  <a
                    href={result.url.startsWith("http") ? result.url : `https://${result.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-white rounded-lg border-2 border-gray-300 hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md"
                    title="Open URL (use caution)"
                  >
                    <ExternalLink className="h-3 w-3 text-gray-600" />
                  </a>
                </div>
              </div>
            </div>

            {/* Key Security Findings */}
            {result.topReasons && result.topReasons.length > 0 && (
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2 text-orange-600" />
                  Key Security Findings
                </h3>
                <div className="bg-gradient-to-br from-orange-50 to-yellow-50 p-4 rounded-lg border-2 border-orange-200">
                  <div className="grid gap-2">
                    {result.topReasons.map((reason, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-orange-600 font-bold text-xs">{index + 1}</span>
                        </div>
                        <span className="text-sm text-gray-700 font-medium">{reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Security Analysis Breakdown */}
            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                <Shield className="h-4 w-4 mr-2 text-blue-600" />
                Security Analysis Breakdown
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(result.breakdown).map(([category, data]) => {
                  const percentage = Math.round((data.score / data.maxScore) * 100)
                  return (
                    <div
                      key={category}
                      className="bg-gradient-to-br from-gray-50 to-white p-3 rounded-lg border-2 border-gray-100 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-bold text-gray-800 text-sm capitalize">
                          {category.replace(/([A-Z])/g, " $1").trim()}
                        </h4>
                        <div className="text-right">
                          <div className={`text-lg font-bold ${getScoreColor(percentage)}`}>
                            {data.score}/{data.maxScore}
                          </div>
                          <div className={`text-sm font-bold ${getScoreColor(percentage)}`}>{percentage}%</div>
                        </div>
                      </div>

                      <div className="bg-gray-200 rounded-full h-1.5 mb-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${getScoreBarColor(data.score, data.maxScore)}`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>

                      <div className="space-y-1">
                        {data.reasons.map((reason, index) => (
                          <div key={index} className="flex items-start space-x-2">
                            <div
                              className={`w-1 h-1 rounded-full mt-1.5 ${getScoreBarColor(data.score, data.maxScore)}`}
                            ></div>
                            <span className="text-xs text-gray-700 font-medium">{reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Domain Information (WHOIS) */}
            {result.rawData?.whois && (
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                  <Search className="h-4 w-4 mr-2 text-purple-600" />
                  Domain Information (WHOIS)
                </h3>
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-4 rounded-lg border-2 border-purple-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <div className="text-xs text-gray-500 font-semibold mb-1">Domain Name</div>
                      <div className="text-sm font-bold text-gray-800">{result.rawData.whois.domainName || "N/A"}</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <div className="text-xs text-gray-500 font-semibold mb-1">Registrar</div>
                      <div className="text-sm font-bold text-gray-800">{result.rawData.whois.registrar || "N/A"}</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <div className="text-xs text-gray-500 font-semibold mb-1">Domain Age</div>
                      <div className="text-sm font-bold text-gray-800">
                        {result.rawData.whois.estimatedDomainAge
                          ? formatDomainAge(result.rawData.whois.estimatedDomainAge)
                          : "N/A"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SSL Certificate & Reputation Analysis */}
            {result.rawData?.reputation && (
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                  SSL Certificate & Reputation Analysis
                </h3>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border-2 border-green-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <div className="text-xs text-gray-500 font-semibold mb-1">Analysis Mode</div>
                      <div className="text-sm font-bold text-gray-800 capitalize">
                        {result.rawData.reputation.mode || "N/A"}
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <div className="text-xs text-gray-500 font-semibold mb-1">Reputation Score</div>
                      <div
                        className={`text-lg font-bold ${getScoreColor(result.rawData.reputation.reputationScore || 0)}`}
                      >
                        {result.rawData.reputation.reputationScore || 0}/100
                      </div>
                    </div>
                  </div>

                  {/* SSL Certificate Tests */}
                  {result.rawData.reputation.testResults && result.rawData.reputation.testResults.length > 0 && (
                    <div>
                      <h4 className="font-bold text-gray-800 mb-2 text-sm">SSL Certificate Tests</h4>
                      <div className="space-y-2">
                        {result.rawData.reputation.testResults.map((test, index) => (
                          <div key={index} className="bg-white p-3 rounded-lg shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold text-sm text-gray-800">{test.test}</span>
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-semibold">
                                Test #{test.testCode}
                              </span>
                            </div>
                            {test.warnings && test.warnings.length > 0 && (
                              <div className="space-y-1">
                                {test.warnings.map((warning, wIndex) => (
                                  <div key={wIndex} className="flex items-start space-x-2">
                                    <AlertTriangle className="h-3 w-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                                    <div>
                                      <span className="text-xs text-gray-700">{warning.warningDescription}</span>
                                      <span className="text-xs text-gray-500 ml-2">(Code: {warning.warningCode})</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Threat Intelligence Analysis */}
            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                <Shield className="h-4 w-4 mr-2 text-red-600" />
                Threat Intelligence Analysis
              </h3>
              <div className="bg-gradient-to-br from-red-50 to-pink-50 p-4 rounded-lg border-2 border-red-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <div className="text-xs text-gray-500 font-semibold mb-1">Total Threats</div>
                    <div
                      className={`text-2xl font-bold ${(result.rawData?.threatIntelligence?.total || 0) === 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {result.rawData?.threatIntelligence?.total || 0}
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <div className="text-xs text-gray-500 font-semibold mb-1">Threat Status</div>
                    <div
                      className={`text-sm font-bold ${(result.rawData?.threatIntelligence?.total || 0) === 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {(result.rawData?.threatIntelligence?.total || 0) === 0 ? "CLEAN" : "THREATS DETECTED"}
                    </div>
                  </div>
                </div>

                {result.rawData?.threatIntelligence?.results && result.rawData.threatIntelligence.results.length > 0 ? (
                  <div className="mt-4">
                    <h4 className="font-bold text-gray-800 mb-2 text-sm">Detected Threats</h4>
                    <div className="space-y-2">
                      {result.rawData.threatIntelligence.results.map((threat, index) => (
                        <div key={index} className="bg-white p-3 rounded-lg shadow-sm border-l-4 border-red-500">
                          <div className="text-sm font-semibold text-red-800">{threat}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 text-center">
                    <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-green-700">No threats detected in our database</p>
                  </div>
                )}
              </div>
            </div>

            {/* Overall Security Summary */}
            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                <BarChart3 className="h-4 w-4 mr-2 text-blue-600" />
                Overall Security Summary
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-100">
                  <div
                    className={`text-3xl font-bold mb-2 bg-gradient-to-r ${getEnhancedScoreColor(result.scorePercentage)} bg-clip-text text-transparent`}
                  >
                    {result.score}/{result.maxScore}
                  </div>
                  <div className={`text-xl font-bold ${getScoreColor(result.scorePercentage)}`}>
                    {result.scorePercentage}%
                  </div>
                  <p className="text-xs text-gray-600 font-semibold mt-2">Overall Safety Score</p>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg border-2 border-emerald-100">
                  <div
                    className={`text-3xl font-bold mb-2 bg-gradient-to-r ${getEnhancedScoreColor(result.rawData?.reputation?.reputationScore || 0)} bg-clip-text text-transparent`}
                  >
                    {result.rawData?.reputation?.reputationScore || 0}/100
                  </div>
                  <div
                    className={`text-xl font-bold ${getScoreColor(result.rawData?.reputation?.reputationScore || 0)}`}
                  >
                    {result.rawData?.reputation?.reputationScore || 0}%
                  </div>
                  <p className="text-xs text-gray-600 font-semibold mt-2">Reputation Score</p>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-red-50 to-pink-50 rounded-lg border-2 border-red-100">
                  <div
                    className={`text-3xl font-bold mb-2 ${(result.rawData?.threatIntelligence?.total || 0) === 0 ? "text-emerald-600" : "text-red-600"}`}
                  >
                    {result.rawData?.threatIntelligence?.total || 0}
                  </div>
                  <div
                    className={`text-xl font-bold ${(result.rawData?.threatIntelligence?.total || 0) === 0 ? "text-emerald-600" : "text-red-600"}`}
                  >
                    {(result.rawData?.threatIntelligence?.total || 0) === 0 ? "0%" : "100%"}
                  </div>
                  <p className="text-xs text-gray-600 font-semibold mt-2">Threats Detected</p>
                </div>
              </div>
            </div>

            {/* Analysis Timestamp */}
            <div className="text-center text-xs text-gray-500 border-t-2 border-gray-100 pt-3">
              <div className="flex items-center justify-center space-x-2">
                <Clock className="h-3 w-3" />
                <span>Analysis completed: {formatDate(result.timestamp)}</span>
              </div>
            </div>
          </div>
        )}

        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl text-white p-4 shadow-xl">
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold mb-2">🛡️ KAYACH Protection Tips</h2>
            <p className="text-blue-100 text-sm">Stay ahead of cyber threats with our advanced detection system</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20 hover:bg-white/20 transition-all duration-300">
              <Shield className="h-6 w-6 mb-2 text-blue-200" />
              <h3 className="font-bold text-base mb-1">Verify Before You Click</h3>
              <p className="text-blue-100 leading-relaxed text-xs">
                Always analyze suspicious URLs with our HGC algorithm before entering sensitive information.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20 hover:bg-white/20 transition-all duration-300">
              <Brain className="h-6 w-6 mb-2 text-purple-200" />
              <h3 className="font-bold text-base mb-1">AI-Powered Detection</h3>
              <p className="text-blue-100 leading-relaxed text-xs">
                Our advanced AI analyzes 50+ security indicators in real-time for maximum protection.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20 hover:bg-white/20 transition-all duration-300">
              <Zap className="h-6 w-6 mb-2 text-yellow-200" />
              <h3 className="font-bold text-base mb-1">Lightning Fast Analysis</h3>
              <p className="text-blue-100 leading-relaxed text-xs">
                Get comprehensive security reports in seconds, not minutes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DetectionEngine

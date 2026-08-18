"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import {
  Search,
  MessageCircle,
  ThumbsUp,
  Eye,
  BookOpen,
  Star,
  AlertTriangle,
  Globe,
  Plus,
  ArrowRight,
} from "lucide-react"
import { forumService, type ForumPost } from "../services/forumService"
import { educationService, type EducationResource } from "../services/educationService"

import Toast from "./Toast"

const CommunityHub: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [activeTab, setActiveTab] = useState("forums")

  // Forum states
  const [forumPosts, setForumPosts] = useState<ForumPost[]>([])
  const [forumLoading, setForumLoading] = useState(false)
  const [forumPagination, setForumPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalResults: 0,
  })

  // Education states
  const [educationResources, setEducationResources] = useState<EducationResource[]>([])
  const [educationLoading, setEducationLoading] = useState(false)
  const [educationPagination, setEducationPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalResults: 0,
  })

  // Search and filters
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [sortBy, setSortBy] = useState<"latest" | "oldest" | "mostLiked" | "mostViewed">("latest")

  // Toast state
  const [toast, setToast] = useState<{
    message: string
    type: "success" | "error"
    isVisible: boolean
  } | null>(null)

  // Load forum posts
  const loadForumPosts = async (page = 1) => {
    try {
      setForumLoading(true)
      const response = await forumService.getPosts({
        page,
        limit: 10,
        category: selectedCategory || undefined,
        sort: sortBy,
      })
      setForumPosts(response.forums)
      setForumPagination(response.pagination)
      console.log("Forum API Response:", response)
    } catch (error) {
      console.error("Error loading forum posts:", error)
      setToast({
        message: "Failed to load forum posts",
        type: "error",
        isVisible: true,
      })
    } finally {
      setForumLoading(false)
    }
  }

  // Load education resources
  const loadEducationResources = async (page = 1) => {
    try {
      setEducationLoading(true)
      const response = await educationService.getResources({
        page,
        limit: 10,
        category: selectedCategory || undefined,
      })
      setEducationResources(response.resources)
      setEducationPagination(response.pagination)
    } catch (error) {
      console.error("Error loading education resources:", error)
      setToast({
        message: "Failed to load education resources",
        type: "error",
        isVisible: true,
      })
    } finally {
      setEducationLoading(false)
    }
  }

  // Handle tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setSearchTerm("")
    setSelectedCategory("")
    setSortBy("latest")

    if (tab === "forums") {
      loadForumPosts(1)
    } else if (tab === "education") {
      loadEducationResources(1)
    }
  }

  // Handle search
  const handleSearch = () => {
    if (activeTab === "forums") {
      loadForumPosts(1)
    } else if (activeTab === "education") {
      loadEducationResources(1)
    }
  }

  // Handle pagination
  const handlePageChange = (page: number) => {
    if (activeTab === "forums") {
      loadForumPosts(page)
    } else if (activeTab === "education") {
      loadEducationResources(page)
    }
  }

  // Handle add resource
  const handleAddResource = () => {
    navigate("/create-education-resource")
  }

  // Handle report website
  const handleReportWebsite = () => {
    navigate("/report-website")
  }

  // Close toast
  const closeToast = () => {
    setToast(null)
  }

  // Load initial data
  useEffect(() => {
    if (activeTab === "forums") {
      loadForumPosts(1)
    } else if (activeTab === "education") {
      loadEducationResources(1)
    }
  }, [activeTab])

  // Show success message from navigation state
  useEffect(() => {
    if (location.state?.message) {
      setToast({
        message: location.state.message,
        type: "success",
        isVisible: true,
      })
      // Clear the message from location state
      navigate(location.pathname, { replace: true })
    }
  }, [location.state, navigate, location.pathname])

  // Render forum posts
  const renderForum = () => (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search discussions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
            >
              <option value="">All Categories</option>
              <option value="phishing">🎣 Phishing</option>
              <option value="malware">🦠 Malware</option>
              <option value="social-engineering">🎭 Social Engineering</option>
              <option value="general">💬 General</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "latest" | "oldest" | "mostLiked" | "mostViewed")}
              className="px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
            >
              <option value="latest">🕒 Latest</option>
              <option value="mostLiked">❤️ Most Popular</option>
              <option value="oldest">📅 Oldest</option>
            </select>
            <button
              onClick={handleSearch}
              className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 text-sm font-medium shadow-sm"
            >
              Search
            </button>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={() => navigate("/create-post")}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 text-sm font-medium shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Start Discussion
          </button>
        </div>
      </div>

      {forumLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 text-gray-500 text-sm">Loading discussions...</p>
        </div>
      ) : forumPosts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <MessageCircle className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No discussions found</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {forumPosts.map((post) => (
            <div
              key={post._id}
              className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md hover:border-gray-200 transition-all duration-200 cursor-pointer group"
              onClick={() => navigate(`/forum/${post._id}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {post.title}
                </h3>
                <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ml-3">
                  {post.category}
                </span>
              </div>

              <p className="text-gray-600 mb-3 line-clamp-2 text-sm leading-relaxed">{post.content}</p>

              <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                <div className="flex items-center gap-1">
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {(post.author?.name || "U")[0].toUpperCase()}
                  </div>
                  <span className="font-medium">{post.author?.name || "Unknown"}</span>
                </div>
                <span>{new Date(post.createdAt).toLocaleDateString()}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>{post.meta?.comments || 0}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ThumbsUp className="h-3.5 w-3.5" />
                    <span>{post.meta?.likes || 0}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" />
                    <span>{(post.meta?.views || 0).toLocaleString()}</span>
                  </div>
                </div>

                {post.tags && post.tags.length > 0 && (
                  <div className="flex gap-1">
                    {post.tags.slice(0, 2).map((tag, index) => (
                      <span key={index} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                        {tag}
                      </span>
                    ))}
                    {post.tags.length > 2 && <span className="text-gray-400 text-xs">+{post.tags.length - 2}</span>}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {forumPagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => handlePageChange(forumPagination.page - 1)}
            disabled={forumPagination.page === 1}
            className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm"
          >
            Previous
          </button>
          <span className="px-3 py-1.5 text-gray-600 text-sm">
            {forumPagination.page} / {forumPagination.totalPages}
          </span>
          <button
            onClick={() => handlePageChange(forumPagination.page + 1)}
            disabled={forumPagination.page === forumPagination.totalPages}
            className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )

  // Render education resources
  const renderEducation = () => (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Learning Resources</h2>
            <p className="text-sm text-gray-500 mt-1">Enhance your cybersecurity knowledge</p>
          </div>
          <button
            onClick={handleAddResource}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-2 rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 text-sm font-medium shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Add Resource
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search resources..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm bg-white"
            >
              <option value="">All Levels</option>
              <option value="beginner">🌱 Beginner</option>
              <option value="intermediate">🚀 Intermediate</option>
              <option value="advanced">⚡ Advanced</option>
            </select>
            <button
              onClick={handleSearch}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 text-sm font-medium shadow-sm"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      {educationLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-3 text-gray-500 text-sm">Loading resources...</p>
        </div>
      ) : educationResources.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <BookOpen className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No resources found</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {educationResources.map((resource) => (
            <div
              key={resource._id}
              className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md hover:border-gray-200 transition-all duration-200 group"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 group-hover:text-emerald-600 transition-colors">
                  {resource.title}
                </h3>
                <div className="flex items-center gap-2 ml-3">
                  <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap">
                    {resource.category}
                  </span>
                  <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap">
                    {resource.resourceType}
                  </span>
                </div>
              </div>

              <p className="text-gray-600 mb-3 line-clamp-2 text-sm leading-relaxed">{resource.description}</p>

              <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                <div className="flex items-center gap-1">
                  <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {(resource.author?.name || "U")[0].toUpperCase()}
                  </div>
                  <span className="font-medium">{resource.author?.name || "Unknown"}</span>
                </div>
                <span>{new Date(resource.createdAt).toLocaleDateString()}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" />
                    <span>{resource.views.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 text-yellow-500" />
                    <span>{resource.averageRating.toFixed(1)}</span>
                  </div>
                </div>

                {resource.topics && resource.topics.length > 0 && (
                  <div className="flex gap-1">
                    {resource.topics.slice(0, 2).map((topic, index) => (
                      <span key={index} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                        {topic}
                      </span>
                    ))}
                    {resource.topics.length > 2 && (
                      <span className="text-gray-400 text-xs">+{resource.topics.length - 2}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {educationPagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => handlePageChange(educationPagination.page - 1)}
            disabled={educationPagination.page === 1}
            className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm"
          >
            Previous
          </button>
          <span className="px-3 py-1.5 text-gray-600 text-sm">
            {educationPagination.page} / {educationPagination.totalPages}
          </span>
          <button
            onClick={() => handlePageChange(educationPagination.page + 1)}
            disabled={educationPagination.page === educationPagination.totalPages}
            className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )

  // Render report website
  const renderReportWebsite = () => (
    <div className="bg-white rounded-xl border border-gray-100 p-8">
      <div className="text-center max-w-md mx-auto">
        <div className="bg-gradient-to-br from-red-500 to-red-600 p-6 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center shadow-lg">
          <AlertTriangle className="h-10 w-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Report Malicious Website</h2>
        <p className="text-gray-600 mb-8 text-sm leading-relaxed">
          Help protect our community by reporting suspicious or malicious websites. Your reports contribute to a safer
          internet for everyone.
        </p>
        <button
          onClick={handleReportWebsite}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 font-medium shadow-sm"
        >
          <Globe className="h-5 w-5" />
          Report Website
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Toast Notification */}
      {toast && <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={closeToast} />}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex space-x-1 bg-white p-1 rounded-xl shadow-sm border border-gray-100 mb-6">
          <button
            onClick={() => handleTabChange("forums")}
            className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 ${
              activeTab === "forums"
                ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <MessageCircle className="h-4 w-4" />
              <span className="text-sm">Forums</span>
            </div>
          </button>

          <button
            onClick={() => handleTabChange("education")}
            className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 ${
              activeTab === "education"
                ? "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="text-sm">Education</span>
            </div>
          </button>

          <button
            onClick={() => handleTabChange("report")}
            className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 ${
              activeTab === "report"
                ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">Report</span>
            </div>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "forums" && renderForum()}
        {activeTab === "education" && renderEducation()}
        {activeTab === "report" && renderReportWebsite()}
      </div>
    </div>
  )
}

export default CommunityHub

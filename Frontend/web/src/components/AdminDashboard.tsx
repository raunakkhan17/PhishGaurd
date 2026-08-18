import React, { useState, useEffect } from 'react';
import { 
  Shield, AlertTriangle, CheckCircle, XCircle, Clock, Globe, 
  Eye, Users, BarChart3, Search, Filter, ChevronDown, ChevronUp,
  MessageSquare, Calendar, Tag, ExternalLink
} from 'lucide-react';
import { adminService, AdminWebsite, AdminDashboardStats } from '../services/adminService';
import Header from './Header';
import Toast from './Toast';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [pendingWebsites, setPendingWebsites] = useState<AdminWebsite[]>([]);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedWebsite, setSelectedWebsite] = useState<AdminWebsite | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
    isVisible: boolean;
  } | null>(null);

  // Load dashboard stats
  const loadDashboardStats = async () => {
    try {
      setStatsLoading(true);
      const statsData = await adminService.getDashboardStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      setToast({
        message: 'Failed to load dashboard statistics',
        type: 'error',
        isVisible: true
      });
    } finally {
      setStatsLoading(false);
    }
  };

  // Load pending websites
  const loadPendingWebsites = async (page = 1) => {
    try {
      setLoading(true);
      const response = await adminService.getPendingWebsites(page, 10);
      setPendingWebsites(response.websites);
      setTotalPages(response.pagination.totalPages);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error loading pending websites:', error);
      setToast({
        message: 'Failed to load pending websites',
        type: 'error',
        isVisible: true
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle approve website
  const handleApprove = async (websiteId: string) => {
    try {
      setActionLoading(true);
      await adminService.approveWebsite(websiteId, reviewNotes);
      
      setToast({
        message: 'Website approved successfully',
        type: 'success',
        isVisible: true
      });
      
      // Refresh data
      loadPendingWebsites(currentPage);
      loadDashboardStats();
      setSelectedWebsite(null);
      setReviewNotes('');
    } catch (error) {
      console.error('Error approving website:', error);
      setToast({
        message: 'Failed to approve website',
        type: 'error',
        isVisible: true
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle reject website
  const handleReject = async (websiteId: string) => {
    if (!reviewNotes.trim()) {
      setToast({
        message: 'Please provide review notes for rejection',
        type: 'error',
        isVisible: true
      });
      return;
    }

    try {
      setActionLoading(true);
      await adminService.rejectWebsite(websiteId, reviewNotes);
      
      setToast({
        message: 'Website rejected successfully',
        type: 'success',
        isVisible: true
      });
      
      // Refresh data
      loadPendingWebsites(currentPage);
      loadDashboardStats();
      setSelectedWebsite(null);
      setReviewNotes('');
    } catch (error) {
      console.error('Error rejecting website:', error);
      setToast({
        message: 'Failed to reject website',
        type: 'error',
        isVisible: true
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Close toast
  const closeToast = () => {
    setToast(null);
  };

  // Load initial data
  useEffect(() => {
    loadDashboardStats();
    loadPendingWebsites(1);
  }, []);

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get category display name
  const getCategoryDisplayName = (category: string) => {
    return category.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={toast.isVisible}
          onClose={closeToast}
        />
      )}
      
      {/* <Header activeSection="admin" onSectionChange={() => {}} /> */}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage flagged websites and monitor community reports</p>
        </div>

        {/* Statistics Cards */}
        {statsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
                <div className="h-8 bg-gray-200 rounded mb-4"></div>
                <div className="h-6 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {/* Total Websites */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Websites</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalWebsites}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <Globe className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Pending Reviews */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats.statusCounts.pending}</p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-full">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </div>

            {/* Approved */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Approved</p>
                  <p className="text-3xl font-bold text-green-600">{stats.statusCounts.approved}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            {/* Rejected */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Rejected</p>
                  <p className="text-3xl font-bold text-red-600">{stats.statusCounts.rejected}</p>
                </div>
                <div className="bg-red-100 p-3 rounded-full">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pending Websites Section */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Pending Reviews</h2>
            <div className="flex items-center space-x-2">
              <div className="bg-yellow-100 p-2 rounded-full">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              <span className="text-sm font-medium text-gray-600">
                {pendingWebsites.length} websites awaiting review
              </span>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading pending websites...</p>
            </div>
          ) : pendingWebsites.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
              <p className="text-gray-600">No pending websites to review</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingWebsites.map((website) => (
                <div key={website._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSeverityColor(website.severity)}`}>
                          {website.severity.toUpperCase()}
                        </span>
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                          {getCategoryDisplayName(website.category)}
                        </span>
                        <span className="text-gray-500 text-sm">
                          {new Date(website.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{website.title}</h3>
                      <p className="text-gray-600 mb-3">{website.description}</p>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                        <div className="flex items-center space-x-2">
                          <Globe className="h-4 w-4" />
                          <span className="text-red-600 font-mono">{website.url}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4" />
                          <span>Reported by {website.submittedBy.name}</span>
                        </div>
                      </div>
                      
                      {website.evidence && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                          <p className="text-red-800 text-sm">
                            <strong>Evidence:</strong> {website.evidence}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="ml-4 flex flex-col space-y-2">
                      <button
                        onClick={() => setSelectedWebsite(website)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        Approve
                      </button>
                      <a
                        href={website.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm flex items-center space-x-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span>Visit</span>
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center space-x-2 mt-6">
              <button
                onClick={() => loadPendingWebsites(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => loadPendingWebsites(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {selectedWebsite && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Review Website</h3>
                <button
                  onClick={() => setSelectedWebsite(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4 mb-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">{selectedWebsite.title}</h4>
                  <p className="text-gray-600">{selectedWebsite.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">URL:</span>
                    <p className="text-red-600 font-mono break-all">{selectedWebsite.url}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Category:</span>
                    <p>{getCategoryDisplayName(selectedWebsite.category)}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Severity:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(selectedWebsite.severity)}`}>
                      {selectedWebsite.severity.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Reported by:</span>
                    <p>{selectedWebsite.submittedBy.name}</p>
                  </div>
                </div>
                
                {selectedWebsite.evidence && (
                  <div>
                    <span className="font-medium text-gray-700">Evidence:</span>
                    <p className="text-gray-600 mt-1">{selectedWebsite.evidence}</p>
                  </div>
                )}
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Review Notes
                </label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add your review notes here..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedWebsite(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReject(selectedWebsite._id)}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {actionLoading ? 'Rejecting...' : 'Reject'}
                </button>
                <button
                  onClick={() => handleApprove(selectedWebsite._id)}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {actionLoading ? 'Approving...' : 'Approve'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

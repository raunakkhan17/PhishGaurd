import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, Globe, Shield, CheckCircle, XCircle, Clock, 
  Search, Filter, Eye, Users, Calendar, Tag, ExternalLink,
  BarChart3, TrendingUp
} from 'lucide-react';
import { directoryService, FlaggedWebsite } from '../services/directoryService';
import Header from './Header';
import Toast from './Toast';

const PublicDirectory: React.FC = () => {
  const [websites, setWebsites] = useState<FlaggedWebsite[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalResults: 0
  });
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('');

  // Toast state
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
    isVisible: boolean;
  } | null>(null);

  // Load flagged websites
  const loadWebsites = async (page = 1) => {
    try {
      setLoading(true);
      const response = await directoryService.getWebsites({
        page,
        limit: 10,
        category: selectedCategory || undefined,
        severity: selectedSeverity || undefined,
        status: selectedStatus || undefined
      });
      setWebsites(response.websites);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Error loading flagged websites:', error);
      setToast({
        message: 'Failed to load flagged websites',
        type: 'error',
        isVisible: true
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  const handleSearch = () => {
    loadWebsites(1);
  };

  // Handle filter changes
  const handleFilterChange = () => {
    loadWebsites(1);
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    loadWebsites(page);
  };

  // Close toast
  const closeToast = () => {
    setToast(null);
  };

  // Load initial data
  useEffect(() => {
    loadWebsites(1);
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

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get category display name
  const getCategoryDisplayName = (category: string) => {
    return category.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
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
      
      
      
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-red-100 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <AlertTriangle className="h-10 w-10 text-red-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Public Directory</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Community-reported malicious websites and phishing attempts. Stay informed about the latest threats and help protect others.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
                  placeholder="Search flagged websites..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
              </div>
          </div>

            {/* Category Filter */}
            <div>
            <select
              value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  handleFilterChange();
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="">All Categories</option>
                <option value="bank-phishing">Bank Phishing</option>
                <option value="email-phishing">Email Phishing</option>
                <option value="social-media-phishing">Social Media Phishing</option>
                <option value="workplace-phishing">Workplace Phishing</option>
                <option value="malware-distribution">Malware Distribution</option>
                <option value="ransomware">Ransomware</option>
                <option value="fake-login">Fake Login</option>
                <option value="scam">Scam</option>
                <option value="fraud">Fraud</option>
                <option value="identity-theft">Identity Theft</option>
            </select>
            </div>

            {/* Status Filter */}
            <div>
            <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  handleFilterChange();
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
            </select>
            </div>
          </div>

          {/* Additional Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {/* Severity Filter */}
            <div>
            <select
                value={selectedSeverity}
                onChange={(e) => {
                  setSelectedSeverity(e.target.value);
                  handleFilterChange();
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="">All Severity Levels</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
            </select>
            </div>

            {/* Search Button */}
            <div className="md:col-span-2">
            <button
                onClick={handleSearch}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Search & Filter
            </button>
          </div>
        </div>
      </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="bg-red-100 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{pagination.totalResults}</h3>
            <p className="text-gray-600">Total Flagged Websites</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="bg-green-100 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Shield className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {websites.filter(w => w.status === 'approved').length}
            </h3>
            <p className="text-gray-600">Confirmed Threats</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="bg-blue-100 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {websites.filter(w => w.status === 'pending').length}
            </h3>
            <p className="text-gray-600">Under Review</p>
          </div>
      </div>

        {/* Websites List */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Flagged Websites</h2>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading flagged websites...</p>
            </div>
          ) : websites.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-green-400 mx-auto mb-4" />
              <p className="text-gray-600">No flagged websites found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {websites.map((website) => (
                <div key={website._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSeverityColor(website.severity)}`}>
                          {website.severity.toUpperCase()}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(website.status)} flex items-center space-x-1`}>
                          {getStatusIcon(website.status)}
                          <span>{website.status}</span>
                        </span>
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                          {getCategoryDisplayName(website.category)}
                    </span>
                        <span className="text-gray-500 text-sm">
                          {new Date(website.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{website.title}</h3>
                      <p className="text-gray-600 mb-3">{website.description}</p>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                        <div className="flex items-center space-x-2">
                          <Globe className="h-4 w-4" />
                          <span className="text-red-600 font-mono break-all">{website.url}</span>
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
                      
                      {website.reviewNotes && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-blue-800 text-sm">
                            <strong>Review Notes:</strong> {website.reviewNotes}
                          </p>
                    </div>
                      )}
                    </div>
                    
                    <div className="ml-4 flex flex-col space-y-2">
                      <a
                        href={website.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm flex items-center space-x-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span>Visit</span>
                      </a>
                      {website.status === 'approved' && (
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium text-center">
                          Confirmed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

      {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center space-x-2 mt-8">
            <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
              <span className="px-4 py-2 text-gray-700">
                Page {pagination.page} of {pagination.totalPages}
              </span>
                <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
        </div>
      )}
        </div>
      </div>
    </div>
  );
};

export default PublicDirectory;
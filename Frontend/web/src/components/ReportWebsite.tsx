import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, Send, Globe } from 'lucide-react';
import { directoryService, CreateFlaggedWebsite } from '../services/directoryService';
import { forumService } from '../services/forumService';
import Header from './Header';
import Toast from './Toast';

const ReportWebsite: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    url: '',
    title: '',
    description: '',
    category: '',
    severity: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    evidence: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
    isVisible: boolean;
  } | null>(null);

  // Load categories from API
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const categoriesData = await forumService.getCategories();
      setCategories(categoriesData);
    } catch (err) {
      console.error('Error loading categories:', err);
      // Fallback to static categories if API fails
      setCategories([
        'bank-phishing', 'email-phishing', 'social-media-phishing', 'workplace-phishing',
        'malware-distribution', 'ransomware', 'fake-login', 'scam', 'fraud', 'identity-theft'
      ]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.url.trim() || !formData.title.trim() || !formData.description.trim() || !formData.category) {
      setError('Please fill in all required fields');
      return;
    }

    // Basic URL validation
    try {
      new URL(formData.url);
    } catch {
      setError('Please enter a valid URL');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const websiteData: CreateFlaggedWebsite = {
        url: formData.url.trim(),
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        severity: formData.severity,
        evidence: formData.evidence.trim()
      };

      await directoryService.submitWebsite(websiteData);
      
      // Redirect to community hub with success message
      navigate('/', { state: { message: 'Website reported successfully! Thank you for helping keep the community safe.' } });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to report website';
      setError(errorMessage);
      setToast({
        message: errorMessage,
        type: 'error',
        isVisible: true
      });
      console.error('Error reporting website:', err);
    } finally {
      setLoading(false);
    }
  };

  const closeToast = () => {
    setToast(null);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
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
      
     
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Community</span>
        </button>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-red-100 p-3 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Report Malicious Website</h1>
              <p className="text-gray-600">Help protect others by reporting suspicious or malicious websites</p>
            </div>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* URL */}
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                Website URL *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Globe className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="url"
                  id="url"
                  name="url"
                  value={formData.url}
                  onChange={handleInputChange}
                  placeholder="https://example.com"
                  className="w-full pl-10 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  required
                />
              </div>
            </div>

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Website Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Brief title describing what this website is"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe what this website does and why it's suspicious..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-vertical"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                required
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* Severity */}
            <div>
              <label htmlFor="severity" className="block text-sm font-medium text-gray-700 mb-2">
                Severity Level *
              </label>
              <select
                id="severity"
                name="severity"
                value={formData.severity}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                required
              >
                <option value="low">Low - Minor threat, minimal risk</option>
                <option value="medium">Medium - Moderate threat, some risk</option>
                <option value="high">High - Significant threat, high risk</option>
                <option value="critical">Critical - Severe threat, immediate action required</option>
              </select>
            </div>

            {/* Evidence */}
            <div>
              <label htmlFor="evidence" className="block text-sm font-medium text-gray-700 mb-2">
                Evidence & Details
              </label>
              <textarea
                id="evidence"
                name="evidence"
                value={formData.evidence}
                onChange={handleInputChange}
                placeholder="Provide specific details about why this website is suspicious (e.g., requests personal info, looks like a legitimate site but isn't, etc.)"
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-vertical"
              />
              <p className="text-sm text-gray-500 mt-1">
                The more specific details you provide, the better we can assess the threat.
              </p>
            </div>

            {/* Severity Preview */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Current Severity Level:</h3>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(formData.severity)}`}>
                {formData.severity.charAt(0).toUpperCase() + formData.severity.slice(1)}
              </span>
              <p className="text-sm text-gray-600 mt-2">
                {formData.severity === 'critical' && 'This will be reviewed immediately by our security team.'}
                {formData.severity === 'high' && 'This will be reviewed within 24 hours.'}
                {formData.severity === 'medium' && 'This will be reviewed within 48 hours.'}
                {formData.severity === 'low' && 'This will be reviewed within 72 hours.'}
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-4 border-t">
           
              <button
                type="button"
                onClick={() => navigate('/')}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center space-x-2 bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <AlertTriangle className="h-4 w-4" />
                <span>{loading ? 'Reporting...' : 'Report Website'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReportWebsite;

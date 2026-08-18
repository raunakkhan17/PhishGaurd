import { api } from '../lib/api';

export interface AdminWebsite {
  _id: string;
  url: string;
  title: string;
  description: string;
  submittedBy: {
    _id: string;
    name: string;
    email: string;
  };
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  screenshot: string;
  evidence: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewNotes: string;
  isActive: boolean;
  reports: any[];
  createdAt: string;
  updatedAt: string;
  dateReviewed?: string;
  reviewedBy?: {
    _id: string;
    name: string;
  };
}

export interface AdminDashboardStats {
  totalWebsites: number;
  statusCounts: {
    pending: number;
    approved: number;
    rejected: number;
  };
  categoryCounts: Array<{
    _id: string;
    count: number;
  }>;
  severityCounts: Array<{
    _id: string;
    count: number;
  }>;
  recentSubmissions: Array<{
    _id: string;
    count: number;
  }>;
}

export interface AdminListResponse {
  websites: AdminWebsite[];
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalResults: number;
  };
}

export const adminService = {
  // Get pending websites for review
  async getPendingWebsites(page = 1, limit = 10): Promise<AdminListResponse> {
    const response = await api.get(`/admin/pending-websites?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Approve a flagged website
  async approveWebsite(websiteId: string, reviewNotes?: string): Promise<AdminWebsite> {
    const response = await api.put(`/admin/approve-website/${websiteId}`, {
      reviewNotes: reviewNotes || ''
    });
    return response.data;
  },

  // Reject a flagged website
  async rejectWebsite(websiteId: string, reviewNotes: string): Promise<AdminWebsite> {
    const response = await api.put(`/admin/reject-website/${websiteId}`, {
      reviewNotes
    });
    return response.data;
  },

  // Get admin dashboard statistics
  async getDashboardStats(): Promise<AdminDashboardStats> {
    const response = await api.get('/admin/dashboard-stats');
    return response.data;
  },

  // Get all websites with filters
  async getAllWebsites(page = 1, limit = 10, status?: string, category?: string): Promise<AdminListResponse> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (status) params.append('status', status);
    if (category) params.append('category', category);
    
    const response = await api.get(`/admin/websites?${params.toString()}`);
    return response.data;
  }
};

export default adminService;

import { api } from '../lib/api';

export interface FlaggedWebsite {
  _id: string;
  url: string;
  title: string;
  description: string;
  submittedBy: {
    _id: string;
    name: string;
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
  reviewedBy?: string;
}

export interface CreateFlaggedWebsite {
  url: string;
  title: string;
  description: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  evidence: string;
}

export interface DirectoryListResponse {
  websites: FlaggedWebsite[];
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalResults: number;
  };
}

export interface DirectoryFilters {
  page?: number;
  limit?: number;
  category?: string;
  severity?: string;
  status?: string;
}

export const directoryService = {
  // Submit a new flagged website
  async submitWebsite(websiteData: CreateFlaggedWebsite): Promise<FlaggedWebsite> {
    const response = await api.post('/directory', websiteData);
    return response.data;
  },

  // Get flagged websites with filters and pagination
  async getWebsites(filters: DirectoryFilters = {}): Promise<DirectoryListResponse> {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.category) params.append('category', filters.category);
    if (filters.severity) params.append('severity', filters.severity);
    if (filters.status) params.append('status', filters.status);
    
    const response = await api.get(`/directory?${params.toString()}`);
    return response.data;
  },

  // Get single flagged website
  async getWebsite(websiteId: string): Promise<FlaggedWebsite> {
    const response = await api.get(`/directory/${websiteId}`);
    return response.data;
  },

  // Update flagged website
  async updateWebsite(websiteId: string, websiteData: Partial<CreateFlaggedWebsite>): Promise<FlaggedWebsite> {
    const response = await api.put(`/directory/${websiteId}`, websiteData);
    return response.data;
  },

  // Delete flagged website
  async deleteWebsite(websiteId: string): Promise<void> {
    await api.delete(`/directory/${websiteId}`);
  },

  // Report a website
  async reportWebsite(websiteId: string, reportData: { reason: string; details: string }): Promise<void> {
    await api.post(`/directory/${websiteId}/report`, reportData);
  },

  // Get website categories
  async getCategories(): Promise<string[]> {
    const response = await api.get('/directory/categories');
    return response.data;
  }
};

export default directoryService;

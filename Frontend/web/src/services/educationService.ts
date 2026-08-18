import { api } from '../lib/api';

export interface EducationResource {
  _id: string;
  title: string;
  description: string;
  content: string;
  author: {
    _id: string;
    name: string;
    profilePicture: string;
  };
  category: string;
  topics: string[];
  resourceType: 'guide' | 'video' | 'article' | 'course';
  fileUrl: string;
  views: number;
  averageRating: number;
  isPublished: boolean;
  ratings: any[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateEducationResource {
  title: string;
  description: string;
  content: string;
  category: string;
  topics: string[];
  resourceType: 'guide' | 'video' | 'article' | 'course';
}

export interface EducationListResponse {
  resources: EducationResource[];
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalResults: number;
  };
}

export interface EducationFilters {
  page?: number;
  limit?: number;
  category?: string;
  resourceType?: string;
  topics?: string[];
}

export const educationService = {
  // Create a new education resource
  async createResource(resourceData: CreateEducationResource): Promise<EducationResource> {
    const response = await api.post('/education', resourceData);
    return response.data;
  },

  // Get education resources with filters and pagination
  async getResources(filters: EducationFilters = {}): Promise<EducationListResponse> {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.category) params.append('category', filters.category);
    if (filters.resourceType) params.append('resourceType', filters.resourceType);
    if (filters.topics && filters.topics.length > 0) {
      filters.topics.forEach(topic => params.append('topics', topic));
    }
    
    const response = await api.get(`/education?${params.toString()}`);
    return response.data;
  },

  // Get single education resource
  async getResource(resourceId: string): Promise<EducationResource> {
    const response = await api.get(`/education/${resourceId}`);
    return response.data;
  },

  // Update education resource
  async updateResource(resourceId: string, resourceData: Partial<CreateEducationResource>): Promise<EducationResource> {
    const response = await api.put(`/education/${resourceId}`, resourceData);
    return response.data;
  },

  // Delete education resource
  async deleteResource(resourceId: string): Promise<void> {
    await api.delete(`/education/${resourceId}`);
  },

  // Rate education resource
  async rateResource(resourceId: string, rating: number): Promise<EducationResource> {
    const response = await api.post(`/education/${resourceId}/rate`, { rating });
    return response.data;
  }
};

export default educationService;

import { api } from '../lib/api';

export interface ForumPost {
  _id: string;
  title: string;
  content: string;
  category: string;
  tags?: string[];
  author?: {
    _id: string;
    name: string;
    profilePicture: string;
  };
  
  isActive?: boolean;
  isPinned?: boolean;
 
  createdAt: string;
  updatedAt: string;
  meta?: {
    likes?: number;
    views?: number;
    comments?: number;
  };
}

export interface Comment {
  _id: string;
  text: string; // API returns 'text' not 'content'
  user: {        // API returns 'user' not 'author'
    _id: string;
    name: string;
    profilePicture: string;
  };
  date: string;  // API returns 'date' not 'createdAt'
}

export interface CreateForumPost {
  title: string;
  content: string;
  category: string;
  tags: string[];
}

export interface CreateComment {
  text: string; // API expects 'text' not 'content'
}

export interface ForumListResponse {
  forums: ForumPost[];
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalResults: number;
  };
}

export interface ForumFilters {
  page?: number;
  limit?: number;
  category?: string;
  sort?: 'latest' | 'oldest' | 'mostLiked' | 'mostViewed';
}

export const forumService = {
  // Create a new forum post
  async createPost(postData: CreateForumPost): Promise<ForumPost> {
    const response = await api.post('/community', postData);
    return response.data;
  },

  // Get forum posts with filters and pagination
  async getPosts(filters: ForumFilters = {}): Promise<ForumListResponse> {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.category) params.append('category', filters.category);
    if (filters.sort) params.append('sort', filters.sort);
    
    const response = await api.get(`/community?${params.toString()}`);
    return response.data;
  },

  // Get categories
  async getCategories(): Promise<string[]> {
    const response = await api.get('/community/categories');
    return response.data;
  },

  // Get single forum post
  async getPost(forumId: string): Promise<ForumPost> {
    const response = await api.get(`/community/${forumId}`);
    return response.data;
  },

  // Like/unlike a forum post
  async toggleLike(forumId: string): Promise<ForumPost> {
    const response = await api.put(`/community/${forumId}/like`);
    return response.data;
  },

  // Add comment to forum post
  async addComment(forumId: string, commentData: CreateComment): Promise<Comment> {
    const response = await api.post(`/community/${forumId}/comments`, commentData);
    return response.data;
  },

  // Get comments for a forum post
  async getComments(forumId: string): Promise<Comment[]> {
    const response = await api.get(`/community/${forumId}/comments`);
    return response.data;
  }
};

export default forumService;

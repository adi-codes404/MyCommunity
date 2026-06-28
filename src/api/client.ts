/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, Issue, Verification, Comment, LeaderboardEntry, Ward } from '../types';

const API_BASE = '/api';

/**
 * Common fetch utility supporting dynamic header updates (like x-user-id)
 */
async function apiRequest<T>(
  path: string,
  method: string = 'GET',
  body?: any,
  currentUserId?: string
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (currentUserId) {
    headers['x-user-id'] = currentUserId;
  }

  const options: RequestInit = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${path}`, options);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Auth
  getCurrentUser: (userId?: string) => apiRequest<User>('/auth/me', 'GET', undefined, userId),
  signup: (userData: Partial<User>) => apiRequest<User>('/auth/signup', 'POST', userData),
  login: (email: string) => apiRequest<User>('/auth/login', 'POST', { email }),
  getUsers: () => apiRequest<User[]>('/users'),

  // Issues
  getIssues: (filters?: {
    status?: string;
    category?: string;
    ward_id?: string;
    radius?: number;
    lat?: number;
    lng?: number;
    q?: string;
    sort?: string;
  }, userId?: string) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, val]) => {
        if (val !== undefined && val !== '') params.append(key, String(val));
      });
    }
    return apiRequest<Issue[]>(`/issues?${params.toString()}`, 'GET', undefined, userId);
  },
  getNearbyIssues: (lat: number, lng: number, radius: number, userId?: string) =>
    apiRequest<Issue[]>(`/issues/nearby?lat=${lat}&lng=${lng}&radius=${radius}`, 'GET', undefined, userId),
  getHeatmapGeoJSON: () => apiRequest<any>('/issues/heatmap', 'GET'),
  getIssueDetails: (id: string, userId?: string) =>
    apiRequest<Issue & {
      verifications_count: number;
      comments_count: number;
      verifications: Verification[];
      comments: Comment[];
      status_history: any[];
    }>(`/issues/${id}`, 'GET', undefined, userId),
  createIssue: (issueData: Partial<Issue>, userId?: string) =>
    apiRequest<Issue>('/issues', 'POST', issueData, userId),
  upvoteIssue: (id: string, userId?: string) =>
    apiRequest<{ upvotes: number; downvotes: number; upvoted: boolean }>(`/issues/${id}/upvote`, 'POST', undefined, userId),
  downvoteIssue: (id: string, userId?: string) =>
    apiRequest<{ upvotes: number; downvotes: number; downvoted: boolean }>(`/issues/${id}/downvote`, 'POST', undefined, userId),

  // Verifications & Comments
  verifyIssue: (id: string, verdict: string, comment: string, userId?: string) =>
    apiRequest<Verification>(`/issues/${id}/verify`, 'POST', { verdict, comment }, userId),
  getVerifications: (id: string) => apiRequest<Verification[]>(`/issues/${id}/verifications`),
  addComment: (id: string, text: string, userId?: string) =>
    apiRequest<Comment>(`/issues/${id}/comments`, 'POST', { text }, userId),

  // Authority Operations
  updateIssueStatus: (id: string, status: string, note: string, evidenceUrl?: string, userId?: string) =>
    apiRequest<{ success: boolean; updated_issue: Issue }>(`/issues/${id}/status`, 'PATCH', { status, note, evidence_url: evidenceUrl }, userId),

  // Profiles & Leaderboards
  getUserProfile: (id: string) =>
    apiRequest<{
      user: User;
      stats: { reported_count: number; verifications_count: number; resolved_count: number };
      reported_issues: Issue[];
      verifications: Verification[];
    }>(`/users/${id}/profile`),
  getLeaderboard: (wardId?: string) =>
    apiRequest<LeaderboardEntry[]>(`/leaderboard${wardId ? `?ward_id=${wardId}` : ''}`),

  // AI Operations
  categorizeIssueWithAI: (image?: string, description?: string) =>
    apiRequest<{
      category: string;
      severity: string;
      summary: string;
      issue_type: string;
      is_urgent: boolean;
      suggested_tags: string[];
    }>('/ai/categorize', 'POST', { image, description }),
  getAISummary: (id: string) =>
    apiRequest<{ summary: string }>(`/ai/summary/${id}`),
  getPredictiveHotspots: () =>
    apiRequest<any[]>('/ai/hotspot-alerts'),

  // Analytics
  getWardAnalytics: (wardId: string) =>
    apiRequest<{
      total_issues: number;
      status_distribution: Record<string, number>;
      category_distribution: Record<string, number>;
      avg_resolution_time_days: number;
    }>(`/analytics/ward/${wardId}`),
  getTrends: () => apiRequest<any[]>('/analytics/trends'),
  getHotspotLocations: () => apiRequest<any[]>('/analytics/hotspots'),
};

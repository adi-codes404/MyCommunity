/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'citizen' | 'volunteer' | 'authority' | 'admin';

export type IssueCategory = 'roads' | 'water' | 'sanitation' | 'garbage' | 'lighting' | 'drainage' | 'civic_behavior' | 'other';

export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical';

export type IssueStatus = 'reported' | 'verified' | 'assigned' | 'in_progress' | 'resolved' | 'reopened' | 'closed';

export type VerificationVerdict = 'confirm' | 'duplicate' | 'already_fixed' | 'fake';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  age?: number;
  locality?: string;
  avatar_url: string;
  role: UserRole;
  ward_id: string;
  points: number;
  badges: string[];
  created_at: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  severity: IssueSeverity;
  status: IssueStatus;
  media_urls: string[];
  location: {
    lat: number;
    lng: number;
  };
  address: string;
  ward_id: string;
  reported_by: string; // User ID
  assigned_to?: string; // User ID
  upvotes: number;
  downvotes: number;
  upvoted_by: string[]; // List of User IDs
  downvoted_by: string[]; // List of User IDs
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  ai_summary?: string;
  duplicate_flag?: boolean;
}

export interface Verification {
  id: string;
  issue_id: string;
  user_id: string;
  verdict: VerificationVerdict;
  comment: string;
  created_at: string;
}

export interface Comment {
  id: string;
  issue_id: string;
  user_id: string;
  text: string;
  created_at: string;
}

export interface StatusUpdate {
  id: string;
  issue_id: string;
  updated_by: string; // User ID
  old_status: IssueStatus;
  new_status: IssueStatus;
  note: string;
  evidence_url?: string;
  created_at: string;
}

export interface Ward {
  id: string;
  name: string;
  city: string;
  state: string;
  boundary: { lat: number; lng: number }[]; // Coordinates of the polygon
}

export interface GamificationEvent {
  id: string;
  user_id: string;
  event_type: 'reported' | 'verified' | 'resolved' | 'streak';
  points_awarded: number;
  created_at: string;
}

export interface LeaderboardEntry {
  user_id: string;
  name: string;
  avatar_url: string;
  role: UserRole;
  points: number;
  badges_count: number;
  rank?: number;
}

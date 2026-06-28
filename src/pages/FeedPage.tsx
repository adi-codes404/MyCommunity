/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../api/client';
import { Issue, IssueCategory, IssueStatus } from '../types';
import MapContainer from '../components/MapContainer';
import SkeletonLoader from '../components/SkeletonLoader';
import { Map, List, Search, SlidersHorizontal, ThumbsUp, ThumbsDown, MessageSquare, Clock, AlertTriangle, ArrowRight } from 'lucide-react';

interface FeedPageProps {
  onNavigate: (view: string) => void;
  currentUserId: string;
}

const SEVERITY_COLORS = {
  low: '#7A8BA8',
  medium: '#F39C12',
  high: '#E74C3C',
  critical: '#E74C3C',
};

const CATEGORIES: { value: IssueCategory; label: string; icon: string }[] = [
  { value: 'roads', label: 'Roads & Pavement', icon: '🛣️' },
  { value: 'water', label: 'Water Leaks', icon: '💧' },
  { value: 'sanitation', label: 'Sanitation/Sewage', icon: '🧹' },
  { value: 'garbage', label: 'Garbage & Litter', icon: '🗑️' },
  { value: 'lighting', label: 'Street Lighting', icon: '💡' },
  { value: 'drainage', label: 'Drainage Systems', icon: '🚰' },
  { value: 'civic_behavior', label: 'Civic Behavior', icon: '👥' },
  { value: 'other', label: 'Other/Misc', icon: '❓' },
];

const STATUS_PILLS: { value: IssueStatus; label: string; bg: string }[] = [
  { value: 'reported', label: 'Reported', bg: 'bg-[#7A8BA8]/10 text-[#7A8BA8] border-[#7A8BA8]/30' },
  { value: 'verified', label: 'Community Verified', bg: 'bg-success/10 text-success border-success/30' },
  { value: 'assigned', label: 'Assigned', bg: 'bg-warning/10 text-warning border-warning/30' },
  { value: 'in_progress', label: 'In Progress', bg: 'bg-accent-neon/10 text-accent-neon border-accent-neon/30' },
  { value: 'resolved', label: 'Resolved', bg: 'bg-success/20 text-success border-success/40' },
  { value: 'reopened', label: 'Reopened', bg: 'bg-critical/10 text-critical border-critical/30' },
  { value: 'closed', label: 'Closed', bg: 'bg-border text-text-muted border-border' },
];

export default function FeedPage({ onNavigate, currentUserId }: FeedPageProps) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  
  // Filters State
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedWard, setSelectedWard] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [radiusFilter, setRadiusFilter] = useState<string>(''); // empty means no radius check
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  const [expandedFilters, setExpandedFilters] = useState(false);

  // Fetch location for radius search
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      });
    }
  }, []);

  // Fetch issues based on filters
  useEffect(() => {
    async function loadIssues() {
      setLoading(true);
      try {
        const queryFilters: any = {
          q: search,
          sort: sortBy,
        };

        if (selectedCategory) queryFilters.category = selectedCategory;
        if (selectedStatus) queryFilters.status = selectedStatus;
        if (selectedWard) queryFilters.ward_id = selectedWard;

        // Apply spatial filtering if selected
        if (radiusFilter && userCoords) {
          queryFilters.lat = userCoords.lat;
          queryFilters.lng = userCoords.lng;
          queryFilters.radius = parseFloat(radiusFilter);
        }

        const data = await api.getIssues(queryFilters, currentUserId);
        setIssues(data);
      } catch (err) {
        console.error('Failed to load issues', err);
      } finally {
        setLoading(false);
      }
    }

    const delayDebounce = setTimeout(() => {
      loadIssues();
    }, 200); // short debounce for search bar

    return () => clearTimeout(delayDebounce);
  }, [search, selectedCategory, selectedStatus, selectedWard, sortBy, radiusFilter, userCoords, currentUserId]);

  // Handle voting triggers locally and call server
  const handleVote = async (id: string, type: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation(); // prevent card click navigation
    try {
      if (type === 'up') {
        const res = await api.upvoteIssue(id, currentUserId);
        setIssues(prev => prev.map(issue => {
          if (issue.id === id) {
            return {
              ...issue,
              upvotes: res.upvotes,
              downvotes: res.downvotes,
              upvoted_by: res.upvoted ? [...issue.upvoted_by, currentUserId] : issue.upvoted_by.filter(x => x !== currentUserId)
            };
          }
          return issue;
        }));
      } else {
        const res = await api.downvoteIssue(id, currentUserId);
        setIssues(prev => prev.map(issue => {
          if (issue.id === id) {
            return {
              ...issue,
              upvotes: res.upvotes,
              downvotes: res.downvotes,
              downvoted_by: res.downvoted ? [...issue.downvoted_by, currentUserId] : issue.downvoted_by.filter(x => x !== currentUserId)
            };
          }
          return issue;
        }));
      }
    } catch (err) {
      console.error('Voting failed', err);
    }
  };

  // Helper: Format Time ago
  const formatTimeAgo = (dateStr: string) => {
    const elapsed = Date.now() - new Date(dateStr).getTime();
    const hrs = Math.floor(elapsed / (1000 * 60 * 60));
    if (hrs < 1) return 'Just now';
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* FILTER HEADER ROW */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">Active Civic Feed</h1>
          <p className="text-sm text-text-secondary">Community-monitored local concerns list</p>
        </div>

        {/* View togglers */}
        <div className="flex items-center gap-2 bg-bg-surface border border-border p-1 rounded-xl self-start md:self-center shadow-lg">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 text-xs font-extrabold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${viewMode === 'list' ? 'bg-accent-neon text-bg-dark font-black' : 'text-text-secondary hover:text-white'}`}
          >
            <List className="w-4 h-4" />
            List View
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`px-4 py-2 text-xs font-extrabold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${viewMode === 'map' ? 'bg-accent-neon text-bg-dark font-black' : 'text-text-secondary hover:text-white'}`}
          >
            <Map className="w-4 h-4" />
            Interactive Map
          </button>
        </div>
      </div>

      {/* FILTER PANEL */}
      <div className="bg-bg-surface border border-border rounded-2xl p-4 md:p-6 space-y-4 shadow-xl">
        {/* Search Row */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 bg-bg-secondary rounded-xl border border-border p-3 flex items-center gap-2 focus-within:border-accent-neon transition-all">
            <Search className="w-5 h-5 text-text-muted shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search issues by title, category, address or details..."
              className="w-full bg-transparent text-sm text-white focus:outline-none"
            />
          </div>

          <button
            onClick={() => setExpandedFilters(!expandedFilters)}
            className={`px-4 py-3 bg-bg-secondary hover:bg-bg-secondary/80 border border-border rounded-xl text-sm font-bold text-white flex items-center gap-2 transition-all cursor-pointer ${expandedFilters ? 'border-accent-neon text-accent-neon' : ''}`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </button>
        </div>

        {/* Expanded Filters Panel */}
        <AnimatePresence>
          {expandedFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-border/60 overflow-hidden"
            >
              {/* Category Filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-muted uppercase">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-bg-secondary text-sm text-white border border-border rounded-xl p-2.5 focus:outline-none focus:border-accent-neon"
                >
                  <option value="">All Categories</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.icon} {cat.label}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-muted uppercase">Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full bg-bg-secondary text-sm text-white border border-border rounded-xl p-2.5 focus:outline-none focus:border-accent-neon"
                >
                  <option value="">All Statuses</option>
                  {STATUS_PILLS.map(status => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>

              {/* Spatial Geolocation Radius filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-muted uppercase">Distance Range</label>
                <select
                  value={radiusFilter}
                  onChange={(e) => setRadiusFilter(e.target.value)}
                  className="w-full bg-bg-secondary text-sm text-white border border-border rounded-xl p-2.5 focus:outline-none focus:border-accent-neon"
                  disabled={!userCoords}
                >
                  <option value="">Everywhere (No limit)</option>
                  <option value="1">Within 1 km</option>
                  <option value="2">Within 2 km</option>
                  <option value="5">Within 5 km</option>
                  <option value="10">Within 10 km</option>
                </select>
                {!userCoords && (
                  <span className="text-[10px] text-text-muted block italic">Enable GPS location to filter by distance</span>
                )}
              </div>

              {/* Sort filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-muted uppercase">Sorting By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full bg-bg-secondary text-sm text-white border border-border rounded-xl p-2.5 focus:outline-none focus:border-accent-neon"
                >
                  <option value="newest">Newest First</option>
                  <option value="votes">Top Upvoted</option>
                  <option value="oldest">Oldest Tracked</option>
                </select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* RENDER VIEW CONTENTS */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SkeletonLoader className="h-[200px]" count={4} />
        </div>
      ) : issues.length === 0 ? (
        <div className="text-center py-16 bg-bg-surface border border-border rounded-2xl space-y-4">
          <div className="text-4xl">🔍</div>
          <h3 className="text-xl font-bold text-white">No Matching Issues Found</h3>
          <p className="text-sm text-text-secondary max-w-sm mx-auto">
            Try adjusting your search keywords, status filters, or distance queries to load local reports.
          </p>
          <button
            onClick={() => onNavigate('report-issue')}
            className="px-5 py-2.5 bg-accent-neon text-bg-dark font-extrabold text-sm rounded-lg"
          >
            File a New Local Report
          </button>
        </div>
      ) : viewMode === 'list' ? (
        // LIST VIEW (Mobile first grid stacking)
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {issues.map((issue) => {
            const statusStyle = STATUS_PILLS.find(s => s.value === issue.status) || STATUS_PILLS[0];
            const categoryObj = CATEGORIES.find(c => c.value === issue.category) || CATEGORIES[7];
            const severityColor = SEVERITY_COLORS[issue.severity] || '#FFFFFF';
            const isUpvoted = issue.upvoted_by?.includes(currentUserId);
            const isDownvoted = issue.downvoted_by?.includes(currentUserId);

            return (
              <motion.div
                key={issue.id}
                onClick={() => onNavigate(`issue-detail-${issue.id}`)}
                className="bg-bg-surface border border-border hover:border-accent-neon/60 rounded-xl overflow-hidden shadow-lg cursor-pointer transform hover:-translate-y-1 transition-all duration-300 relative group flex flex-col justify-between"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div>
                  {/* Top image bar */}
                  <div className="h-44 w-full bg-primary-dark/80 relative overflow-hidden">
                    <img
                      src={issue.media_urls?.[0] || 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=600'}
                      alt={issue.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    
                    {/* Category Overlay */}
                    <div className="absolute top-3 left-3 px-3 py-1 bg-bg-dark/85 border border-border/80 rounded-lg text-xs font-bold text-white flex items-center gap-1.5 shadow-md">
                      <span>{categoryObj.icon}</span>
                      <span>{categoryObj.label}</span>
                    </div>

                    {/* Severity Indicator right corner */}
                    <div className="absolute top-3 right-3 px-3 py-1 bg-bg-dark/85 border border-border/80 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md">
                      <span 
                        className={`w-2.5 h-2.5 rounded-full ${issue.severity === 'critical' ? 'bg-critical animate-ping' : ''}`}
                        style={{ backgroundColor: severityColor }}
                      />
                      <span className="capitalize text-white" style={{ color: severityColor }}>{issue.severity}</span>
                    </div>

                    {/* Duplicate Flag warning badge */}
                    {issue.duplicate_flag && (
                      <div className="absolute bottom-3 left-3 bg-critical text-white text-[10px] font-black uppercase px-2 py-0.5 rounded border border-critical/30 shadow-md">
                        ⚠️ Potential Duplicate
                      </div>
                    )}
                  </div>

                  {/* Body Details */}
                  <div className="p-4 space-y-3">
                    <h3 className="text-lg font-black leading-tight text-white line-clamp-1 group-hover:text-accent-neon transition-colors">
                      {issue.title}
                    </h3>
                    <p className="text-xs text-text-secondary line-clamp-2 min-h-[32px]">
                      {issue.description || 'No detailed description added by user.'}
                    </p>
                    
                    {/* Status Pill & Time stamp */}
                    <div className="flex justify-between items-center border-t border-border/40 pt-3 text-xs">
                      <span className={`px-2.5 py-1 text-[10px] font-black rounded-full border uppercase tracking-wider ${statusStyle.bg}`}>
                        {statusStyle.label}
                      </span>
                      <span className="text-text-muted flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-text-muted" />
                        {formatTimeAgo(issue.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom interactive action metrics bar */}
                <div className="border-t border-border bg-bg-secondary/40 p-3 flex items-center justify-between text-xs text-text-secondary font-semibold rounded-b-xl">
                  {/* Upvoting system */}
                  <div className="flex items-center gap-1.5 bg-bg-surface/60 p-1.5 rounded-lg border border-border">
                    <button
                      onClick={(e) => handleVote(issue.id, 'up', e)}
                      className={`hover:scale-110 transition-transform p-1 cursor-pointer rounded ${isUpvoted ? 'text-accent-neon bg-accent-neon/10' : 'text-text-muted hover:text-white'}`}
                      title="Confirm this is an issue"
                    >
                      <ThumbsUp className="w-4 h-4" />
                    </button>
                    <span className="font-mono text-white text-xs">{issue.upvotes || 0}</span>

                    <span className="h-3 w-[1px] bg-border mx-1" />

                    <button
                      onClick={(e) => handleVote(issue.id, 'down', e)}
                      className={`hover:scale-110 transition-transform p-1 cursor-pointer rounded ${isDownvoted ? 'text-critical bg-critical/10' : 'text-text-muted hover:text-white'}`}
                      title="This is fake or resolved"
                    >
                      <ThumbsDown className="w-4 h-4" />
                    </button>
                    <span className="font-mono text-white text-xs">{issue.downvotes || 0}</span>
                  </div>

                  {/* Verification & Comments stats */}
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4 text-text-muted" />
                      {issue.comments_count || 0}
                    </span>
                    <span className="text-accent-lime font-mono text-xs hover:underline flex items-center gap-1">
                      Inspect <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        // MAP VIEW (Interactive Leaflet Container rendering map with filters)
        <div className="space-y-4">
          <div className="h-[480px] rounded-2xl overflow-hidden border border-border shadow-2xl relative">
            <MapContainer
              issues={issues}
              center={[12.9716, 77.5946]}
              zoom={13}
              onMarkerClick={(issue) => {
                onNavigate(`issue-detail-${issue.id}`);
              }}
              highlightCoordinates={issues.map(i => ({ lat: i.location.lat, lng: i.location.lng, radius: 100, color: i.severity === 'critical' ? '#E74C3C' : '#00D4FF' }))}
            />
          </div>
          <p className="text-xs text-text-muted text-center italic">
            Markers glow corresponding to their live status. Click a pin to open tracking timeline.
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Issue, Ward, IssueCategory, IssueStatus } from '../types';
import MapContainer from '../components/MapContainer';
import SkeletonLoader from '../components/SkeletonLoader';
import { ShieldAlert, Sparkles, CheckCircle2, Clock, AlertTriangle, Play, RefreshCw, Layers, MapPin } from 'lucide-react';

interface AuthorityDashboardPageProps {
  onNavigate: (view: string) => void;
  currentUserId: string;
}

export default function AuthorityDashboardPage({ onNavigate, currentUserId }: AuthorityDashboardPageProps) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [hotspotAlerts, setHotspotAlerts] = useState<any[]>([]);
  
  // Table state & Filters
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterWard, setFilterWard] = useState('ward-1'); // default to ward-1 Greenwood
  const [selectedIssueIds, setSelectedIssueIds] = useState<string[]>([]);
  
  // Bulk update fields
  const [bulkStatus, setBulkStatus] = useState<IssueStatus>('assigned');
  const [bulkNote, setBulkNote] = useState('');
  const [bulkUpdating, setBulkUpdating] = useState(false);

  // Analytics State
  const [wardAnalytics, setWardAnalytics] = useState<any>({
    total_issues: 0,
    avg_resolution_time_days: 2.4,
    status_distribution: {},
    category_distribution: {},
  });

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Load active issues
      const allIssues = await api.getIssues({}, currentUserId);
      setIssues(allIssues);

      // 2. Load ward specific analytics
      if (filterWard) {
        const ana = await api.getWardAnalytics(filterWard);
        setWardAnalytics(ana);
      }

      // 3. Load Gemini predictive hotspots
      loadHotspotAlerts();
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  const loadHotspotAlerts = async () => {
    setLoadingAlerts(true);
    try {
      const alerts = await api.getPredictiveHotspots();
      setHotspotAlerts(alerts);
    } catch (err) {
      console.error('Failed to load predictive hotspots', err);
    } finally {
      setLoadingAlerts(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [filterWard, currentUserId]);

  // Handle individual selection check
  const toggleSelectIssue = (id: string) => {
    setSelectedIssueIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Toggle select all visible
  const filteredIssuesList = issues.filter(i => {
    return (!filterCategory || i.category === filterCategory) &&
           (!filterStatus || i.status === filterStatus) &&
           (!filterWard || i.ward_id === filterWard);
  });

  const toggleSelectAll = () => {
    if (selectedIssueIds.length === filteredIssuesList.length) {
      setSelectedIssueIds([]);
    } else {
      setSelectedIssueIds(filteredIssuesList.map(i => i.id));
    }
  };

  // Bulk Dispatch Status update
  const handleBulkUpdate = async () => {
    if (selectedIssueIds.length === 0 || bulkUpdating) return;
    setBulkUpdating(true);
    try {
      // Run sequentially or in parallel
      await Promise.all(selectedIssueIds.map(id => 
        api.updateIssueStatus(id, bulkStatus, bulkNote || 'Bulk state dispatch', undefined, currentUserId)
      ));
      
      setBulkNote('');
      setSelectedIssueIds([]);
      // Reload everything
      await loadDashboardData();
    } catch (err) {
      console.error('Bulk update failed', err);
    } finally {
      setBulkUpdating(false);
    }
  };

  return (
    <div className="space-y-10 pb-16">
      
      {/* 1. TITLE & WARD SELECTOR ROW */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-2">
            <ShieldAlert className="w-8 h-8 text-warning" />
            Civic Control & Dispatch Console
          </h1>
          <p className="text-sm text-text-secondary">Role-gated official municipal action terminal</p>
        </div>

        {/* Global Ward toggle */}
        <div className="flex items-center gap-2 bg-bg-surface border border-border p-2.5 rounded-xl shadow-lg">
          <MapPin className="w-5 h-5 text-accent-neon shrink-0 animate-pulse" />
          <span className="text-xs font-bold text-text-muted uppercase tracking-wider mr-1">Monitor Ward:</span>
          <select
            value={filterWard}
            onChange={(e) => setFilterWard(e.target.value)}
            className="bg-transparent text-sm font-extrabold text-accent-neon focus:outline-none cursor-pointer pr-1"
          >
            <option value="ward-1" className="bg-bg-surface text-white font-semibold">Indiranagar Ward</option>
            <option value="ward-2" className="bg-bg-surface text-white font-semibold">Koramangala Ward</option>
            <option value="ward-3" className="bg-bg-surface text-white font-semibold">Malleswaram Ward</option>
          </select>
        </div>
      </div>

      {/* 2. CORE STATS WIDGET CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Total issues card */}
        <div className="bg-bg-surface border border-border rounded-xl p-5 relative overflow-hidden shadow-lg">
          <div className="text-xs uppercase tracking-wider text-text-secondary font-semibold mb-1">Open Reports Tracked</div>
          <div className="text-4xl font-black font-mono text-accent-neon">{loading ? '...' : wardAnalytics.total_issues}</div>
          <div className="text-[10px] text-text-muted mt-2">Active pending dispatcher triage</div>
        </div>

        {/* In progress card */}
        <div className="bg-bg-surface border border-border rounded-xl p-5 relative overflow-hidden shadow-lg">
          <div className="text-xs uppercase tracking-wider text-text-secondary font-semibold mb-1">Active Repairs</div>
          <div className="text-4xl font-black font-mono text-warning">
            {loading ? '...' : (wardAnalytics.status_distribution['in_progress'] || 0) + (wardAnalytics.status_distribution['assigned'] || 0)}
          </div>
          <div className="text-[10px] text-text-muted mt-2">Contractors currently dispatched on site</div>
        </div>

        {/* Resolved this week card */}
        <div className="bg-bg-surface border border-border rounded-xl p-5 relative overflow-hidden shadow-lg">
          <div className="text-xs uppercase tracking-wider text-text-secondary font-semibold mb-1">Resolved (Audit Passed)</div>
          <div className="text-4xl font-black font-mono text-success">
            {loading ? '...' : (wardAnalytics.status_distribution['resolved'] || 0)}
          </div>
          <div className="text-[10px] text-text-muted mt-2">Restorations approved this month</div>
        </div>

        {/* Avg Resolution hours card */}
        <div className="bg-bg-surface border border-border rounded-xl p-5 relative overflow-hidden shadow-lg">
          <div className="text-xs uppercase tracking-wider text-text-secondary font-semibold mb-1">Avg Resolution Time</div>
          <div className="text-4xl font-black font-mono text-accent-lime">
            {loading ? '...' : `${wardAnalytics.avg_resolution_time_days} days`}
          </div>
          <div className="text-[10px] text-text-muted mt-2">Continuous timeline optimization target</div>
        </div>

      </div>

      {/* 3. AI PREDICTIVE HOTSPOT WARNING MODULE */}
      <div className="bg-gradient-to-br from-[#1b253c] to-bg-dark border-2 border-accent-neon/30 rounded-2xl p-6 md:p-8 space-y-4 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent-neon/5 rounded-full blur-3xl" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent-neon animate-pulse" />
              Gemini AI Predictive Hotspot Radar
            </h3>
            <p className="text-xs text-text-secondary">Detects clusters of 3+ issues of the same category within 500m inside 7 days automatically</p>
          </div>
          
          <button
            onClick={loadHotspotAlerts}
            disabled={loadingAlerts}
            className="px-4 py-2 bg-bg-secondary border border-border hover:border-accent-neon rounded-lg text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer self-start sm:self-center shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-accent-neon ${loadingAlerts ? 'animate-spin' : ''}`} />
            Scan Hotspots
          </button>
        </div>

        {/* List of generated hotspot warnings */}
        {loadingAlerts ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-20 bg-bg-surface/60 rounded-xl border border-border/40" />
            <div className="h-20 bg-bg-surface/60 rounded-xl border border-border/40" />
          </div>
        ) : hotspotAlerts.length === 0 ? (
          <div className="p-4 bg-primary-dark/40 border border-border/40 rounded-xl text-xs text-text-muted text-center italic">
            ✓ Scan Complete: No active 500m recurrence clusters detected city-wide in the past 7 days.
          </div>
        ) : (
          <div className="space-y-4">
            {hotspotAlerts.map((alert, idx) => (
              <div 
                key={idx} 
                className="bg-bg-surface border border-accent-neon/30 hover:border-accent-neon/60 rounded-xl p-5 flex flex-col md:flex-row md:items-start justify-between gap-4 transition-all"
              >
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 bg-critical/20 text-critical font-black rounded uppercase text-[9px] tracking-wider animate-pulse">
                      ★ Predictive Hotspot
                    </span>
                    <span className="font-extrabold text-white">Cluster: {alert.issues_count} {alert.category.toUpperCase()} problems</span>
                    <span className="text-text-muted">• {alert.ward_name} Sector</span>
                  </div>
                  
                  <p className="text-xs text-text-secondary leading-relaxed font-medium italic">
                    "{alert.summary}"
                  </p>

                  {/* List of reports inside cluster */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 text-[10px]">
                    <span className="text-text-muted font-bold uppercase">Affected Cases:</span>
                    {alert.issues?.map((iss: any) => (
                      <span 
                        key={iss.id} 
                        onClick={() => onNavigate(`issue-detail-${iss.id}`)}
                        className="bg-bg-secondary hover:text-accent-neon border border-border px-2 py-0.5 rounded cursor-pointer transition-colors"
                      >
                        #{iss.id.slice(-4).toUpperCase()} {iss.title.split(' at ')[0]}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-right shrink-0 flex flex-col items-end justify-between h-full">
                  <span className="text-xs text-accent-neon font-black font-mono">gemini-3.5-flash</span>
                  <button
                    onClick={() => onNavigate('map')}
                    className="mt-4 px-3 py-1.5 bg-accent-neon/10 border border-accent-neon/30 text-accent-neon hover:bg-accent-neon hover:text-bg-dark text-xs font-bold rounded-lg transition-all cursor-pointer"
                  >
                    View in Map
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. BULK OPERATIONS & ISSUES TABLE */}
      <div className="bg-bg-surface border border-border rounded-2xl p-6 md:p-8 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-1.5">
            <Layers className="w-5 h-5 text-accent-neon" />
            Civic Issue Triage & Dispatch Table
          </h3>
          
          {/* Table filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Category Dropdown */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-bg-secondary text-xs font-bold text-white border border-border rounded-lg p-2 focus:outline-none"
            >
              <option value="">All Categories</option>
              <option value="roads">Roads</option>
              <option value="water">Water</option>
              <option value="sanitation">Sanitation</option>
              <option value="garbage">Garbage</option>
              <option value="lighting">Lighting</option>
              <option value="drainage">Drainage</option>
              <option value="civic_behavior">Civic Behavior</option>
              <option value="other">Other</option>
            </select>

            {/* Status Dropdown */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-bg-secondary text-xs font-bold text-white border border-border rounded-lg p-2 focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="reported">Reported</option>
              <option value="verified">Verified</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        {/* BULK DISPATCH ACTIONS BLOCK */}
        {selectedIssueIds.length > 0 && (
          <div className="p-4 bg-warning/10 border-2 border-dashed border-warning/40 rounded-xl space-y-4 animate-pulse">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-warning uppercase tracking-wider">
                ⚡ BULK ACTIONS ACTIVE: {selectedIssueIds.length} Cases Selected
              </span>
              <button 
                onClick={() => setSelectedIssueIds([])}
                className="text-xs text-text-secondary hover:text-white underline cursor-pointer"
              >
                Clear Selection
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Status Select */}
              <select
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value as IssueStatus)}
                className="bg-bg-surface text-xs font-bold text-white border border-border rounded-lg p-3"
              >
                <option value="assigned">Assign to City Engineers</option>
                <option value="in_progress">Mark as Repair Active</option>
                <option value="resolved">Mark as Fully Resolved (+20 pts to citizen)</option>
                <option value="closed">Close Ticket</option>
              </select>

              {/* Action Notes */}
              <input
                type="text"
                value={bulkNote}
                onChange={(e) => setBulkNote(e.target.value)}
                placeholder="Log bulk status action memo..."
                className="bg-bg-surface text-xs text-white border border-border rounded-lg p-3"
              />

              {/* Bulk Dispatch Button */}
              <button
                onClick={handleBulkUpdate}
                disabled={bulkUpdating}
                className="px-6 py-3 bg-warning text-bg-dark font-extrabold text-xs rounded-lg shadow-md cursor-pointer hover:bg-warning/85 transition-all"
              >
                {bulkUpdating ? 'Dispatching Bulk...' : 'Execute Bulk Dispatch'}
              </button>
            </div>
          </div>
        )}

        {/* Table representation */}
        {loading ? (
          <SkeletonLoader className="h-[40px]" count={6} />
        ) : filteredIssuesList.length === 0 ? (
          <p className="text-xs text-text-muted italic py-6 text-center">No reports match selected filters in this ward.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-text-secondary">
              <thead className="bg-primary-dark/80 text-text-muted uppercase tracking-wider text-[10px] font-black border-b border-border">
                <tr>
                  <th className="p-3 w-10">
                    <input 
                      type="checkbox" 
                      checked={selectedIssueIds.length === filteredIssuesList.length && filteredIssuesList.length > 0} 
                      onChange={toggleSelectAll} 
                      className="cursor-pointer"
                    />
                  </th>
                  <th className="p-3">Issue Title</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Severity</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Votes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-medium">
                {filteredIssuesList.map((issue) => {
                  const isSelected = selectedIssueIds.includes(issue.id);

                  return (
                    <tr 
                      key={issue.id} 
                      className={`hover:bg-bg-secondary/20 transition-colors cursor-pointer ${isSelected ? 'bg-accent-neon/5' : ''}`}
                      onClick={() => toggleSelectIssue(issue.id)}
                    >
                      <td className="p-3" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          checked={isSelected} 
                          onChange={() => toggleSelectIssue(issue.id)} 
                          className="cursor-pointer"
                        />
                      </td>
                      <td className="p-3">
                        <span 
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigate(`issue-detail-${issue.id}`);
                          }}
                          className="font-bold text-white hover:text-accent-neon hover:underline"
                        >
                          {issue.title}
                        </span>
                        <span className="text-[10px] text-text-muted block mt-0.5">{issue.address}</span>
                      </td>
                      <td className="p-3 capitalize">{issue.category}</td>
                      <td className="p-3 capitalize font-bold text-critical">{issue.severity}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 font-bold uppercase rounded-[4px] bg-bg-secondary text-[9px]">
                          {issue.status}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-white">{issue.upvotes || 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}

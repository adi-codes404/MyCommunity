/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { api } from '../api/client';
import { Issue, Verification, Comment, User, IssueStatus } from '../types';
import MapContainer from '../components/MapContainer';
import SkeletonLoader from '../components/SkeletonLoader';
import { Clock, MapPin, Sparkles, Check, Play, ShieldAlert, Heart, MessageSquare, Send, CheckCircle2, UserCheck, AlertTriangle } from 'lucide-react';

interface IssueDetailPageProps {
  issueId: string;
  onNavigate: (view: string) => void;
  currentUser: User;
}

const SEVERITY_COLORS = {
  low: '#7A8BA8',
  medium: '#F39C12',
  high: '#E74C3C',
  critical: '#E74C3C',
};

const STATUS_PILLS: Record<IssueStatus, { label: string; bg: string }> = {
  reported: { label: 'Reported', bg: 'bg-[#7A8BA8]/10 text-[#7A8BA8] border-[#7A8BA8]/30' },
  verified: { label: 'Community Verified', bg: 'bg-success/10 text-success border-success/30' },
  assigned: { label: 'Assigned', bg: 'bg-warning/10 text-warning border-warning/30' },
  in_progress: { label: 'In Progress', bg: 'bg-accent-neon/10 text-accent-neon border-accent-neon/30' },
  resolved: { label: 'Resolved', bg: 'bg-success/20 text-success border-success/40' },
  reopened: { label: 'Reopened', bg: 'bg-critical/10 text-critical border-critical/30' },
  closed: { label: 'Closed', bg: 'bg-border text-text-muted border-border' },
};

export default function IssueDetailPage({ issueId, onNavigate, currentUser }: IssueDetailPageProps) {
  const [issue, setIssue] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiSummary, setAiSummary] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);

  // Verification Form State
  const [verdict, setVerdict] = useState<'confirm' | 'duplicate' | 'already_fixed' | 'fake'>('confirm');
  const [verComment, setVerComment] = useState('');
  const [submittingVer, setSubmittingVer] = useState(false);

  // Comment State
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Authority Status State
  const [authStatus, setAuthStatus] = useState<IssueStatus>('in_progress');
  const [authNote, setAuthNote] = useState('');
  const [authEvidence, setAuthEvidence] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Local Vote
  const [voted, setVoted] = useState(false);

  const loadDetails = async () => {
    try {
      const data = await api.getIssueDetails(issueId, currentUser.id);
      setIssue(data);
      setAuthStatus(data.status);
      setVoted(data.upvoted_by?.includes(currentUser.id) || false);

      // Trigger server-side AI summary (which caches in database)
      if (!data.ai_summary || data.ai_summary.includes('probability')) {
        loadAISummary();
      } else {
        setAiSummary(data.ai_summary);
      }
    } catch (err) {
      console.error('Failed to load issue details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [issueId, currentUser.id]);

  const loadAISummary = async () => {
    setLoadingAI(true);
    try {
      const res = await api.getAISummary(issueId);
      setAiSummary(res.summary);
    } catch (err) {
      console.error('Failed to load AI summary', err);
    } finally {
      setLoadingAI(false);
    }
  };

  // Upvote Trigger
  const handleUpvote = async () => {
    if (!issue) return;
    try {
      const res = await api.upvoteIssue(issueId, currentUser.id);
      setIssue((prev: any) => ({
        ...prev,
        upvotes: res.upvotes,
        downvotes: res.downvotes,
      }));
      setVoted(res.upvoted);
    } catch (err) {
      console.error('Upvote failed', err);
    }
  };

  // Submit Verification
  const submitVerification = async () => {
    if (submittingVer) return;
    setSubmittingVer(true);
    try {
      await api.verifyIssue(issueId, verdict, verComment, currentUser.id);
      setVerComment('');
      // Reload details
      await loadDetails();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setSubmittingVer(false);
    }
  };

  // Submit Comment
  const submitComment = async () => {
    if (!commentText.trim() || submittingComment) return;
    setSubmittingComment(true);
    try {
      await api.addComment(issueId, commentText, currentUser.id);
      setCommentText('');
      await loadDetails();
    } catch (err) {
      console.error('Comment failed', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  // Authority Update status
  const submitAuthorityStatus = async () => {
    setUpdatingStatus(true);
    try {
      await api.updateIssueStatus(issueId, authStatus, authNote, authEvidence || undefined, currentUser.id);
      setAuthNote('');
      setAuthEvidence('');
      await loadDetails();
    } catch (err) {
      console.error('Authority update failed', err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto pb-12">
        <SkeletonLoader className="h-[40px] w-[200px]" />
        <SkeletonLoader className="h-[250px]" />
        <SkeletonLoader className="h-[150px]" />
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-bold">Issue Not Found</h3>
        <button onClick={() => onNavigate('feed')} className="mt-4 px-4 py-2 bg-accent-neon text-bg-dark rounded-lg">Return to Feed</button>
      </div>
    );
  }

  const severityColor = SEVERITY_COLORS[issue.severity as keyof typeof SEVERITY_COLORS] || '#FFFFFF';
  const statusInfo = STATUS_PILLS[issue.status as IssueStatus] || STATUS_PILLS.reported;

  // Progress timeline calculation
  const timelineStages: { status: IssueStatus; label: string; desc: string }[] = [
    { status: 'reported', label: 'Reported', desc: 'Sourced by citizen' },
    { status: 'verified', label: 'Verified', desc: 'Confirmed by community' },
    { status: 'assigned', label: 'Assigned', desc: 'Dispatched to authority' },
    { status: 'in_progress', label: 'In Progress', desc: 'Restoration active' },
    { status: 'resolved', label: 'Resolved', desc: 'Fix successfully audited' },
  ];

  const currentStageIndex = timelineStages.findIndex(s => s.status === issue.status);

  return (
    <div className="max-w-4xl mx-auto pb-16 space-y-8">
      {/* 1. HEADER ROW */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <button 
            onClick={() => onNavigate('feed')} 
            className="text-xs text-accent-neon font-bold hover:underline mb-2 block cursor-pointer"
          >
            ← Back to Feed
          </button>
          <h1 className="text-3xl font-black tracking-tight text-white">{issue.title}</h1>
          <div className="flex flex-wrap items-center gap-3 mt-3">
            <span className={`px-2.5 py-1 text-[10px] font-black rounded-full border uppercase tracking-wider ${statusInfo.bg}`}>
              {statusInfo.label}
            </span>
            <span className="text-xs text-text-secondary flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Reported {new Date(issue.created_at).toLocaleDateString()}
            </span>
            <span className="text-xs font-bold" style={{ color: severityColor }}>
              ● {issue.severity.toUpperCase()} SEVERITY
            </span>
          </div>
        </div>

        {/* Upvote heart count */}
        <button
          onClick={handleUpvote}
          className={`px-5 py-3 rounded-xl border flex items-center gap-2 font-black text-sm transition-all cursor-pointer ${voted ? 'bg-accent-neon text-bg-dark border-accent-neon shadow-[0_4px_12px_rgba(0,212,255,0.3)]' : 'bg-bg-surface border-border hover:border-text-muted text-white'}`}
        >
          <Heart className={`w-5 h-5 ${voted ? 'fill-bg-dark text-bg-dark' : 'text-accent-neon'}`} />
          {issue.upvotes || 0} Upvotes
        </button>
      </div>

      {/* 2. MEDIA & METADATA COLUMN SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Media Carousel wrapper */}
          <div className="h-[300px] md:h-[380px] bg-primary-dark/80 rounded-2xl overflow-hidden border border-border relative shadow-lg">
            <img
              src={issue.media_urls?.[0] || 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=600'}
              alt={issue.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* User description detail */}
          <div className="bg-bg-surface border border-border rounded-xl p-6 space-y-3 shadow-md">
            <h3 className="text-lg font-bold text-white">Issue Description</h3>
            <p className="text-text-secondary text-sm leading-relaxed">
              {issue.description || 'No additional description provided.'}
            </p>
            
            <div className="flex items-center gap-2 text-xs text-text-muted bg-primary-dark/40 p-3 rounded-lg border border-border/40 mt-4">
              <MapPin className="w-4 h-4 text-accent-neonshrink-0" />
              <span>Location: <strong className="text-white">{issue.address}</strong></span>
            </div>
          </div>
        </div>

        {/* Sidebar Mini map & AI Summary widgets */}
        <div className="space-y-6">
          {/* AI SUMMARY WIDGET */}
          <div className="bg-gradient-to-br from-primary to-primary-dark border-2 border-accent-neon/30 rounded-2xl p-6 shadow-md relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-accent-neon/5 rounded-full blur-2xl" />
            
            <h3 className="text-sm uppercase tracking-wider text-accent-neon font-black flex items-center gap-1.5 mb-3">
              <Sparkles className="w-4 h-4 text-accent-neon animate-pulse" />
              AI Impact Synthesis
            </h3>
            
            {loadingAI ? (
              <div className="space-y-2 animate-pulse">
                <div className="h-3 bg-bg-secondary/60 rounded w-full" />
                <div className="h-3 bg-bg-secondary/60 rounded w-5/6" />
                <div className="h-3 bg-bg-secondary/60 rounded w-4/6" />
              </div>
            ) : (
              <p className="text-xs text-text-secondary leading-relaxed italic">
                "{aiSummary || 'Combining community metrics... AI analysis will generate instantly shortly.'}"
              </p>
            )}
            <div className="text-[10px] text-text-muted mt-4 text-right">Model: gemini-3.5-flash</div>
          </div>

          {/* Location coordinate map thumbnail */}
          <div className="bg-bg-surface border border-border rounded-2xl p-4 space-y-3">
            <h4 className="text-sm font-bold text-white">Geospatial Plot</h4>
            <div className="h-[180px] rounded-xl overflow-hidden border border-border">
              <MapContainer
                issues={[]}
                center={[issue.location.lat, issue.location.lng]}
                zoom={14}
                interactive={false}
                highlightCoordinates={[{ lat: issue.location.lat, lng: issue.location.lng, radius: 100, color: '#00D4FF' }]}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. PROGRESS MILESTONES TIMELINE */}
      <div className="bg-bg-surface border border-border rounded-2xl p-6 md:p-8 space-y-6 shadow-xl">
        <h3 className="text-lg font-bold text-white">Resolution Progress Timeline</h3>
        
        {/* Horizontal milestones row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 relative">
          {timelineStages.map((stage, idx) => {
            const isCompleted = idx <= currentStageIndex;
            const isCurrent = idx === currentStageIndex;

            return (
              <div key={stage.status} className="flex flex-col items-center text-center space-y-2 relative">
                {/* Connecting lines */}
                {idx < 4 && (
                  <div className={`hidden md:block absolute top-4 left-1/2 w-full h-[3px] z-0 ${idx < currentStageIndex ? 'bg-accent-neon' : 'bg-border'}`} />
                )}

                {/* Circle Marker */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 z-10 font-bold font-mono text-xs transition-all duration-300 ${isCompleted ? 'bg-accent-neon border-accent-neon text-bg-dark' : 'bg-bg-secondary border-border text-text-muted'}`}>
                  {isCompleted ? <Check className="w-4 h-4 stroke-[3px]" /> : idx + 1}
                </div>

                {/* Milestone Detail */}
                <div>
                  <div className={`text-xs font-black capitalize ${isCurrent ? 'text-accent-neon' : isCompleted ? 'text-white' : 'text-text-muted'}`}>
                    {stage.label}
                  </div>
                  <div className="text-[10px] text-text-muted mt-0.5">{stage.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. VERIFICATION PANEL */}
      <div className="bg-bg-surface border border-border rounded-2xl p-6 md:p-8 space-y-6 shadow-xl">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-accent-lime" />
            Community Verification Panel
          </h3>
          <span className="text-xs text-accent-lime font-bold">Award: +5 points for verification</span>
        </div>

        {/* Existing Verifications list */}
        <div className="space-y-4">
          {issue.verifications?.length === 0 ? (
            <p className="text-xs text-text-muted italic">This issue has not been verified yet. Be the first local neighbor to confirm or flag!</p>
          ) : (
            <div className="space-y-3 max-h-[180px] overflow-y-auto pr-2">
              {issue.verifications?.map((v: Verification) => (
                <div key={v.id} className="p-3 bg-bg-secondary/40 border border-border/40 rounded-xl flex items-start justify-between text-xs">
                  <div className="space-y-1">
                    <span className="font-extrabold text-white">Neighbor {v.user_id.slice(-4).toUpperCase()}</span>
                    <p className="text-text-secondary">"{v.comment}"</p>
                  </div>
                  <span className={`px-2 py-0.5 font-bold uppercase rounded text-[9px] ${v.verdict === 'confirm' ? 'bg-success/20 text-success' : 'bg-critical/20 text-critical'}`}>
                    {v.verdict}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* New Verification Submission Block */}
        {!issue.verifications?.some((v: Verification) => v.user_id === currentUser.id) ? (
          <div className="bg-bg-secondary/40 border border-border p-4 rounded-xl space-y-4">
            <h4 className="text-sm font-bold text-white">Submit your neighborhood verdict:</h4>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(['confirm', 'duplicate', 'already_fixed', 'fake'] as any[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVerdict(v)}
                  className={`py-3 text-xs font-bold rounded-lg capitalize border transition-all cursor-pointer ${
                    verdict === v 
                      ? 'bg-accent-lime text-bg-dark border-accent-lime font-black shadow-md' 
                      : 'bg-bg-surface border-border text-text-secondary hover:border-text-muted'
                  }`}
                >
                  {v.replace('_', ' ')}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-text-muted uppercase">Verdict comment</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={verComment}
                  onChange={(e) => setVerComment(e.target.value)}
                  placeholder="Share a short context why you chose this verdict (e.g. 'Walked by today, municipal team has not arrived yet.')"
                  className="w-full bg-bg-surface text-sm text-white border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-accent-neon"
                />
                <button
                  onClick={submitVerification}
                  disabled={submittingVer}
                  className="px-6 py-3 bg-gradient-to-r from-accent-neon to-accent-lime text-bg-dark font-black text-xs rounded-xl cursor-pointer"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-success/10 border border-success/30 p-3 rounded-xl text-xs text-success flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            You have already recorded your community verification for this issue. Thank you for your contribution!
          </div>
        )}
      </div>

      {/* 5. AUTHORITY ROLE-GATED CONTROL PANEL */}
      {['authority', 'admin'].includes(currentUser.role) && (
        <div className="bg-gradient-to-br from-[#1b253c] to-primary-dark border-2 border-warning/40 rounded-2xl p-6 md:p-8 space-y-6 shadow-2xl">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-warning animate-pulse" />
            Authority Command Console (Role-Gated)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Status change select */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-warning uppercase">Dispatch Status Action</label>
              <select
                value={authStatus}
                onChange={(e) => setAuthStatus(e.target.value as IssueStatus)}
                className="w-full bg-bg-surface text-sm text-white border border-border rounded-xl p-3 focus:outline-none"
              >
                <option value="reported" className="bg-bg-surface text-white">Reported</option>
                <option value="verified" className="bg-bg-surface text-white">Verified</option>
                <option value="assigned" className="bg-bg-surface text-white">Assigned to Civic Works</option>
                <option value="in_progress" className="bg-bg-surface text-white">In Progress (Active Restoration)</option>
                <option value="resolved" className="bg-bg-surface text-white">Resolved (Completed & Audited)</option>
                <option value="closed" className="bg-bg-surface text-white">Closed</option>
              </select>
            </div>

            {/* Evidence URL string */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-warning uppercase">Evidence Photo (Optional URL)</label>
              <input
                type="text"
                value={authEvidence}
                onChange={(e) => setAuthEvidence(e.target.value)}
                placeholder="Paste repair confirmation photo URL"
                className="w-full bg-bg-surface text-sm text-white border border-border rounded-xl p-3 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-warning uppercase">Authority Action log memo</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={authNote}
                onChange={(e) => setAuthNote(e.target.value)}
                placeholder="Log repair progress updates, expected completion timeline or contractor tags"
                className="w-full bg-bg-surface text-sm text-white border border-border rounded-xl px-4 py-3 focus:outline-none"
              />
              <button
                onClick={submitAuthorityStatus}
                disabled={updatingStatus}
                className="px-6 py-3 bg-warning text-bg-dark font-extrabold text-xs rounded-xl cursor-pointer hover:bg-warning/85 transition-all shadow-md shrink-0"
              >
                Update Timeline
              </button>
            </div>
          </div>

          {/* Render authority timeline logs */}
          <div className="space-y-3 pt-4 border-t border-border/60">
            <h4 className="text-xs font-bold text-text-muted uppercase">Authority Operations Logs</h4>
            {issue.status_history?.length === 0 ? (
              <p className="text-xs text-text-muted italic">No official status logs filed yet.</p>
            ) : (
              <div className="space-y-3">
                {issue.status_history?.map((hist: any, index: number) => (
                  <div key={index} className="p-3 bg-bg-surface/50 border border-border/30 rounded-xl text-xs space-y-1">
                    <div className="flex justify-between items-center text-[10px] text-text-muted">
                      <span>Log #{index+1} • {new Date(hist.created_at).toLocaleString()}</span>
                      <span className="font-bold text-warning uppercase">Officer Action</span>
                    </div>
                    <p className="text-white"><strong className="text-accent-neon font-mono text-[10px] bg-accent-neon/10 px-1.5 py-0.5 rounded border border-accent-neon/20 mr-1.5">{hist.new_status.toUpperCase()}</strong>: {hist.note}</p>
                    {hist.evidence_url && (
                      <div className="mt-2 h-24 w-44 rounded-lg overflow-hidden border border-border">
                        <img src={hist.evidence_url} alt="Resolution Evidence" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. COMMENTS FORUM SECTION */}
      <div className="bg-bg-surface border border-border rounded-2xl p-6 md:p-8 space-y-6 shadow-xl">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-accent-neon" />
          Comments Community Forum
        </h3>

        {/* List comments */}
        <div className="space-y-4">
          {issue.comments?.length === 0 ? (
            <p className="text-xs text-text-muted italic">No comments filed on this forum yet. Participate respectfully!</p>
          ) : (
            <div className="space-y-3">
              {issue.comments?.map((c: Comment) => (
                <div key={c.id} className="p-3 bg-bg-secondary/40 border border-border/40 rounded-xl flex gap-3 text-xs">
                  <div className="w-8 h-8 rounded-full bg-primary-dark border border-border flex items-center justify-center shrink-0">
                    🧑‍💻
                  </div>
                  <div>
                    <div className="font-bold text-white mb-0.5">Contributor {c.user_id.slice(-4).toUpperCase()}</div>
                    <p className="text-text-secondary">"{c.text}"</p>
                    <span className="text-[9px] text-text-muted mt-1 block">{new Date(c.created_at).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input comment */}
        <div className="flex gap-2">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Write a comment..."
            className="w-full bg-bg-secondary text-sm text-white border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-accent-neon"
          />
          <button
            onClick={submitComment}
            disabled={submittingComment}
            className="px-5 py-3 bg-bg-secondary border border-border text-accent-neon hover:border-accent-neon rounded-xl flex items-center justify-center cursor-pointer transition-all shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

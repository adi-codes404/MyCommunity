/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { api } from '../api/client';
import { User, Issue, Verification } from '../types';
import SkeletonLoader from '../components/SkeletonLoader';
import { Award, Flame, Calendar, Trophy, ShieldAlert, Sparkles, AlertCircle, Clock, UserCheck, MapPin, Phone, User as UserIcon } from 'lucide-react';

interface ProfilePageProps {
  userId: string;
  onNavigate: (view: string) => void;
}

const BADGES_INFO: Record<string, { label: string; icon: string; desc: string; color: string }> = {
  'First Report': { label: 'First Report', icon: '🥇', desc: 'Successfully reported your first local neighborhood issue.', color: 'border-[#00D4FF]' },
  'Verified Contributor': { label: 'Verified Contributor', icon: '🎯', desc: 'Verified your first community report to audit local conditions.', color: 'border-[#39FF14]' },
  'Problem Solver': { label: 'Problem Solver', icon: '⭐', desc: 'Had 5 reported issues successfully resolved by municipal services.', color: 'border-[#FFD700]' },
  'Streak Hero': { label: 'Streak Hero', icon: '🔥', desc: 'Maintained consecutive weekly engagement contribution streaks.', color: 'border-[#F39C12]' },
  'Ward Guardian': { label: 'Ward Guardian', icon: '🛡️', desc: 'Top points earner in your local Indiranagar neighborhood sector.', color: 'border-[#9B59B6]' },
};

export default function ProfilePage({ userId, onNavigate }: ProfilePageProps) {
  const [profileData, setProfileData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await api.getUserProfile(userId);
        setProfileData(data);
      } catch (err) {
        console.error('Failed to load profile', err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [userId]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto pb-12">
        <SkeletonLoader className="h-[200px]" />
        <SkeletonLoader className="h-[120px]" />
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-bold">Failed to load user profile</h3>
      </div>
    );
  }

  const { user, stats, reported_issues, verifications } = profileData;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      
      {/* 1. HERO AVATAR SECTION */}
      <motion.div 
        className="bg-bg-surface border border-border rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden shadow-2xl"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent-neon/5 rounded-full blur-3xl" />
        
        <img 
          src={user.avatar_url} 
          alt={user.name} 
          className="w-24 h-24 rounded-full border-4 border-border shadow-lg"
        />

        <div className="text-center md:text-left space-y-2 flex-1">
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            <h1 className="text-3xl font-black text-white">{user.name}</h1>
            <span className="px-3 py-1 bg-accent-neon/10 border border-accent-neon/30 rounded-full text-xs font-black uppercase text-accent-neon self-center md:self-auto">
              {user.role}
            </span>
          </div>
          
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-2 text-sm text-text-secondary">
            <p className="font-medium">{user.email}</p>
            {user.phone && (
              <span className="flex items-center gap-1.5 text-xs text-text-muted">
                <Phone className="w-3.5 h-3.5 text-accent-lime" /> {user.phone}
              </span>
            )}
            {user.age && (
              <span className="flex items-center gap-1.5 text-xs text-text-muted">
                <UserIcon className="w-3.5 h-3.5 text-accent-neon" /> {user.age} years old
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-1">
            {user.locality && (
              <span className="flex items-center gap-1 text-xs text-accent-neon bg-accent-neon/5 px-2 py-1 rounded-md border border-accent-neon/10">
                <MapPin className="w-3.5 h-3.5 text-accent-neon" /> {user.locality}
              </span>
            )}
            <p className="text-xs text-text-muted flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Member since {new Date(user.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Dynamic points tracker tag */}
        <div className="p-4 bg-primary-dark/80 rounded-xl border border-accent-lime/40 text-center shrink-0 min-w-[120px]">
          <span className="text-[10px] text-text-muted font-bold block uppercase tracking-wider">CIVIC REPUTATION</span>
          <span className="text-3xl font-black font-mono text-accent-lime">+{user.points}</span>
          <span className="text-[10px] text-accent-lime font-bold block mt-0.5">Points Today</span>
        </div>
      </motion.div>

      {/* 2. GAMIFICATION WIDGET SHOWCASE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Streak Card */}
        <div className="bg-gradient-to-br from-primary to-primary-dark border border-border rounded-xl p-5 flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">ACTIVITY STREAK</span>
            <div className="text-2xl font-black text-white flex items-center gap-1.5">
              <Flame className="w-6 h-6 text-warning animate-pulse" />
              7-Day Streak!
            </div>
            <p className="text-xs text-text-muted">Keep posting local reports to boost</p>
          </div>
          <span className="text-4xl">🔥</span>
        </div>

        {/* Stats card */}
        <div className="bg-bg-surface border border-border rounded-xl p-5 flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">COMMUNITY IMPACT</span>
            <div className="text-2xl font-black text-white flex items-center gap-1.5">
              <Trophy className="w-6 h-6 text-accent-lime" />
              {stats.resolved_count} Solved!
            </div>
            <p className="text-xs text-text-muted">Issues successfully verified and repaired</p>
          </div>
          <span className="text-4xl">🏆</span>
        </div>

        {/* Badges Count Card */}
        <div className="bg-bg-surface border border-border rounded-xl p-5 flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">BADGES UNLOCKED</span>
            <div className="text-2xl font-black text-white flex items-center gap-1.5">
              <Award className="w-6 h-6 text-accent-neon" />
              {user.badges?.length || 0} Badges
            </div>
            <p className="text-xs text-text-muted">Earn tags by submitting local verifications</p>
          </div>
          <span className="text-4xl">🏅</span>
        </div>

      </div>

      {/* 3. BADGES COLLECTION SHOWCASE */}
      <div className="bg-bg-surface border border-border rounded-2xl p-6 md:p-8 space-y-6 shadow-xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Award className="w-5 h-5 text-accent-lime" />
          Acquired Badges Showcase
        </h2>

        {user.badges?.length === 0 ? (
          <p className="text-xs text-text-muted italic">No badges unlocked yet. Submit local reports and confirmations to claim medals!</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {user.badges?.map((badgeName: string) => {
              const info = BADGES_INFO[badgeName] || { label: badgeName, icon: '🏅', desc: 'Earned by contributing to My Community.', color: 'border-border' };
              return (
                <div 
                  key={badgeName} 
                  className={`p-4 bg-bg-secondary/40 border rounded-xl flex gap-3.5 items-start ${info.color} hover:shadow-[0_0_12px_rgba(0,212,255,0.05)] transition-all`}
                >
                  <span className="text-3xl p-1.5 bg-primary-dark/80 rounded-lg">{info.icon}</span>
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm text-white">{info.label}</h4>
                    <p className="text-[10px] text-text-secondary leading-tight">{info.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. HISTORY LIST SPLIT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Reported Issues history list */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-accent-neon" />
            Reported Issue Cases
          </h3>
          {reported_issues.length === 0 ? (
            <p className="text-xs text-text-muted italic bg-bg-surface border border-border rounded-xl p-4">No reported cases filed yet.</p>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {reported_issues.map((i: Issue) => (
                <div 
                  key={i.id} 
                  onClick={() => onNavigate(`issue-detail-${i.id}`)}
                  className="p-3 bg-bg-surface hover:border-accent-neon/30 border border-border rounded-xl cursor-pointer transition-all flex items-center justify-between text-xs"
                >
                  <div className="space-y-1">
                    <span className="font-bold text-white block line-clamp-1">{i.title}</span>
                    <span className="text-text-secondary flex items-center gap-1">
                      <Clock className="w-3 h-3 text-text-muted" />
                      {new Date(i.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 bg-bg-secondary text-accent-lime font-black rounded uppercase text-[10px]">
                    {i.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Verifications logs history */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-accent-lime" />
            Verification Actions Logs
          </h3>
          {verifications.length === 0 ? (
            <p className="text-xs text-text-muted italic bg-bg-surface border border-border rounded-xl p-4">No verifications filed yet.</p>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {verifications.map((v: Verification) => (
                <div 
                  key={v.id} 
                  onClick={() => onNavigate(`issue-detail-${v.issue_id}`)}
                  className="p-3 bg-bg-surface hover:border-accent-lime/30 border border-border rounded-xl cursor-pointer transition-all flex items-center justify-between text-xs"
                >
                  <div className="space-y-1">
                    <span className="font-bold text-white block">Verified Issue ID: #{v.issue_id.slice(-4).toUpperCase()}</span>
                    <p className="text-text-muted italic font-medium">"{v.comment}"</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${v.verdict === 'confirm' ? 'bg-success/20 text-success' : 'bg-critical/20 text-critical'}`}>
                    {v.verdict}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}

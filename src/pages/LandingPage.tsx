/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { api } from '../api/client';
import { Issue, LeaderboardEntry } from '../types';
import MapContainer from '../components/MapContainer';
import { Shield, Sparkles, Award, Map, ArrowRight, CheckCircle2, AlertTriangle, Play } from 'lucide-react';

interface LandingPageProps {
  onNavigate: (view: string) => void;
  currentUserId: string;
}

export default function LandingPage({ onNavigate, currentUserId }: LandingPageProps) {
  const [stats, setStats] = useState({ total: 0, resolved: 0, inProgress: 0 });
  const [issues, setIssues] = useState<Issue[]>([]);
  const [topContributors, setTopContributors] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLandingData() {
      try {
        const allIssues = await api.getIssues({}, currentUserId);
        setIssues(allIssues.slice(0, 8)); // load a few for map

        const total = allIssues.length;
        const resolved = allIssues.filter(i => i.status === 'resolved' || i.status === 'closed').length;
        const inProgress = allIssues.filter(i => i.status === 'in_progress' || i.status === 'assigned').length;

        setStats({ total, resolved, inProgress });

        const leaderboard = await api.getLeaderboard();
        setTopContributors(leaderboard.slice(0, 3));
      } catch (err) {
        console.error('Failed to load landing data', err);
      } finally {
        setLoading(false);
      }
    }
    loadLandingData();
  }, [currentUserId]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } }
  };

  return (
    <div className="space-y-12 pb-12">
      {/* 1. HERO HERO SECTION */}
      <motion.div 
        className="text-center py-12 md:py-16 px-4 rounded-3xl bg-gradient-to-br from-primary via-primary-dark to-bg-dark border border-border relative overflow-hidden"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(#00D4FF_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <motion.div 
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-neon/10 border border-accent-neon/30 text-accent-neon text-sm font-semibold mb-6"
        >
          <Sparkles className="w-4 h-4 text-accent-neon animate-pulse" />
          Powered by Community & Gemini AI
        </motion.div>

        <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight max-w-4xl mx-auto mb-6 text-white">
          Be the Hero Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-neon to-accent-lime">Neighborhood</span> Needs
        </h1>

        <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-10 font-normal">
          Report civic issues, verify problems with neighbors, and track resolutions transparently. Earn points, unlock badges, and shape a better community.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => onNavigate('report-issue')}
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-accent-neon to-accent-lime text-bg-dark font-extrabold text-lg rounded-xl hover:shadow-[0_8px_32px_rgba(0,212,255,0.4)] transition-all transform hover:-translate-y-1 active:translate-y-0 duration-200 cursor-pointer flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(0,212,255,0.2)]"
          >
            <Shield className="w-5 h-5 text-bg-dark" />
            Report an Issue Now
            <ArrowRight className="w-5 h-5 text-bg-dark" />
          </button>

          <button
            onClick={() => onNavigate('feed')}
            className="w-full sm:w-auto px-8 py-4 bg-bg-secondary hover:bg-bg-secondary/80 text-white font-bold text-lg rounded-xl border-2 border-border transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Map className="w-5 h-5 text-accent-neon" />
            Explore Live Map
          </button>
        </div>
      </motion.div>

      {/* 2. CORE IMPACT HERO METRIC CARDS */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <motion.div 
          className="bg-gradient-to-br from-primary to-primary-dark border-2 border-accent-neon/30 rounded-2xl p-6 shadow-[0_0_24px_rgba(0,212,255,0.05)] hover:shadow-[0_0_32px_rgba(0,212,255,0.15)] transition-all hover:scale-[1.03] duration-300 relative overflow-hidden"
          variants={itemVariants}
        >
          <div className="absolute right-4 top-4 opacity-10">
            <AlertTriangle className="w-16 h-16 text-accent-neon" />
          </div>
          <div className="text-sm uppercase tracking-wider text-text-secondary font-semibold mb-2">Total Issues Tracked</div>
          <div className="text-5xl font-black font-mono text-accent-neon">{loading ? '...' : stats.total}</div>
          <p className="text-xs text-text-muted mt-2">Active reports uploaded by citizens</p>
        </motion.div>

        <motion.div 
          className="bg-gradient-to-br from-primary to-primary-dark border border-border rounded-2xl p-6 shadow-md hover:shadow-[0_0_24px_rgba(46,204,113,0.1)] transition-all hover:scale-[1.03] duration-300 relative overflow-hidden"
          variants={itemVariants}
        >
          <div className="absolute right-4 top-4 opacity-10">
            <CheckCircle2 className="w-16 h-16 text-success" />
          </div>
          <div className="text-sm uppercase tracking-wider text-text-secondary font-semibold mb-2">Resolved Problems</div>
          <div className="text-5xl font-black font-mono text-success">{loading ? '...' : stats.resolved}</div>
          <p className="text-xs text-text-muted mt-2">Successfully restored civic standards</p>
        </motion.div>

        <motion.div 
          className="bg-gradient-to-br from-primary to-primary-dark border border-border rounded-2xl p-6 shadow-md hover:shadow-[0_0_24px_rgba(243,156,18,0.1)] transition-all hover:scale-[1.03] duration-300 relative overflow-hidden"
          variants={itemVariants}
        >
          <div className="absolute right-4 top-4 opacity-10">
            <Play className="w-16 h-16 text-warning" />
          </div>
          <div className="text-sm uppercase tracking-wider text-text-secondary font-semibold mb-2">Assigned & In Progress</div>
          <div className="text-5xl font-black font-mono text-warning">{loading ? '...' : stats.inProgress}</div>
          <p className="text-xs text-text-muted mt-2">Currently being resolved by city works</p>
        </motion.div>
      </motion.div>

      {/* 3. MAP LIVE PREVIEW & LEADERBOARD SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Map Preview */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Map className="w-6 h-6 text-accent-neon" />
              Live Hotspots Map
            </h2>
            <button 
              onClick={() => onNavigate('map')}
              className="text-sm text-accent-neon font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              Full Screen Map <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="h-[350px] rounded-2xl overflow-hidden border border-border shadow-lg">
            {!loading && (
              <MapContainer 
                issues={issues} 
                center={[12.971, 77.594]} 
                zoom={12} 
                onMarkerClick={(issue) => {
                  onNavigate(`issue-detail-${issue.id}`);
                }}
                interactive={false}
              />
            )}
          </div>
        </div>

        {/* Top Contributors Leaderboard Snippet */}
        <div className="bg-bg-surface border border-border rounded-2xl p-6 space-y-6 flex flex-col justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2 mb-2">
              <Award className="w-6 h-6 text-accent-lime" />
              Top Contributor Champions
            </h2>
            <p className="text-sm text-text-secondary mb-4">
              Leaderboard rankings reset monthly. Engage to claim top ward guardian tags!
            </p>

            <div className="space-y-4">
              {loading ? (
                <div className="space-y-3">
                  <div className="h-12 bg-bg-secondary/40 animate-pulse rounded-lg" />
                  <div className="h-12 bg-bg-secondary/40 animate-pulse rounded-lg" />
                  <div className="h-12 bg-bg-secondary/40 animate-pulse rounded-lg" />
                </div>
              ) : topContributors.length === 0 ? (
                <p className="text-sm text-text-muted">No contributors logged yet this month.</p>
              ) : (
                topContributors.map((entry, index) => (
                  <div 
                    key={entry.user_id} 
                    className="flex items-center justify-between p-3 rounded-xl bg-bg-secondary border border-border/40 hover:border-accent-neon/30 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img 
                          src={entry.avatar_url} 
                          alt={entry.name} 
                          className="w-10 h-10 rounded-full border border-border" 
                        />
                        <span className="absolute -top-1 -left-1 w-5 h-5 flex items-center justify-center text-[10px] font-black rounded-full bg-accent-lime text-bg-dark">
                          {index + 1}
                        </span>
                      </div>
                      <div>
                        <div className="font-bold text-sm text-white">{entry.name}</div>
                        <div className="text-[10px] font-mono font-bold uppercase text-accent-neon bg-accent-neon/5 px-2 py-0.5 rounded border border-accent-neon/20 inline-block mt-0.5">
                          {entry.role}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-black text-accent-lime">+{entry.points} pts</div>
                      <div className="text-[10px] text-text-muted">{entry.badges_count} Badges</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigate('leaderboard')}
            className="w-full mt-4 py-3 bg-bg-secondary hover:bg-bg-secondary/80 border border-border text-sm font-bold text-white rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            Show Full Leaderboard
            <ArrowRight className="w-4 h-4 text-accent-lime" />
          </button>
        </div>
      </div>
    </div>
  );
}

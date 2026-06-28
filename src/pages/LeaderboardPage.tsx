/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { api } from '../api/client';
import { LeaderboardEntry } from '../types';
import SkeletonLoader from '../components/SkeletonLoader';
import { Trophy, Award, MapPin, Search } from 'lucide-react';

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [selectedWard, setSelectedWard] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLeaderboard() {
      setLoading(true);
      try {
        const res = await api.getLeaderboard(selectedWard || undefined);
        setLeaderboard(res);
      } catch (err) {
        console.error('Failed to load leaderboard', err);
      } finally {
        setLoading(false);
      }
    }
    loadLeaderboard();
  }, [selectedWard]);

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16">
      
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-2">
            <Trophy className="w-8 h-8 text-accent-lime" />
            Civic Contributor Rankings
          </h1>
          <p className="text-sm text-text-secondary">Community reputations leaderboard. Resets monthly!</p>
        </div>

        {/* Ward Filter Dropdown */}
        <div className="flex items-center gap-2 bg-bg-surface border border-border p-2 rounded-xl">
          <MapPin className="w-4 h-4 text-accent-neon shrink-0" />
          <select
            value={selectedWard}
            onChange={(e) => setSelectedWard(e.target.value)}
            className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer pr-1"
          >
            <option value="" className="bg-bg-surface text-white font-semibold">City-Wide (All Wards)</option>
            <option value="ward-1" className="bg-bg-surface text-white font-semibold">Indiranagar Ward</option>
            <option value="ward-2" className="bg-bg-surface text-white font-semibold">Koramangala Ward</option>
            <option value="ward-3" className="bg-bg-surface text-white font-semibold">Malleswaram Ward</option>
          </select>
        </div>
      </div>

      {/* TOP 3 PODIUM HERO CONTAINER */}
      {!loading && leaderboard.length >= 3 && (
        <div className="grid grid-cols-3 gap-4 items-end pt-10 pb-4 max-w-lg mx-auto">
          {/* Rank 2 (Left) */}
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="relative">
              <img 
                src={leaderboard[1].avatar_url} 
                alt={leaderboard[1].name} 
                className="w-16 h-16 rounded-full border-2 border-border"
              />
              <span className="absolute -top-1 -left-1 w-6 h-6 flex items-center justify-center text-xs font-bold rounded-full bg-[#B0C4DE] text-bg-dark">2</span>
            </div>
            <div>
              <div className="font-extrabold text-xs text-white line-clamp-1">{leaderboard[1].name}</div>
              <div className="text-[10px] font-mono font-black text-accent-lime">+{leaderboard[1].points} pts</div>
            </div>
            <div className="w-full h-16 bg-bg-surface border-t border-border rounded-t-xl" />
          </div>

          {/* Rank 1 (Center Podium Highlight!) */}
          <div className="flex flex-col items-center text-center space-y-2 transform -translate-y-3">
            <div className="relative">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-2xl animate-bounce">👑</div>
              <img 
                src={leaderboard[0].avatar_url} 
                alt={leaderboard[0].name} 
                className="w-20 h-20 rounded-full border-4 border-accent-lime shadow-[0_0_24px_rgba(57,255,20,0.2)]"
              />
              <span className="absolute -top-1 -left-1 w-7 h-7 flex items-center justify-center text-sm font-black rounded-full bg-accent-lime text-bg-dark">1</span>
            </div>
            <div>
              <div className="font-black text-sm text-white line-clamp-1">{leaderboard[0].name}</div>
              <div className="text-xs font-mono font-black text-accent-lime">+{leaderboard[0].points} pts</div>
            </div>
            <div className="w-full h-24 bg-gradient-to-t from-primary/50 to-bg-surface border-t-2 border-accent-lime rounded-t-xl flex items-center justify-center text-xs text-accent-lime font-black">
              🏆 CHAMP
            </div>
          </div>

          {/* Rank 3 (Right) */}
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="relative">
              <img 
                src={leaderboard[2].avatar_url} 
                alt={leaderboard[2].name} 
                className="w-14 h-14 rounded-full border-2 border-border"
              />
              <span className="absolute -top-1 -left-1 w-6 h-6 flex items-center justify-center text-xs font-bold rounded-full bg-[#D35400] text-white">3</span>
            </div>
            <div>
              <div className="font-extrabold text-xs text-white line-clamp-1">{leaderboard[2].name}</div>
              <div className="text-[10px] font-mono font-black text-accent-lime">+{leaderboard[2].points} pts</div>
            </div>
            <div className="w-full h-12 bg-bg-surface border-t border-border rounded-t-xl" />
          </div>
        </div>
      )}

      {/* FULL SCROLLABLE RANKS TABLE */}
      <div className="bg-bg-surface border border-border rounded-2xl p-4 md:p-6 shadow-xl">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-1.5">
          <Award className="w-5 h-5 text-accent-lime" />
          Roster Leaderboard list
        </h3>

        {loading ? (
          <div className="space-y-3">
            <SkeletonLoader className="h-[55px]" count={5} />
          </div>
        ) : leaderboard.length === 0 ? (
          <p className="text-xs text-text-muted italic py-6 text-center">No community ranks logged yet.</p>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((entry, index) => {
              const rank = index + 1;
              const isPodium = rank <= 3;

              return (
                <div 
                  key={entry.user_id}
                  className={`p-4 rounded-xl border flex items-center justify-between text-sm transition-all hover:scale-[1.01] ${
                    rank === 1 ? 'bg-accent-lime/5 border-accent-lime/40' :
                    rank === 2 ? 'bg-accent-neon/5 border-accent-neon/30' :
                    rank === 3 ? 'bg-primary-light/10 border-border/60' : 'bg-bg-secondary/30 border-border/40'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Rank indicator */}
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-black font-mono ${
                      rank === 1 ? 'bg-accent-lime text-bg-dark text-sm' :
                      rank === 2 ? 'bg-[#B0C4DE] text-bg-dark text-xs' :
                      rank === 3 ? 'bg-[#D35400] text-white text-xs' : 'bg-primary-dark text-text-muted border border-border'
                    }`}>
                      {rank}
                    </span>

                    {/* Contributor Profile details */}
                    <div className="flex items-center gap-3">
                      <img src={entry.avatar_url} alt={entry.name} className="w-10 h-10 rounded-full border border-border shrink-0" />
                      <div>
                        <div className="font-bold text-white">{entry.name}</div>
                        <span className="text-[9px] font-mono font-bold uppercase text-accent-neon bg-accent-neon/5 px-2 py-0.5 rounded border border-accent-neon/20 inline-block mt-0.5">
                          {entry.role}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Points tracker */}
                  <div className="text-right">
                    <span className="font-mono font-black text-accent-lime text-base">+{entry.points} pts</span>
                    <p className="text-[10px] text-text-muted mt-0.5">{entry.badges_count} Badges claimed</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}

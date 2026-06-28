/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { api } from './api/client';
import { User } from './types';
import { motion, AnimatePresence } from 'motion/react';

// Custom sub pages
import LandingPage from './pages/LandingPage';
import FeedPage from './pages/FeedPage';
import ReportIssuePage from './pages/ReportIssuePage';
import IssueDetailPage from './pages/IssueDetailPage';
import ProfilePage from './pages/ProfilePage';
import LeaderboardPage from './pages/LeaderboardPage';
import AuthorityDashboardPage from './pages/AuthorityDashboardPage';

// Shared custom components
import RoleSelector from './components/RoleSelector';
import { Shield, Map, FilePlus, Users, Award, ShieldAlert, Sparkles, Home, Menu, X, UserPlus } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function App() {
  const [currentView, setCurrentView] = useState<string>('landing');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);

  const [signupForm, setSignupForm] = useState({
    name: '',
    email: '',
    phone: '',
    age: '',
    locality: '',
    role: 'citizen',
    ward_id: 'ward-1'
  });
  const [signupError, setSignupError] = useState('');
  const [signupSubmitting, setSignupSubmitting] = useState(false);

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');
    
    // Validate
    if (!signupForm.name.trim()) {
      setSignupError('Please enter your full name.');
      return;
    }
    if (!signupForm.email.trim() || !signupForm.email.includes('@')) {
      setSignupError('Please enter a valid email address.');
      return;
    }
    if (!signupForm.phone.trim()) {
      setSignupError('Please enter your mobile phone number.');
      return;
    }
    const parsedAge = parseInt(signupForm.age, 10);
    if (isNaN(parsedAge) || parsedAge < 1 || parsedAge > 120) {
      setSignupError('Please enter a realistic age between 1 and 120.');
      return;
    }
    if (!signupForm.locality.trim()) {
      setSignupError('Please specify your locality/area.');
      return;
    }

    setSignupSubmitting(true);
    try {
      const newUser = await api.signup({
        name: signupForm.name.trim(),
        email: signupForm.email.trim().toLowerCase(),
        phone: signupForm.phone.trim(),
        age: parsedAge,
        locality: signupForm.locality.trim(),
        role: signupForm.role as any,
        ward_id: signupForm.ward_id
      });
      
      // Update loaded list of accounts in switcher
      setAllUsers(prev => [newUser, ...prev]);
      setCurrentUser(newUser);
      setIsSignupModalOpen(false);
      
      // Fire confetti celebration
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });
      
      // Reset signup form state
      setSignupForm({
        name: '',
        email: '',
        phone: '',
        age: '',
        locality: '',
        role: 'citizen',
        ward_id: 'ward-1'
      });
      
      // Focus on user's new profile view
      setCurrentView('profile');
    } catch (err: any) {
      setSignupError(err.message || 'Registration failed. Email might already exist.');
    } finally {
      setSignupSubmitting(false);
    }
  };

  // Load initial simulated users session list
  useEffect(() => {
    async function initSession() {
      try {
        const loadedUsers = await api.getUsers();
        setAllUsers(loadedUsers);
        
        // Default to Siddharth Roy (citizen) on startup if available, else first user
        const defaultUser = loadedUsers.find(u => u.id === 'user-citizen-1') || loadedUsers[0];
        if (defaultUser) {
          const user = await api.getCurrentUser(defaultUser.id);
          setCurrentUser(user);
        }
      } catch (err) {
        console.error('Failed to initialize active sessions list', err);
      } finally {
        setLoading(false);
      }
    }
    initSession();
  }, []);

  // Hot reload active user details when simulated actor changes
  const handleUserChange = async (selectedUser: User) => {
    setLoading(true);
    try {
      const user = await api.getCurrentUser(selectedUser.id);
      setCurrentUser(user);
      // Reset view to landing to prevent permission gaps on role changes
      setCurrentView('landing');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Dispatch navigation pages rendering
  const renderPageView = () => {
    if (!currentUser) return null;

    if (currentView === 'landing') {
      return <LandingPage onNavigate={setCurrentView} currentUserId={currentUser.id} />;
    }
    if (currentView === 'feed') {
      return <FeedPage onNavigate={setCurrentView} currentUserId={currentUser.id} />;
    }
    if (currentView === 'report-issue') {
      return <ReportIssuePage onNavigate={setCurrentView} currentUserId={currentUser.id} />;
    }
    if (currentView === 'profile') {
      return <ProfilePage userId={currentUser.id} onNavigate={setCurrentView} />;
    }
    if (currentView === 'leaderboard') {
      return <LeaderboardPage />;
    }
    if (currentView === 'dashboard') {
      return <AuthorityDashboardPage onNavigate={setCurrentView} currentUserId={currentUser.id} />;
    }
    if (currentView.startsWith('issue-detail-')) {
      const issueId = currentView.replace('issue-detail-', '');
      return <IssueDetailPage issueId={issueId} onNavigate={setCurrentView} currentUser={currentUser} />;
    }

    return <LandingPage onNavigate={setCurrentView} currentUserId={currentUser.id} />;
  };

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen bg-[#0A0E1A] flex flex-col items-center justify-center space-y-4">
        <Sparkles className="w-12 h-12 text-[#00D4FF] animate-spin" />
        <p className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent-neon to-accent-lime animate-pulse">
          Booting My Community Platform...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white flex flex-col font-sans">
      
      {/* HEADER BAR */}
      <header className="sticky top-0 z-50 bg-[#0A0E1A]/95 border-b border-border backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* Logo brand */}
          <div 
            onClick={() => setCurrentView('landing')}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-10 h-10 bg-gradient-to-tr from-accent-neon to-accent-lime rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(0,212,255,0.25)] group-hover:scale-105 transition-transform">
              <Shield className="w-6 h-6 text-bg-dark stroke-[2.5]" />
            </div>
            <div>
              <span className="font-heading font-black text-lg tracking-tight block">MY COMMUNITY</span>
              <span className="text-[10px] text-accent-neon font-black font-mono tracking-widest block uppercase -mt-1">Civic Terminal</span>
            </div>
          </div>

          {/* Nav Links Desktop */}
          <nav className="hidden md:flex items-center gap-6">
            <button
              onClick={() => setCurrentView('landing')}
              className={`text-sm font-bold hover:text-accent-neon transition-colors flex items-center gap-1 cursor-pointer ${currentView === 'landing' ? 'text-accent-neon' : 'text-text-secondary'}`}
            >
              <Home className="w-4 h-4" /> Home
            </button>
            <button
              onClick={() => setCurrentView('feed')}
              className={`text-sm font-bold hover:text-accent-neon transition-colors flex items-center gap-1 cursor-pointer ${currentView === 'feed' ? 'text-accent-neon' : 'text-text-secondary'}`}
            >
              <Map className="w-4 h-4" /> Active Feed
            </button>
            <button
              onClick={() => setCurrentView('report-issue')}
              className={`text-sm font-bold hover:text-accent-neon transition-colors flex items-center gap-1 cursor-pointer ${currentView === 'report-issue' ? 'text-accent-neon' : 'text-text-secondary'}`}
            >
              <FilePlus className="w-4 h-4" /> File Report
            </button>
            <button
              onClick={() => setCurrentView('leaderboard')}
              className={`text-sm font-bold hover:text-accent-neon transition-colors flex items-center gap-1 cursor-pointer ${currentView === 'leaderboard' ? 'text-accent-neon' : 'text-text-secondary'}`}
            >
              <Users className="w-4 h-4" /> Leaderboard
            </button>
            <button
              onClick={() => setCurrentView('profile')}
              className={`text-sm font-bold hover:text-accent-neon transition-colors flex items-center gap-1 cursor-pointer ${currentView === 'profile' ? 'text-accent-neon' : 'text-text-secondary'}`}
            >
              <Award className="w-4 h-4" /> Profile ({currentUser.points} pts)
            </button>

            {/* Role-gated official console link */}
            {['authority', 'admin'].includes(currentUser.role) && (
              <button
                onClick={() => setCurrentView('dashboard')}
                className={`px-3 py-1.5 rounded-lg border text-xs font-black uppercase flex items-center gap-1 cursor-pointer transition-all ${currentView === 'dashboard' ? 'bg-warning text-bg-dark border-warning' : 'border-warning/50 text-warning hover:bg-warning/10'}`}
              >
                <ShieldAlert className="w-3.5 h-3.5" /> Dispatch Console
              </button>
            )}
          </nav>

          {/* Role selector widget right-aligned */}
          <div className="hidden lg:flex items-center gap-4">
            <button
              onClick={() => setIsSignupModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-accent-neon to-accent-lime hover:opacity-90 active:scale-95 text-bg-dark font-extrabold text-xs rounded-full cursor-pointer flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,212,255,0.2)] transition-all"
            >
              <UserPlus className="w-3.5 h-3.5 stroke-[2.5]" />
              Make Account
            </button>
            <RoleSelector 
              currentUser={currentUser} 
              onUserChange={handleUserChange} 
              allUsers={allUsers} 
            />
          </div>

          {/* Mobile hamburger */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-text-secondary hover:text-white cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

        </div>
      </header>

      {/* MOBILE DROP NAV MENU */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed top-16 left-0 w-full bg-[#0A0E1A] border-b border-border z-40 p-4 space-y-4">
          <nav className="flex flex-col gap-3">
            <button
              onClick={() => { setCurrentView('landing'); setMobileMenuOpen(false); }}
              className="text-sm font-bold text-left p-2 hover:bg-bg-secondary rounded-lg"
            >
              Home
            </button>
            <button
              onClick={() => { setCurrentView('feed'); setMobileMenuOpen(false); }}
              className="text-sm font-bold text-left p-2 hover:bg-bg-secondary rounded-lg"
            >
              Active Feed
            </button>
            <button
              onClick={() => { setCurrentView('report-issue'); setMobileMenuOpen(false); }}
              className="text-sm font-bold text-left p-2 hover:bg-bg-secondary rounded-lg"
            >
              File Report
            </button>
            <button
              onClick={() => { setCurrentView('leaderboard'); setMobileMenuOpen(false); }}
              className="text-sm font-bold text-left p-2 hover:bg-bg-secondary rounded-lg"
            >
              Leaderboard
            </button>
            <button
              onClick={() => { setCurrentView('profile'); setMobileMenuOpen(false); }}
              className="text-sm font-bold text-left p-2 hover:bg-bg-secondary rounded-lg"
            >
              Profile ({currentUser.points} pts)
            </button>
            {['authority', 'admin'].includes(currentUser.role) && (
              <button
                onClick={() => { setCurrentView('dashboard'); setMobileMenuOpen(false); }}
                className="text-sm font-bold text-left p-2 text-warning hover:bg-bg-secondary rounded-lg"
              >
                Dispatch Console
              </button>
            )}
          </nav>

          {/* Role selector in mobile view */}
          <div className="pt-4 border-t border-border flex flex-col gap-3">
            <button
              onClick={() => { setIsSignupModalOpen(true); setMobileMenuOpen(false); }}
              className="w-full py-2 bg-gradient-to-r from-accent-neon to-accent-lime hover:opacity-90 text-bg-dark font-extrabold text-xs rounded-full flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(0,212,255,0.2)]"
            >
              <UserPlus className="w-3.5 h-3.5 stroke-[2.5]" />
              Make Account
            </button>
            <RoleSelector 
              currentUser={currentUser} 
              onUserChange={handleUserChange} 
              allUsers={allUsers} 
            />
          </div>
        </div>
      )}

      {/* CORE VIEW SCREEN */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 relative">
        {renderPageView()}
      </main>

      {/* FOOTER BAR */}
      <footer className="border-t border-border/60 py-6 bg-primary-dark/40 text-center text-xs text-text-muted">
        <p>© 2026 My Community. Shaping transparent civic action together.</p>
      </footer>

      {/* SIGNUP MODAL */}
      <AnimatePresence>
        {isSignupModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSignupModalOpen(false)}
              className="absolute inset-0 bg-[#000000]/85 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative w-full max-w-lg bg-[#0E1326] border border-border rounded-2xl shadow-[0_0_50px_rgba(0,212,255,0.15)] overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-border/60 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-white flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-accent-neon" />
                    Create Citizen Profile
                  </h3>
                  <p className="text-xs text-text-secondary mt-1">Register your real account details to file & verify reports</p>
                </div>
                <button
                  onClick={() => setIsSignupModalOpen(false)}
                  className="p-1.5 hover:bg-bg-secondary rounded-lg text-text-secondary hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSignupSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
                {signupError && (
                  <div className="p-3 bg-critical/10 border border-critical/30 rounded-lg text-xs font-medium text-critical">
                    {signupError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-text-muted tracking-wider">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aarav Sharma"
                    value={signupForm.name}
                    onChange={(e) => setSignupForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-[#161C33] border border-border/60 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent-neon transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase text-text-muted tracking-wider">Age (Years)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="120"
                      placeholder="e.g. 28"
                      value={signupForm.age}
                      onChange={(e) => setSignupForm(prev => ({ ...prev, age: e.target.value }))}
                      className="w-full bg-[#161C33] border border-border/60 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent-neon transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase text-text-muted tracking-wider">Locality / Area</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Indiranagar Sector 3"
                      value={signupForm.locality}
                      onChange={(e) => setSignupForm(prev => ({ ...prev, locality: e.target.value }))}
                      className="w-full bg-[#161C33] border border-border/60 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent-neon transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase text-text-muted tracking-wider">Mobile Number</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +91 98765 43210"
                      value={signupForm.phone}
                      onChange={(e) => setSignupForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full bg-[#161C33] border border-border/60 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent-neon transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase text-text-muted tracking-wider">Email ID</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. aarav@example.com"
                      value={signupForm.email}
                      onChange={(e) => setSignupForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full bg-[#161C33] border border-border/60 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent-neon transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase text-text-muted tracking-wider">Role</label>
                    <select
                      value={signupForm.role}
                      onChange={(e) => setSignupForm(prev => ({ ...prev, role: e.target.value }))}
                      className="w-full bg-[#161C33] border border-border/60 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent-neon transition-colors cursor-pointer"
                    >
                      <option value="citizen">Citizen (Reports & Upvotes)</option>
                      <option value="volunteer">Volunteer (Verifies issues)</option>
                      <option value="authority">Official Authority (Resolves issues)</option>
                      <option value="admin">Admin Console Controller</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase text-text-muted tracking-wider">Home Ward</label>
                    <select
                      value={signupForm.ward_id}
                      onChange={(e) => setSignupForm(prev => ({ ...prev, ward_id: e.target.value }))}
                      className="w-full bg-[#161C33] border border-border/60 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent-neon transition-colors cursor-pointer"
                    >
                      <option value="ward-1">Indiranagar Ward</option>
                      <option value="ward-2">Koramangala Ward</option>
                      <option value="ward-3">Malleswaram Ward</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-border/40 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsSignupModalOpen(false)}
                    className="px-4 py-2 bg-bg-secondary hover:bg-bg-secondary/80 border border-border rounded-xl text-sm font-bold text-white transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={signupSubmitting}
                    className="px-6 py-2 bg-gradient-to-r from-accent-neon to-accent-lime text-bg-dark font-black text-sm rounded-xl hover:shadow-[0_4px_15px_rgba(0,212,255,0.3)] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                  >
                    {signupSubmitting ? (
                      <>
                        <Sparkles className="w-4 h-4 animate-spin text-bg-dark" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 text-bg-dark" />
                        Create Account
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import imageCompression from 'browser-image-compression';
import confetti from 'canvas-confetti';
import { api } from '../api/client';
import { IssueCategory, IssueSeverity } from '../types';
import MapContainer from '../components/MapContainer';
import { Upload, Sparkles, MapPin, Check, Camera, ArrowRight, ArrowLeft, Loader2, Info } from 'lucide-react';

interface ReportIssuePageProps {
  onNavigate: (view: string) => void;
  currentUserId: string;
}

const CATEGORIES: { value: IssueCategory; label: string; icon: string }[] = [
  { value: 'roads', label: 'Roads & Pavement', icon: '🛣️' },
  { value: 'water', label: 'Water Leaks/Supply', icon: '💧' },
  { value: 'sanitation', label: 'Sanitation/Sewage', icon: '🧹' },
  { value: 'garbage', label: 'Garbage & Litter', icon: '🗑️' },
  { value: 'lighting', label: 'Street Lighting', icon: '💡' },
  { value: 'drainage', label: 'Drainage Systems', icon: '🚰' },
  { value: 'civic_behavior', label: 'Civic Behavior/Nuisance', icon: '👥' },
  { value: 'other', label: 'Other/Misc Hazards', icon: '❓' },
];

export default function ReportIssuePage({ onNavigate, currentUserId }: ReportIssuePageProps) {
  const [step, setStep] = useState(1);
  const [loadingAI, setLoadingAI] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [image, setImage] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<IssueCategory>('other');
  const [severity, setSeverity] = useState<IssueSeverity>('medium');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number }>({ lat: 12.9716, lng: 77.5946 }); // Default Bangalore Center
  const [address, setAddress] = useState('Central Metro Sector, Metro City');
  
  // AI Suggestions Metadata
  const [aiSuggested, setAiSuggested] = useState(false);
  const [aiTags, setAiTags] = useState<string[]>([]);
  const [submittedIssueId, setSubmittedIssueId] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Photo Selection
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoadingAI(true);
    try {
      // 1. Client-side compression as mandated
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1024,
        useWebWorker: true
      };
      const compressedFile = await imageCompression(file, options);
      
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        setImage(base64String);

        // 2. Trigger Real-Time Gemini Multimodal Classification!
        try {
          const aiRes = await api.categorizeIssueWithAI(base64String, description);
          if (aiRes) {
            setCategory(aiRes.category as IssueCategory);
            setSeverity(aiRes.severity as IssueSeverity);
            setTitle(aiRes.summary);
            setAiTags(aiRes.suggested_tags);
            setAiSuggested(true);
          }
        } catch (err) {
          console.error('Gemini AI categorization failed. Falling back.', err);
        } finally {
          setLoadingAI(false);
          setStep(2); // Auto proceed to step 2 after upload + AI analysis!
        }
      };
      reader.readAsDataURL(compressedFile);
    } catch (err) {
      console.error('Compression error:', err);
      setLoadingAI(false);
    }
  };

  // Text-only Fallback triggers Gemini text categorization
  const triggerTextOnlyAI = async () => {
    if (!description.trim()) return;
    setLoadingAI(true);
    try {
      const aiRes = await api.categorizeIssueWithAI(undefined, description);
      if (aiRes) {
        setCategory(aiRes.category as IssueCategory);
        setSeverity(aiRes.severity as IssueSeverity);
        setTitle(aiRes.summary);
        setAiTags(aiRes.suggested_tags);
        setAiSuggested(true);
      }
    } catch (err) {
      console.error('Gemini Text AI classification failed', err);
    } finally {
      setLoadingAI(false);
      setStep(2);
    }
  };

  // Auto-capture GPS Geolocation
  const captureGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setCoordinates({ lat, lng });

          // Reverse geocoding
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const data = await res.json();
            if (data && data.display_name) {
              setAddress(data.display_name.split(',').slice(0, 3).join(','));
            }
          } catch (err) {
            setAddress(`Coords: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
          }
        },
        () => {
          alert('Failed to get GPS location. Please pin manually on the map.');
        }
      );
    }
  };

  // Submit Issue
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        title: title || `${category.toUpperCase()} problem reported`,
        description,
        category,
        severity,
        lat: coordinates.lat,
        lng: coordinates.lng,
        address,
        media_urls: image ? [image] : []
      };

      const result = await api.createIssue(payload, currentUserId);
      setSubmittedIssueId(result.id);
      
      // Celebrate with confetti!
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#00D4FF', '#39FF14', '#FFD700', '#2ECC71']
      });

      setStep(3);
    } catch (err) {
      console.error('Submission failed', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-12">
      {/* HEADER TRAIL */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-black tracking-tight text-white mb-2">Report a Civic Issue</h1>
        <p className="text-sm text-text-secondary">Improve our neighborhood in 3 quick steps</p>
        
        {/* Progress Timeline Indicator */}
        <div className="flex items-center justify-center gap-2 mt-6">
          <span className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold ${step >= 1 ? 'bg-accent-neon text-bg-dark font-black' : 'bg-bg-secondary text-text-muted border border-border'}`}>1</span>
          <span className={`h-1 w-12 rounded-full ${step >= 2 ? 'bg-accent-neon' : 'bg-border'}`} />
          <span className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold ${step >= 2 ? 'bg-accent-neon text-bg-dark font-black' : 'bg-bg-secondary text-text-muted border border-border'}`}>2</span>
          <span className={`h-1 w-12 rounded-full ${step >= 3 ? 'bg-accent-neon' : 'bg-border'}`} />
          <span className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold ${step >= 3 ? 'bg-accent-lime text-bg-dark font-black animate-bounce' : 'bg-bg-secondary text-text-muted border border-border'}`}>✓</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* STEP 1: UPLOAD PHOTO / MEDIA */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-bg-surface border border-border rounded-2xl p-6 md:p-8 space-y-6"
          >
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Camera className="w-5 h-5 text-accent-neon" />
              Step 1: Upload Evidence
            </h2>
            
            {/* DRAG AND DROP AREA */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border hover:border-accent-neon/50 bg-bg-secondary/20 hover:bg-bg-secondary/40 rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 relative group"
            >
              {loadingAI ? (
                <div className="text-center py-6 space-y-4">
                  <Loader2 className="w-12 h-12 text-accent-neon animate-spin mx-auto" />
                  <p className="text-sm font-bold text-accent-neon animate-pulse flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 animate-bounce" />
                    Gemini AI analyzing your image in real-time...
                  </p>
                  <p className="text-xs text-text-muted">Extracting categories, details, and severity</p>
                </div>
              ) : (
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 bg-primary-dark rounded-full flex items-center justify-center mx-auto border border-border group-hover:scale-110 transition-transform duration-200">
                    <Upload className="w-8 h-8 text-accent-neon" />
                  </div>
                  <div>
                    <span className="text-white font-bold block">Drag & Drop issue photo here</span>
                    <span className="text-text-secondary text-sm">or tap to select camera capture</span>
                  </div>
                  <span className="inline-block px-3 py-1 bg-accent-neon/10 border border-accent-neon/30 rounded-full text-[10px] uppercase font-black tracking-wider text-accent-neon">
                    Highly Recommended for AI classification
                  </span>
                </div>
              )}
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*" 
                onChange={handlePhotoUpload}
                className="hidden" 
                disabled={loadingAI}
              />
            </div>

            {/* TEXT FALLBACK BLOCK */}
            <div className="border-t border-border pt-6 space-y-3">
              <label className="block text-sm font-bold text-text-secondary flex items-center gap-1">
                <Info className="w-4 h-4 text-text-muted" />
                No photo? Continue with text description instead
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the issue in detail (e.g. 'Huge water leak near the Indiranagar Metro Station, water is spilling all over the walkway...')"
                className="w-full bg-bg-secondary text-white border border-border focus:border-accent-neon rounded-xl p-4 text-sm min-h-[100px] focus:outline-none focus:ring-1 focus:ring-accent-neon transition-all"
                disabled={loadingAI}
              />

              <div className="flex justify-end">
                <button
                  onClick={triggerTextOnlyAI}
                  disabled={!description.trim() || loadingAI}
                  className="px-6 py-3 bg-bg-secondary border border-border text-white hover:border-accent-neon text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {loadingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-accent-neon" />}
                  Let AI Categorize & Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 2: CONFIRM / DEFINE DETAILS & LOCATION MAP */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="bg-bg-surface border border-border rounded-2xl p-6 md:p-8 space-y-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent-neon" />
                Step 2: Confirm Issue Details
                {aiSuggested && (
                  <span className="text-[10px] font-black uppercase text-bg-dark bg-accent-neon px-2.5 py-1 rounded-full animate-bounce">
                    ★ Suggested by AI
                  </span>
                )}
              </h2>

              {/* Title Input */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-text-secondary">Issue Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="E.g. Broken streetlight causing nighttime blackout"
                  className="w-full bg-bg-secondary border border-border rounded-xl px-4 py-3 text-white font-semibold focus:border-accent-neon focus:outline-none focus:ring-1 focus:ring-accent-neon transition-all"
                />
              </div>

              {/* Category & Severity side by side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Category Select */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-text-secondary">Issue Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as IssueCategory)}
                    className="w-full bg-bg-secondary border border-border rounded-xl px-4 py-3 text-white font-semibold focus:border-accent-neon focus:outline-none"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value} className="bg-bg-surface text-white">
                        {cat.icon} {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Severity Select */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-text-secondary">Severity Urgency</label>
                  <div className="flex gap-2">
                    {(['low', 'medium', 'high', 'critical'] as IssueSeverity[]).map((sev) => (
                      <button
                        key={sev}
                        type="button"
                        onClick={() => setSeverity(sev)}
                        className={`flex-1 py-3 text-xs font-extrabold capitalize rounded-xl border transition-all cursor-pointer ${
                          severity === sev
                            ? sev === 'critical'
                              ? 'bg-critical border-critical text-white'
                              : sev === 'high'
                              ? 'bg-critical/80 border-critical/80 text-white'
                              : sev === 'medium'
                              ? 'bg-warning border-warning text-bg-dark'
                              : 'bg-text-muted border-text-muted text-white'
                            : 'bg-bg-secondary border-border text-text-secondary hover:border-text-muted'
                        }`}
                      >
                        {sev}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* AI Tags display */}
              {aiTags.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 bg-primary-dark/40 p-3 rounded-xl border border-border/40">
                  <span className="text-xs text-accent-neon font-bold flex items-center gap-1 mr-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    AI Tags:
                  </span>
                  {aiTags.map((tag, idx) => (
                    <span key={idx} className="text-xs text-text-secondary bg-bg-secondary px-2.5 py-1 rounded border border-border">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Text description */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-text-secondary">Additional Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add details, symptoms, exact landmark references, how long the issue has persisted, etc."
                  className="w-full bg-bg-secondary border border-border rounded-xl p-4 text-white text-sm focus:border-accent-neon focus:outline-none focus:ring-1 focus:ring-accent-neon min-h-[120px]"
                />
              </div>
            </div>

            {/* LOCATION SECTOR */}
            <div className="bg-bg-surface border border-border rounded-2xl p-6 md:p-8 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-accent-neon" />
                  Step 3: Point Location On Map
                </h3>
                <button
                  type="button"
                  onClick={captureGPS}
                  className="px-3.5 py-1.5 bg-accent-neon/10 border border-accent-neon/30 text-accent-neon text-xs font-bold rounded-lg hover:bg-accent-neon hover:text-bg-dark transition-all flex items-center gap-1 cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  Auto-Detect GPS
                </button>
              </div>

              <div className="bg-bg-secondary rounded-xl p-3 border border-border flex items-center gap-3">
                <MapPin className="w-5 h-5 text-accent-neon shrink-0 animate-pulse" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Pin landmark or drag map marker"
                  className="w-full bg-transparent text-sm text-white focus:outline-none font-semibold"
                />
              </div>

              <div className="h-[280px] rounded-xl overflow-hidden border border-border shadow-inner">
                <MapContainer
                  issues={[]}
                  center={[coordinates.lat, coordinates.lng]}
                  zoom={14}
                  onMapClick={(coords) => {
                    setCoordinates({ lat: coords.lat, lng: coords.lng });
                    setAddress(coords.address);
                  }}
                  highlightCoordinates={[{ lat: coordinates.lat, lng: coordinates.lng, radius: 200, color: '#00D4FF' }]}
                />
              </div>
              <p className="text-xs text-text-muted text-center italic">
                Blue circle denotes the 200m duplicate check detection zone.
              </p>
            </div>

            {/* NAVIGATION ACTIONS */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-6 py-3 bg-bg-secondary text-white font-bold rounded-xl border border-border hover:border-text-secondary transition-all flex items-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="px-8 py-3 bg-gradient-to-r from-accent-neon to-accent-lime text-bg-dark font-black rounded-xl hover:shadow-[0_4px_16px_rgba(0,212,255,0.4)] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting Report...
                  </>
                ) : (
                  <>
                    Submit & Dispatch
                    <Check className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 3: SUCCESS CELEBRATION SCREEN */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-bg-surface border-2 border-accent-lime rounded-2xl p-8 md:p-12 text-center space-y-6 relative overflow-hidden"
          >
            {/* Background elements */}
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-accent-lime/10 blur-3xl" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-accent-neon/10 blur-3xl" />

            <div className="w-20 h-20 bg-accent-lime/10 border border-accent-lime/40 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl animate-bounce">
              🎉
            </div>

            <h2 className="text-3xl font-black text-white">Report Successfully Filed!</h2>
            
            <p className="text-text-secondary text-base max-w-lg mx-auto">
              Outstanding! Your neighborhood report is successfully dispatched. Community members can now verify this issue to prioritize civic resolution.
            </p>

            {/* Points earned badge */}
            <div className="inline-flex flex-col items-center p-4 rounded-xl bg-gradient-to-b from-primary/60 to-primary-dark/60 border border-accent-lime/40 mb-6">
              <span className="text-[10px] text-accent-lime font-black uppercase tracking-widest">AWARDS UNLOCKED</span>
              <span className="text-3xl font-extrabold font-mono text-accent-lime">+10 points</span>
              <span className="text-xs text-text-muted mt-1">"First Report" Badge Unlocked!</span>
            </div>

            <div className="space-y-3 pt-4 max-w-sm mx-auto">
              <button
                onClick={() => onNavigate(`issue-detail-${submittedIssueId}`)}
                className="w-full py-3.5 bg-gradient-to-r from-accent-neon to-accent-lime text-bg-dark font-extrabold rounded-xl hover:shadow-[0_4px_16px_rgba(0,212,255,0.4)] transition-all cursor-pointer text-center"
              >
                Track Live Progress Timeline
              </button>

              <button
                onClick={() => {
                  // Reset State
                  setTitle('');
                  setDescription('');
                  setImage(null);
                  setAiSuggested(false);
                  setAiTags([]);
                  setStep(1);
                }}
                className="w-full py-3 bg-bg-secondary text-white font-bold rounded-xl border border-border hover:border-text-secondary transition-all cursor-pointer"
              >
                File Another Local Report
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

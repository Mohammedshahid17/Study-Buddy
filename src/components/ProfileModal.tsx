import React, { useState } from 'react';
import { UserProfile } from '../types';
import { COURSES } from '../utils/storage';
import { X, User, Flame, BookOpen, Volume2, ShieldCheck, LogOut, Check } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onUpdateProfile,
}) => {
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [course, setCourse] = useState(profile.course);
  const [isGuest, setIsGuest] = useState(profile.isGuest);
  const [savedToast, setSavedToast] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      ...profile,
      name: name.trim() || 'Alex Chen',
      email: email.trim() || 'student@campus.edu',
      course,
      isGuest,
    });
    setSavedToast(true);
    setTimeout(() => {
      setSavedToast(false);
      onClose();
    }, 1000);
  };

  const handleToggleGuest = () => {
    setIsGuest(!isGuest);
    if (!isGuest) {
      setName('Guest Student');
      setEmail('guest@studybuddy.local');
    } else {
      setName('Alex Chen');
      setEmail('alex.student@campus.edu');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md rounded-2xl bg-[#141414] border border-[#262626] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#222222] bg-[#171717]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#F97316]/20 border border-[#F97316]/40 flex items-center justify-center text-base">
              🎓
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Student Profile & Settings</h2>
              <p className="text-[11px] text-[#94A3B8]">Personalize your coursework & AI tutor</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#737373] hover:text-white hover:bg-[#262626] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="p-5 space-y-4">
          {/* Study Streak Badge */}
          <div className="p-3 rounded-xl bg-gradient-to-r from-[#1f1912] to-[#171717] border border-[#F97316]/30 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#F97316]/20 flex items-center justify-center text-[#F97316]">
                <Flame className="w-5 h-5 fill-[#F97316]" />
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>{profile.streakDays} Day Study Streak</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#F97316]/20 text-[#F97316]">
                    On Fire!
                  </span>
                </div>
                <div className="text-[11px] text-[#94A3B8]">Consistent daily practice boosts retention by 80%</div>
              </div>
            </div>
          </div>

          {/* Student Status Toggle */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#1a1a1a] border border-[#262626] text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#10B981]" />
              <span className="text-[#E5E5E5] font-medium">
                {isGuest ? 'Guest Student Mode' : 'Authenticated Campus Account'}
              </span>
            </div>
            <button
              type="button"
              onClick={handleToggleGuest}
              className="text-[11px] text-[#F97316] hover:underline font-semibold"
            >
              {isGuest ? 'Switch to Login' : 'Use as Guest'}
            </button>
          </div>

          {/* Name Field */}
          <div>
            <label className="block text-xs font-semibold text-[#A3A3A3] mb-1">
              Student Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#1b1b1b] border border-[#2b2b2b] text-white text-xs focus:outline-none focus:border-[#F97316]"
              placeholder="e.g. Alex Chen"
              required
            />
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-xs font-semibold text-[#A3A3A3] mb-1">
              Email / Student ID
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#1b1b1b] border border-[#2b2b2b] text-white text-xs focus:outline-none focus:border-[#F97316]"
              placeholder="student@university.edu"
              required
            />
          </div>

          {/* Coursework Selector */}
          <div>
            <label className="block text-xs font-semibold text-[#A3A3A3] mb-1">
              Active Coursework Focus
            </label>
            <select
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#1b1b1b] border border-[#2b2b2b] text-white text-xs focus:outline-none focus:border-[#F97316]"
            >
              {COURSES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                onUpdateProfile({
                  ...profile,
                  name: 'Student',
                  isGuest: true,
                });
                onClose();
              }}
              className="px-3 py-2 rounded-xl text-xs text-[#737373] hover:text-white hover:bg-[#222222] transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-black font-bold text-xs transition-all shadow-md flex items-center gap-1.5"
            >
              {savedToast ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Saved!
                </>
              ) : (
                'Save Preferences'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

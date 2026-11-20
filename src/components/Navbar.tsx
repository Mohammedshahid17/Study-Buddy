import React from 'react';
import { Menu, Plus, Trash2, Award, User, Lightbulb, Sparkles, BookOpen } from 'lucide-react';
import { UserProfile } from '../types';

interface NavbarProps {
  onToggleSidebar: () => void;
  onNewChat: () => void;
  onClearChat: () => void;
  hasMessages: boolean;
  onOpenQuiz: () => void;
  onOpenProfile: () => void;
  profile: UserProfile;
  socraticMode: boolean;
  onToggleSocraticMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  onNewChat,
  onClearChat,
  hasMessages,
  onOpenQuiz,
  onOpenProfile,
  profile,
  socraticMode,
  onToggleSocraticMode,
}) => {
  return (
    <header className="sticky top-0 z-30 h-14 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-[#222222] px-3 sm:px-4 flex items-center justify-between">
      {/* Left: Sidebar toggle & Title */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onToggleSidebar}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-[#94A3B8] hover:text-white hover:bg-[#1A1A1A] transition-colors"
          title="Toggle chat history"
          aria-label="Toggle history menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#F97316]/20 to-[#EA580C]/30 border border-[#F97316]/40 flex items-center justify-center text-sm shadow-sm ring-1 ring-[#F97316]/20">
            🎓
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-white text-sm sm:text-base tracking-tight leading-tight flex items-center gap-1.5">
              StudyBuddy
              <span className="hidden sm:inline-block text-[10px] font-semibold px-1.5 py-0.2 rounded bg-[#F97316]/20 text-[#F97316] border border-[#F97316]/30">
                CS Tutor
              </span>
            </span>
            <span className="text-[10px] text-[#737373] hidden sm:block truncate max-w-[180px]">
              {profile.course.split(':')[0]}
            </span>
          </div>
        </div>
      </div>

      {/* Center / Right: Quick Actions */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        {/* Diagnostic Quiz Button */}
        <button
          onClick={onOpenQuiz}
          className="h-9 px-2.5 sm:px-3 rounded-xl bg-[#171717] hover:bg-[#222222] border border-[#2a2a2a] text-xs font-medium text-[#E5E5E5] hover:text-white transition-all flex items-center gap-1.5 shadow-sm"
          title="Take an interactive diagnostic quiz"
        >
          <Award className="w-3.5 h-3.5 text-[#F97316]" />
          <span className="hidden md:inline">Quiz</span>
        </button>

        {/* New Chat Button */}
        <button
          onClick={onNewChat}
          className="h-9 px-2.5 sm:px-3 rounded-xl bg-[#171717] hover:bg-[#222222] border border-[#2a2a2a] text-xs font-medium text-[#E5E5E5] hover:text-white transition-all flex items-center gap-1.5 shadow-sm"
          title="Start fresh conversation"
        >
          <Plus className="w-3.5 h-3.5 text-[#38BDF8]" />
          <span className="hidden md:inline">New Chat</span>
        </button>

        {/* Clear Chat Button (enabled if conversation has messages) */}
        {hasMessages && (
          <button
            onClick={onClearChat}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[#737373] hover:text-red-400 hover:bg-red-950/20 border border-transparent hover:border-red-500/20 transition-all"
            title="Clear current chat"
            aria-label="Clear chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}

        {/* Profile / Account Indicator */}
        <button
          onClick={onOpenProfile}
          className="h-9 pl-2 pr-2.5 rounded-xl bg-[#171717] hover:bg-[#222222] border border-[#2a2a2a] flex items-center gap-1.5 text-xs text-[#E5E5E5] hover:text-white transition-all ml-1"
          title="Student profile & settings"
        >
          <div className="w-5 h-5 rounded-full bg-[#262626] border border-[#383838] flex items-center justify-center text-[11px]">
            {profile.avatar || '🎓'}
          </div>
          <span className="font-medium hidden sm:inline max-w-[90px] truncate">{profile.name}</span>
          <span className="text-[10px] text-[#F97316] font-mono hidden lg:inline">
            🔥{profile.streakDays}d
          </span>
        </button>
      </div>
    </header>
  );
};

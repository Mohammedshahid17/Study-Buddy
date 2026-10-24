import React from 'react';
import { ChatSession } from '../types';
import { Plus, MessageSquare, Trash2, Download, X, GraduationCap, Clock, ChevronRight } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  onClearAllSessions: () => void;
  activeCourse: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onClearAllSessions,
  activeCourse,
}) => {
  const exportSession = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    const markdownContent = [
      `# StudyBuddy Session: ${session.title}`,
      `Course: ${session.course}`,
      `Date: ${new Date(session.createdAt).toLocaleDateString()}`,
      '',
      '---',
      '',
      ...session.messages.map((m) => {
        const role = m.role === 'user' ? 'Student' : 'StudyBuddy 🎓';
        return `### ${role} (${new Date(m.timestamp).toLocaleTimeString()})\n\n${m.content}\n\n`;
      }),
    ].join('\n');

    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${session.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden animate-in fade-in"
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-72 sm:w-80 bg-[#0E0E0E] border-r border-[#222222] flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:static md:w-72'
        }`}
      >
        {/* Top Header */}
        <div className="p-4 border-b border-[#222222] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#F97316]/10 border border-[#F97316]/30 flex items-center justify-center text-lg">
              🎓
            </div>
            <div>
              <div className="text-sm font-bold text-white tracking-tight">StudyBuddy</div>
              <div className="text-[10px] text-[#737373] truncate max-w-[170px]">{activeCourse}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center text-[#737373] hover:text-white hover:bg-[#222222]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <button
            onClick={() => {
              onNewSession();
              if (window.innerWidth < 768) onClose();
            }}
            className="w-full py-2.5 px-3 rounded-xl bg-[#1A1A1A] hover:bg-[#242424] border border-[#2b2b2b] hover:border-[#F97316]/40 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 group shadow-sm"
          >
            <Plus className="w-4 h-4 text-[#F97316] group-hover:scale-110 transition-transform" />
            <span>New Study Topic</span>
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 scrollbar-thin">
          <div className="text-[11px] font-semibold text-[#525252] px-2 py-1 uppercase tracking-wider flex items-center justify-between">
            <span>Recent Conversations</span>
            <span className="text-[10px]">{sessions.length}</span>
          </div>

          {sessions.length === 0 ? (
            <div className="px-3 py-8 text-center text-xs text-[#737373]">
              No study threads yet. Start asking a question!
            </div>
          ) : (
            sessions.map((s) => {
              const isActive = s.id === activeSessionId;
              return (
                <div
                  key={s.id}
                  onClick={() => {
                    onSelectSession(s.id);
                    if (window.innerWidth < 768) onClose();
                  }}
                  className={`group relative flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all text-xs ${
                    isActive
                      ? 'bg-[#1D1D1D] text-white border border-[#333333] shadow-sm font-medium'
                      : 'text-[#A3A3A3] hover:text-white hover:bg-[#161616]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-1">
                    <MessageSquare
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isActive ? 'text-[#F97316]' : 'text-[#525252] group-hover:text-[#94A3B8]'
                      }`}
                    />
                    <div className="min-w-0">
                      <div className="truncate text-xs">{s.title || 'Untitled Session'}</div>
                      <div className="text-[10px] text-[#555] flex items-center gap-1.5 mt-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(s.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        <span>•</span>
                        <span>{s.messages.length} msgs</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions on hover */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => exportSession(s, e)}
                      className="p-1 rounded hover:bg-[#282828] text-[#737373] hover:text-white"
                      title="Export as Markdown"
                    >
                      <Download className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession(s.id);
                      }}
                      className="p-1 rounded hover:bg-red-950/40 text-[#737373] hover:text-red-400"
                      title="Delete thread"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom bar */}
        {sessions.length > 0 && (
          <div className="p-3 border-t border-[#1f1f1f]">
            <button
              onClick={onClearAllSessions}
              className="w-full py-2 px-3 rounded-lg text-xs text-[#737373] hover:text-red-400 hover:bg-red-950/20 transition-colors flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear All History
            </button>
          </div>
        )}
      </aside>
    </>
  );
};

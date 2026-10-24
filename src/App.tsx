import React, { useState, useEffect, useRef } from 'react';
import {
  ChatSession,
  Message,
  UserProfile,
  Attachment,
} from './types';
import {
  getStoredProfile,
  saveStoredProfile,
  getStoredSessions,
  saveStoredSessions,
  getActiveSessionId,
  setActiveSessionId,
  createNewSession,
  generateSessionTitleFromMessage,
} from './utils/storage';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { EmptyState } from './components/EmptyState';
import { MessageItem } from './components/MessageItem';
import { ChatInput } from './components/ChatInput';
import { QuizModal } from './components/QuizModal';
import { CodeExplainerModal } from './components/CodeExplainerModal';
import { ProfileModal } from './components/ProfileModal';
import { ConfirmModal } from './components/ConfirmModal';
import { ArrowDown } from 'lucide-react';

export default function App() {
  const [profile, setProfile] = useState<UserProfile>(getStoredProfile);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionIdState, setActiveSessionIdState] = useState<string | null>(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [socraticMode, setSocraticMode] = useState<boolean>(() => profile.socraticModeDefault);
  const [isGenerating, setIsGenerating] = useState(false);

  // Modals state
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [quizTopic, setQuizTopic] = useState('Python Basics');
  const [isExplainerOpen, setIsExplainerOpen] = useState(false);
  const [explainerCode, setExplainerCode] = useState('');
  const [explainerLang, setExplainerLang] = useState('python');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);

  // Scroll tracking
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load initial sessions
  useEffect(() => {
    const loadedSessions = getStoredSessions();
    if (loadedSessions.length > 0) {
      setSessions(loadedSessions);
      const activeId = getActiveSessionId();
      const sessionExists = loadedSessions.some((s) => s.id === activeId);
      const chosenId = sessionExists ? activeId : loadedSessions[0].id;
      setActiveSessionIdState(chosenId);
      setActiveSessionId(chosenId);
    } else {
      const initial = createNewSession(profile.course);
      setSessions([initial]);
      setActiveSessionIdState(initial.id);
      setActiveSessionId(initial.id);
      saveStoredSessions([initial]);
    }
  }, []);

  // Save sessions to storage on change
  useEffect(() => {
    if (sessions.length > 0) {
      saveStoredSessions(sessions);
    }
  }, [sessions]);

  // Save profile to storage on change
  useEffect(() => {
    saveStoredProfile(profile);
  }, [profile]);

  // Current active session
  const currentSession = sessions.find((s) => s.id === activeSessionIdState) || sessions[0];
  const messages = currentSession?.messages || [];

  // Scroll to bottom helper
  const scrollToBottom = (smooth = true) => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTo({
        top: chatScrollRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  };

  // Detect scroll position to show "scroll to bottom" button
  const handleScroll = () => {
    if (chatScrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatScrollRef.current;
      const isFarFromBottom = scrollHeight - scrollTop - clientHeight > 180;
      setShowScrollBottom(isFarFromBottom);
    }
  };

  // Update messages in current session
  const updateCurrentSessionMessages = (
    updater: (prevMessages: Message[]) => Message[],
    updateTitle = false,
    firstPromptText = ''
  ) => {
    setSessions((prevSessions) => {
      return prevSessions.map((s) => {
        if (s.id === currentSession?.id) {
          const nextMessages = updater(s.messages);
          let newTitle = s.title;
          if (updateTitle && (s.title === 'New Study Topic' || !s.title) && firstPromptText) {
            newTitle = generateSessionTitleFromMessage(firstPromptText);
          }
          return {
            ...s,
            title: newTitle,
            messages: nextMessages,
            updatedAt: Date.now(),
          };
        }
        return s;
      });
    });
  };

  // Handle Send Message
  const handleSendMessage = async (text: string, attachments: Attachment[] = []) => {
    if ((!text.trim() && attachments.length === 0) || isGenerating) return;

    const userMsgId = 'msg_' + Date.now() + '_u';
    const botMsgId = 'msg_' + (Date.now() + 1) + '_b';

    const newUserMessage: Message = {
      id: userMsgId,
      role: 'user',
      content: text,
      timestamp: Date.now(),
      attachments: attachments.length > 0 ? attachments : undefined,
    };

    const initialBotMessage: Message = {
      id: botMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now() + 1,
      isStreaming: true,
      socraticHint: socraticMode,
    };

    const isFirstInSession = messages.length === 0;

    // Append user message and empty bot message
    updateCurrentSessionMessages(
      (prev) => [...prev, newUserMessage, initialBotMessage],
      isFirstInSession,
      text
    );

    setIsGenerating(true);
    setTimeout(() => scrollToBottom(true), 50);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // Prepare history for API
      const conversationHistory = [
        ...messages.map((m) => ({
          role: m.role,
          content: m.content,
          attachments: m.attachments,
        })),
        {
          role: 'user' as const,
          content: text,
          attachments: attachments,
        },
      ];

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: conversationHistory,
          socraticMode,
          studentCourse: profile.course,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with ${response.status}`);
      }

      if (!response.body) {
        throw new Error('Response body stream is not available');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6).trim();
            if (!dataStr) continue;

            try {
              const data = JSON.parse(dataStr);
              if (data.error) {
                throw new Error(data.error);
              }
              if (data.chunk) {
                accumulatedContent += data.chunk;
                updateCurrentSessionMessages((prev) =>
                  prev.map((m) =>
                    m.id === botMsgId
                      ? {
                          ...m,
                          content: accumulatedContent,
                        }
                      : m
                  )
                );
                // Keep view at bottom while streaming if close to bottom
                if (chatScrollRef.current) {
                  const { scrollTop, scrollHeight, clientHeight } = chatScrollRef.current;
                  if (scrollHeight - scrollTop - clientHeight < 150) {
                    scrollToBottom(false);
                  }
                }
              }
            } catch (err: any) {
              console.warn('Could not parse SSE message:', dataStr, err);
            }
          }
        }
      }

      // Generate suggested follow-ups based on the topic
      const followUps = generateFollowUps(accumulatedContent, text);

      // Finalize bot message
      updateCurrentSessionMessages((prev) =>
        prev.map((m) =>
          m.id === botMsgId
            ? {
                ...m,
                content: accumulatedContent || "I'm here to help! Could you clarify what you'd like to explore next?",
                isStreaming: false,
                suggestedFollowUps: followUps,
              }
            : m
        )
      );

      // Update study streak on first message of the day
      checkAndUpdateStreak();
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // User clicked Stop Generating
        updateCurrentSessionMessages((prev) =>
          prev.map((m) =>
            m.id === botMsgId
              ? {
                  ...m,
                  isStreaming: false,
                  content: m.content ? m.content + '\n\n*(Generation stopped by student)*' : '*(Generation stopped)*',
                }
              : m
          )
        );
      } else {
        console.error('Chat generation error:', err);
        updateCurrentSessionMessages((prev) =>
          prev.map((m) =>
            m.id === botMsgId
              ? {
                  ...m,
                  isStreaming: false,
                  error: true,
                  content:
                    'Connection interrupted or API limit reached. Tap the retry button below to re-send.',
                }
              : m
          )
        );
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
      setTimeout(() => scrollToBottom(true), 100);
    }
  };

  const generateFollowUps = (botReply: string, userPrompt: string): string[] => {
    const lower = (botReply + ' ' + userPrompt).toLowerCase();
    const suggestions: string[] = [];

    if (lower.includes('recursion') || lower.includes('recursive')) {
      suggestions.push('Can you show how the call stack unwinds step-by-step?');
      suggestions.push('What happens if I forget the base case in Python?');
    } else if (lower.includes('loop') || lower.includes('for') || lower.includes('while')) {
      suggestions.push('How do I avoid an off-by-one error with range()?');
      suggestions.push('Can we test this with a quick 3-line example?');
    } else if (lower.includes('javascript') || lower.includes('===') || lower.includes('type')) {
      suggestions.push('Show a quiz question on tricky JavaScript coercion');
      suggestions.push('How does Python compare for equality vs identity (is)?');
    } else if (lower.includes('array') || lower.includes('list')) {
      suggestions.push('How is a Python list stored in computer memory?');
      suggestions.push('What is the Big-O time complexity of list.append() vs insert(0)?');
    } else {
      suggestions.push('Can you give me a real-world analogy for this?');
      suggestions.push('What are the most common beginner traps with this?');
      suggestions.push('Test me with a quick diagnostic question!');
    }

    return suggestions.slice(0, 3);
  };

  const handleStopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleRetryLastMessage = () => {
    // Find last user message
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUserMsg) return;

    // Remove failed bot message
    updateCurrentSessionMessages((prev) => {
      const lastIndex = prev.length - 1;
      if (lastIndex >= 0 && prev[lastIndex].role === 'assistant' && prev[lastIndex].error) {
        return prev.slice(0, -1);
      }
      return prev;
    });

    handleSendMessage(lastUserMsg.content, lastUserMsg.attachments || []);
  };

  const checkAndUpdateStreak = () => {
    const today = new Date().toISOString().split('T')[0];
    if (profile.lastActiveDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const isConsecutive = profile.lastActiveDate === yesterday;
      setProfile((prev) => ({
        ...prev,
        streakDays: isConsecutive ? prev.streakDays + 1 : 1,
        lastActiveDate: today,
      }));
    }
  };

  // Session Handlers
  const handleNewSession = () => {
    const newSession = createNewSession(profile.course);
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionIdState(newSession.id);
    setActiveSessionId(newSession.id);
  };

  const handleSelectSession = (id: string) => {
    setActiveSessionIdState(id);
    setActiveSessionId(id);
    setTimeout(() => scrollToBottom(false), 50);
  };

  const handleDeleteSession = (id: string) => {
    const updated = sessions.filter((s) => s.id !== id);
    if (updated.length === 0) {
      const fresh = createNewSession(profile.course);
      setSessions([fresh]);
      setActiveSessionIdState(fresh.id);
      setActiveSessionId(fresh.id);
    } else {
      setSessions(updated);
      if (activeSessionIdState === id) {
        setActiveSessionIdState(updated[0].id);
        setActiveSessionId(updated[0].id);
      }
    }
  };

  const handleConfirmClearChat = () => {
    updateCurrentSessionMessages(() => []);
  };

  const handleClearAllHistory = () => {
    const fresh = createNewSession(profile.course);
    setSessions([fresh]);
    setActiveSessionIdState(fresh.id);
    setActiveSessionId(fresh.id);
  };

  const handleOpenCodeExplainer = (code: string, language: string) => {
    setExplainerCode(code);
    setExplainerLang(language);
    setIsExplainerOpen(true);
  };

  const handleOpenQuiz = (topic = 'Python Basics') => {
    setQuizTopic(topic);
    setIsQuizOpen(true);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0A0A0A] text-white">
      {/* Sidebar Drawer */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        sessions={sessions}
        activeSessionId={activeSessionIdState}
        onSelectSession={handleSelectSession}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
        onClearAllSessions={handleClearAllHistory}
        activeCourse={profile.course}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 relative">
        {/* Top Navbar */}
        <Navbar
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onNewChat={handleNewSession}
          onClearChat={() => setIsConfirmClearOpen(true)}
          hasMessages={messages.length > 0}
          onOpenQuiz={() => handleOpenQuiz('Python & JavaScript Fundamentals')}
          onOpenProfile={() => setIsProfileOpen(true)}
          profile={profile}
          socraticMode={socraticMode}
          onToggleSocraticMode={() => setSocraticMode(!socraticMode)}
        />

        {/* Chat Messages Body */}
        <main
          ref={chatScrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin relative flex flex-col"
          aria-live="polite"
        >
          {messages.length === 0 ? (
            <div className="my-auto">
              <EmptyState
                onSelectPrompt={(p) => handleSendMessage(p)}
                onOpenQuiz={handleOpenQuiz}
              />
            </div>
          ) : (
            <div className="max-w-4xl w-full mx-auto py-4 space-y-2">
              {messages.map((msg) => (
                <MessageItem
                  key={msg.id}
                  message={msg}
                  onRetry={handleRetryLastMessage}
                  onSelectPrompt={(p) => handleSendMessage(p)}
                  onExplainCode={handleOpenCodeExplainer}
                />
              ))}
            </div>
          )}
        </main>

        {/* Scroll To Bottom Button */}
        {showScrollBottom && (
          <button
            onClick={() => scrollToBottom(true)}
            className="absolute bottom-24 right-5 sm:right-8 z-20 w-9 h-9 rounded-full bg-[#1e1e1e] hover:bg-[#2a2a2a] border border-[#333333] text-white flex items-center justify-center shadow-lg transition-all animate-bounce"
            title="Scroll to latest message"
            aria-label="Scroll to latest message"
          >
            <ArrowDown className="w-4 h-4 text-[#F97316]" />
          </button>
        )}

        {/* Bottom Input Area */}
        <footer className="shrink-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/95 to-transparent pt-1 pb-safe z-10">
          <ChatInput
            onSendMessage={handleSendMessage}
            isGenerating={isGenerating}
            onStopGenerating={handleStopGenerating}
            socraticMode={socraticMode}
            onToggleSocraticMode={() => setSocraticMode(!socraticMode)}
          />
        </footer>
      </div>

      {/* Diagnostic Quiz Modal */}
      <QuizModal
        isOpen={isQuizOpen}
        onClose={() => setIsQuizOpen(false)}
        defaultTopic={quizTopic}
        onAskStudyBuddyAboutQuestion={(qPrompt) => handleSendMessage(qPrompt)}
      />

      {/* Code Explainer Modal */}
      <CodeExplainerModal
        isOpen={isExplainerOpen}
        onClose={() => setIsExplainerOpen(false)}
        code={explainerCode}
        language={explainerLang}
      />

      {/* Profile & Settings Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        profile={profile}
        onUpdateProfile={(updated) => setProfile(updated)}
      />

      {/* Confirm Clear Chat Modal */}
      <ConfirmModal
        isOpen={isConfirmClearOpen}
        onClose={() => setIsConfirmClearOpen(false)}
        onConfirm={handleConfirmClearChat}
        title="Clear Current Chat?"
        description="This will clear all messages in this study thread. You will not be able to undo this action."
        confirmText="Clear Chat"
      />
    </div>
  );
}

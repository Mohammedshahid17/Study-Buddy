import React, { useState, useEffect } from 'react';
import { Message } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { speechService } from '../utils/speech';
import { Volume2, VolumeX, Copy, Check, Sparkles, AlertCircle, RefreshCw, FileText, Image as ImageIcon, Lightbulb } from 'lucide-react';
import { formatBytes } from '../utils/fileReader';

interface MessageItemProps {
  message: Message;
  onRetry?: () => void;
  onSelectPrompt?: (prompt: string) => void;
  onExplainCode?: (code: string, language: string) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  onRetry,
  onSelectPrompt,
  onExplainCode,
}) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [speechStatus, setSpeechStatus] = useState<'idle' | 'playing' | 'paused'>('idle');

  useEffect(() => {
    const unsubscribe = speechService.subscribe((state) => {
      if (state.messageId === message.id) {
        setSpeechStatus(state.status);
      } else {
        setSpeechStatus('idle');
      }
    });
    return () => unsubscribe();
  }, [message.id]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleSpeech = () => {
    if (speechStatus === 'playing') {
      speechService.stop();
    } else {
      speechService.speak(message.id, message.content);
    }
  };

  return (
    <div
      className={`group relative flex gap-3 px-3 py-3 transition-colors ${
        isUser ? 'flex-row-reverse justify-start' : 'flex-row justify-start'
      }`}
    >
      {/* Avatar */}
      <div className="shrink-0 pt-0.5">
        {isUser ? (
          <div className="w-8 h-8 rounded-full bg-[#262626] border border-[#333333] flex items-center justify-center text-xs font-semibold text-[#E5E5E5] shadow-sm">
            ME
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#F97316]/20 to-[#EA580C]/30 border border-[#F97316]/40 flex items-center justify-center text-base shadow-sm ring-1 ring-[#F97316]/20">
            🎓
          </div>
        )}
      </div>

      {/* Message Card Bubble */}
      <div
        className={`relative max-w-[92%] sm:max-w-[85%] md:max-w-[80%] rounded-2xl px-4 py-3.5 transition-all ${
          isUser
            ? 'bg-[#1C1C1C] text-white border border-[#2E2E2E] shadow-sm'
            : 'bg-[#141414] text-[#E5E5E5] border border-[#262626] shadow-md hover:border-[#333333]'
        } ${speechStatus === 'playing' ? 'ring-1 ring-[#F97316]/50' : ''}`}
      >
        {/* Role & Hint header badge */}
        {!isUser && (
          <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-[#222222] text-xs">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-white tracking-wide text-xs">StudyBuddy</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#F97316]/10 text-[#F97316] font-medium border border-[#F97316]/20">
                AI Tutor
              </span>
              {message.socraticHint && (
                <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Lightbulb className="w-2.5 h-2.5" /> Hint Mode
                </span>
              )}
            </div>

            {/* Message Action icons (TTS, Copy) */}
            <div className="flex items-center gap-1 text-[#737373]">
              <button
                onClick={handleToggleSpeech}
                className={`p-1 rounded-md hover:text-white transition-colors ${
                  speechStatus === 'playing' ? 'text-[#F97316] bg-[#F97316]/10' : 'hover:bg-[#262626]'
                }`}
                title={speechStatus === 'playing' ? 'Stop Speaking' : 'Read Out Loud (Text-to-Speech)'}
                aria-label="Text to speech"
              >
                {speechStatus === 'playing' ? (
                  <VolumeX className="w-3.5 h-3.5 text-[#F97316] animate-pulse" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5" />
                )}
              </button>

              <button
                onClick={handleCopy}
                className="p-1 rounded-md hover:text-white hover:bg-[#262626] transition-colors"
                title="Copy message text"
                aria-label="Copy message"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        )}

        {/* Attachments preview if user uploaded files */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {message.attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center gap-2 p-2 rounded-xl bg-[#222222] border border-[#2f2f2f] text-xs max-w-full overflow-hidden"
              >
                {att.category === 'image' && att.previewUrl ? (
                  <img
                    src={att.previewUrl}
                    alt={att.name}
                    className="w-10 h-10 object-cover rounded-lg border border-[#333333] shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-[#2a2a2a] flex items-center justify-center text-[#F97316] shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                )}
                <div className="min-w-0 pr-1">
                  <div className="font-medium text-white truncate max-w-[160px] text-xs">
                    {att.name}
                  </div>
                  <div className="text-[11px] text-[#737373]">
                    {formatBytes(att.size)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Message body */}
        {isUser ? (
          <div className="whitespace-pre-wrap break-words text-[15px] leading-relaxed text-[#F3F4F6]">
            {message.content}
          </div>
        ) : (
          <div>
            <MarkdownRenderer
              content={message.content}
              onExplainCode={onExplainCode}
            />

            {/* Streaming cursor */}
            {message.isStreaming && (
              <span className="inline-flex items-center gap-1 text-[#F97316] mt-2 font-mono text-xs animate-pulse">
                <span className="w-2 h-2 rounded-full bg-[#F97316]" />
                Thinking...
              </span>
            )}

            {/* Error display with retry */}
            {message.error && (
              <div className="mt-3 p-3 rounded-xl bg-red-950/30 border border-red-500/30 text-red-200 text-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>Connection interrupted or response failed.</span>
                </div>
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-500/20 hover:bg-red-500/30 text-white font-medium transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" /> Retry
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Follow-up suggestion pills for bot answers */}
        {!isUser && !message.isStreaming && !message.error && message.suggestedFollowUps && message.suggestedFollowUps.length > 0 && (
          <div className="mt-3.5 pt-3 border-t border-[#222222]">
            <div className="text-[11px] font-medium text-[#737373] mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#F97316]" /> Quick Follow-ups:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {message.suggestedFollowUps.map((promptText, idx) => (
                <button
                  key={idx}
                  onClick={() => onSelectPrompt?.(promptText)}
                  className="px-2.5 py-1 rounded-lg bg-[#1f1f1f] hover:bg-[#282828] text-xs text-[#D4D4D4] hover:text-white border border-[#2c2c2c] hover:border-[#F97316]/40 transition-all text-left"
                >
                  {promptText}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Timestamp */}
        <div className="mt-1 text-[10px] text-[#525252] text-right select-none">
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};

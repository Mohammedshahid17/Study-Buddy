import React, { useState, useRef, useEffect } from 'react';
import { Send, Square, Paperclip, Image as ImageIcon, Lightbulb, Code2, X, AlertCircle } from 'lucide-react';
import { Attachment } from '../types';
import { processUploadedFile, formatBytes, MAX_FILE_SIZE_BYTES } from '../utils/fileReader';

interface ChatInputProps {
  onSendMessage: (text: string, attachments: Attachment[]) => void;
  isGenerating: boolean;
  onStopGenerating: () => void;
  socraticMode: boolean;
  onToggleSocraticMode: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isGenerating,
  onStopGenerating,
  socraticMode,
  onToggleSocraticMode,
}) => {
  const [inputText, setInputText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea based on contents
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 160; // max ~6 lines
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  }, [inputText]);

  // Handle file uploads
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadError(null);
    setIsUploading(true);

    try {
      const newAttachments: Attachment[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > MAX_FILE_SIZE_BYTES) {
          throw new Error(`"${file.name}" exceeds the 10MB limit.`);
        }
        const processed = await processUploadedFile(file);
        newAttachments.push(processed);
      }
      setAttachments((prev) => [...prev, ...newAttachments]);
    } catch (err: any) {
      setUploadError(err?.message || 'Failed to process file upload.');
      setTimeout(() => setUploadError(null), 4000);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    const trimmed = inputText.trim();
    if ((!trimmed && attachments.length === 0) || isGenerating) return;

    onSendMessage(trimmed, attachments);
    setInputText('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.focus();
    }
  };

  // Drag and drop events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      await handleFileUpload(e.dataTransfer.files);
    }
  };

  const insertCodeTemplate = () => {
    const template = '```python\n# Paste or type your code here\ndef solution():\n    pass\n```\n';
    setInputText((prev) => (prev ? prev + '\n' + template : template));
    textareaRef.current?.focus();
  };

  const charCount = inputText.length;
  const isSendDisabled = (!inputText.trim() && attachments.length === 0) || isGenerating;

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative w-full max-w-4xl mx-auto px-3 sm:px-4 pb-3 pt-2 ${
        isDragging ? 'ring-2 ring-[#F97316] rounded-2xl bg-[#1c1c1c]/90' : ''
      }`}
    >
      {/* Upload Error Banner */}
      {uploadError && (
        <div className="mb-2 p-2.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
            <span>{uploadError}</span>
          </div>
          <button onClick={() => setUploadError(null)} className="p-0.5 hover:text-white">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Attachments preview badge row */}
      {attachments.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-1.5 scrollbar-thin">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-[#171717] border border-[#2a2a2a] text-xs text-[#E5E5E5] shrink-0 max-w-[200px]"
            >
              {att.category === 'image' && att.previewUrl ? (
                <img
                  src={att.previewUrl}
                  alt={att.name}
                  className="w-6 h-6 rounded object-cover border border-[#333333]"
                />
              ) : (
                <Paperclip className="w-3.5 h-3.5 text-[#F97316] shrink-0" />
              )}
              <span className="truncate text-xs">{att.name}</span>
              <span className="text-[10px] text-[#737373]">({formatBytes(att.size)})</span>
              <button
                type="button"
                onClick={() => handleRemoveAttachment(att.id)}
                className="p-1 text-[#737373] hover:text-white hover:bg-[#262626] rounded transition-colors"
                title="Remove attachment"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main input wrapper */}
      <div className="relative rounded-2xl bg-[#141414] border border-[#262626] focus-within:border-[#F97316]/50 focus-within:shadow-[0_0_15px_rgba(249,115,22,0.12)] transition-all shadow-lg overflow-hidden">
        {/* Socratic Hint Mode Active Pill inside bar */}
        {socraticMode && (
          <div className="px-3 py-1 bg-amber-500/10 border-b border-amber-500/20 text-amber-300 text-[11px] flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Lightbulb className="w-3 h-3 text-amber-400" />
              <span>
                <strong>Socratic Hint Mode Active:</strong> StudyBuddy will guide you with clues & questions rather than giving direct answers.
              </span>
            </div>
            <button
              onClick={onToggleSocraticMode}
              className="text-[10px] underline hover:text-amber-100"
            >
              Disable
            </button>
          </div>
        )}

        {/* Textarea */}
        <div className="px-3 pt-3 pb-1">
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              socraticMode
                ? "Describe the problem or error you are stuck on (I will give you hints)..."
                : "Ask about Python, JavaScript, CS concepts, recursion, loops, exam prep..."
            }
            className="w-full resize-none bg-transparent text-[#FFFFFF] placeholder-[#666666] text-[15px] focus:outline-none max-h-40 overflow-y-auto leading-relaxed scrollbar-thin"
          />
        </div>

        {/* Bottom toolbar */}
        <div className="flex items-center justify-between px-2.5 py-1.5 border-t border-[#1c1c1c] text-xs">
          {/* Left tools */}
          <div className="flex items-center gap-1">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.py,.js,.ts,.html,.css,.json,.txt,.md,.pdf"
              className="hidden"
              onChange={(e) => handleFileUpload(e.target.files)}
            />

            {/* Upload Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-[#94A3B8] hover:text-white hover:bg-[#222222] transition-colors"
              title="Attach code snippet, homework screenshot, or document"
              aria-label="Upload file"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Socratic Hint Mode Toggle */}
            <button
              type="button"
              onClick={onToggleSocraticMode}
              className={`h-9 px-2.5 rounded-xl flex items-center gap-1.5 text-xs font-medium transition-all ${
                socraticMode
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-[#94A3B8] hover:text-white hover:bg-[#222222]'
              }`}
              title="Toggle Hint Mode: guides you with questions instead of giving away direct answers"
              aria-label="Toggle Hint Mode"
            >
              <Lightbulb className={`w-3.5 h-3.5 ${socraticMode ? 'text-amber-400' : 'text-[#94A3B8]'}`} />
              <span className="hidden sm:inline">Hint Mode</span>
            </button>

            {/* Insert Code Block Button */}
            <button
              type="button"
              onClick={insertCodeTemplate}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-[#94A3B8] hover:text-white hover:bg-[#222222] transition-colors"
              title="Insert code block template"
              aria-label="Insert code block"
            >
              <Code2 className="w-4 h-4" />
            </button>
          </div>

          {/* Right tools (Char count & Send/Stop button) */}
          <div className="flex items-center gap-2">
            {charCount > 0 && (
              <span className="text-[11px] text-[#525252] font-mono mr-1 hidden sm:inline">
                {charCount} chars
              </span>
            )}

            {isGenerating ? (
              <button
                type="button"
                onClick={onStopGenerating}
                className="h-10 px-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium flex items-center gap-1.5 text-xs transition-colors shadow-sm"
                title="Stop generating response"
                aria-label="Stop generation"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span className="hidden sm:inline">Stop</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSend}
                disabled={isSendDisabled}
                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                  isSendDisabled
                    ? 'bg-[#222222] text-[#525252] cursor-not-allowed'
                    : 'bg-[#F97316] hover:bg-[#EA580C] text-black shadow-md shadow-[#F97316]/20 active:scale-95'
                }`}
                title="Send message (Enter)"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="mt-1 text-center text-[10px] text-[#525252] select-none">
        StudyBuddy is your freshman programming tutor. Press Enter to send, Shift+Enter for new line.
      </div>
    </div>
  );
};

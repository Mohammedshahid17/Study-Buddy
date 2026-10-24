type SpeechStatus = 'idle' | 'playing' | 'paused';

class SpeechController {
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private currentMessageId: string | null = null;
  private listeners: Set<(state: { messageId: string | null; status: SpeechStatus }) => void> = new Set();
  private status: SpeechStatus = 'idle';

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      // Handle speech end or errors
      window.speechSynthesis.onvoiceschanged = () => {
        // Voices loaded
      };
    }
  }

  public subscribe(listener: (state: { messageId: string | null; status: SpeechStatus }) => void): () => void {
    this.listeners.add(listener);
    listener({ messageId: this.currentMessageId, status: this.status });
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    for (const listener of this.listeners) {
      listener({ messageId: this.currentMessageId, status: this.status });
    }
  }

  private cleanMarkdownForSpeech(markdown: string): string {
    return markdown
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, ' [Code example skipped] ')
      // Remove inline code
      .replace(/`([^`]+)`/g, '$1')
      // Remove images/links
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      // Remove headers, bold, italics
      .replace(/#{1,6}\s+/g, '')
      .replace(/[*_]{1,3}/g, '')
      // Remove bullet points / list numbers
      .replace(/^\s*[-*+]\s+/gm, '')
      .replace(/^\s*\d+\.\s+/gm, '')
      // Remove emojis or special characters if needed
      .trim();
  }

  public speak(messageId: string, text: string, options?: { rate?: number; pitch?: number }): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported by your browser.');
      return;
    }

    // If currently speaking this message, toggle pause/play
    if (this.currentMessageId === messageId) {
      if (this.status === 'playing') {
        window.speechSynthesis.pause();
        this.status = 'paused';
        this.notify();
        return;
      } else if (this.status === 'paused') {
        window.speechSynthesis.resume();
        this.status = 'playing';
        this.notify();
        return;
      }
    }

    // Stop any ongoing speech
    this.stop();

    const plainText = this.cleanMarkdownForSpeech(text);
    if (!plainText) return;

    const utterance = new SpeechSynthesisUtterance(plainText);
    utterance.rate = options?.rate ?? 1.0;
    utterance.pitch = options?.pitch ?? 1.0;

    // Pick best natural English voice if available
    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find((v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha')));
    if (naturalVoice) {
      utterance.voice = naturalVoice;
    }

    utterance.onstart = () => {
      this.currentMessageId = messageId;
      this.status = 'playing';
      this.notify();
    };

    utterance.onend = () => {
      this.currentMessageId = null;
      this.status = 'idle';
      this.notify();
    };

    utterance.onerror = (e) => {
      console.warn('Speech error:', e);
      this.currentMessageId = null;
      this.status = 'idle';
      this.notify();
    };

    this.currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  public stop(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.currentUtterance = null;
    this.currentMessageId = null;
    this.status = 'idle';
    this.notify();
  }

  public getStatus(messageId: string): SpeechStatus {
    return this.currentMessageId === messageId ? this.status : 'idle';
  }
}

export const speechService = new SpeechController();

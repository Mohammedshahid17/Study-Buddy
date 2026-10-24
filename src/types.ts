export type Role = 'user' | 'assistant' | 'model';

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  base64: string;
  previewUrl?: string;
  category: 'image' | 'code' | 'doc';
  textContent?: string;
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  attachments?: Attachment[];
  isStreaming?: boolean;
  error?: boolean;
  socraticHint?: boolean;
  suggestedFollowUps?: string[];
}

export interface ChatSession {
  id: string;
  title: string;
  course: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  course: string;
  avatar: string;
  streakDays: number;
  lastActiveDate: string;
  isGuest: boolean;
  socraticModeDefault: boolean;
  voicePitch: number;
  voiceRate: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  codeSnippet?: string;
  options: string[];
  correctIndex: number;
  hint: string;
  explanation: string;
  analogy?: string;
}

export interface QuizData {
  topic: string;
  questions: QuizQuestion[];
}

export interface CodeStep {
  lineNumber: number;
  codeLine: string;
  action: string;
  variableState?: string;
}

export interface CodeExplanation {
  title: string;
  overview: string;
  analogy: string;
  timeComplexity?: string;
  spaceComplexity?: string;
  steps: CodeStep[];
  commonPitfalls: string[];
}

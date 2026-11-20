import { ChatSession, UserProfile, Message } from '../types';

const STORAGE_KEYS = {
  SESSIONS: 'studybuddy_sessions_v1',
  ACTIVE_SESSION_ID: 'studybuddy_active_session_id',
  USER_PROFILE: 'studybuddy_user_profile_v1',
};

const DEFAULT_PROFILE: UserProfile = {
  id: 'student-default',
  name: 'Alex Chen',
  email: 'alex.student@campus.edu',
  course: 'CS 101: Intro to Python & Algorithms',
  avatar: '🎓',
  streakDays: 3,
  lastActiveDate: new Date().toISOString().split('T')[0],
  isGuest: false,
  socraticModeDefault: false,
  voicePitch: 1.0,
  voiceRate: 1.0,
};

export const COURSES = [
  'CS 101: Intro to Python & Algorithms',
  'CS 102: Data Structures & OOP (JavaScript/Python)',
  'CS 105: Discrete Math & Logic',
  'WEB 101: Modern JavaScript & DOM',
  'CS 110: Exam Preparation & Code Debugging',
];

export function getStoredProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    if (!raw) return DEFAULT_PROFILE;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_PROFILE, ...parsed };
  } catch (e) {
    console.error('Failed to parse user profile', e);
    return DEFAULT_PROFILE;
  }
}

export function saveStoredProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed to save user profile', e);
  }
}

export function getStoredSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse sessions', e);
    return [];
  }
}

export function saveStoredSessions(sessions: ChatSession[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  } catch (e) {
    console.error('Failed to save sessions', e);
  }
}

export function getActiveSessionId(): string | null {
  return localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION_ID);
}

export function setActiveSessionId(id: string | null): void {
  if (id) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION_ID, id);
  } else {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION_ID);
  }
}

export function createNewSession(course?: string): ChatSession {
  const newId = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  return {
    id: newId,
    title: 'New Study Topic',
    course: course || COURSES[0],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: [],
  };
}

export function generateSessionTitleFromMessage(content: string): string {
  const cleaned = content.replace(/[#*`_]/g, '').trim();
  if (!cleaned) return 'New Study Topic';
  const firstLine = cleaned.split('\n')[0].trim();
  if (firstLine.length <= 32) return firstLine;
  return firstLine.substring(0, 32) + '...';
}

/**
 * L7a4eg AI (لحاذگ) - Database & Auth Types and Bridge
 */

import { database, verifyPassword, generateToken, verifyToken, sanitizePhoneNumber, POSTGRESQL_SCHEMA_SQL } from '../../database.js';

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  provider: 'local' | 'phone_otp' | 'google' | 'facebook' | 'apple';
  avatarUrl?: string;
  role: 'member' | 'creator' | 'researcher' | 'admin';
  preferences: {
    preferredLanguage: string;
    thinkingMode: 'fast' | 'deep';
    theme: 'light' | 'dark';
  };
  createdAt: string;
  updatedAt: string;
}

export interface SmartNotification {
  id: string;
  titleAr: string;
  bodyAr: string;
  category: 'exams' | 'scholarships' | 'tenders' | 'system';
  actionPrompt: string;
  badgeLabel: string;
  isUrgent: boolean;
  isRead?: boolean;
  createdAt: string;
}

export { database, verifyPassword, generateToken, verifyToken, sanitizePhoneNumber, POSTGRESQL_SCHEMA_SQL };

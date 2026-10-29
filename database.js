/**
 * L7a4eg AI (لحاذگ) - Standalone Database & Authentication Core (Pure JavaScript)
 * 
 * Includes:
 * 1. PostgreSQL Schema Migrations (DDL)
 * 2. Bcrypt & Crypto Passwords with Salt
 * 3. 6-Digit OTP Generator & Verification (5-minute TTL, Mauritanian +222 Support)
 * 4. Token-based Session Management (JWT Compatible)
 * 5. Persistent Local File Store (.data/l7a4eg_db.json) with Auto-Sync
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// PostgreSQL Schema Definition for Production Deployment
export const POSTGRESQL_SCHEMA_SQL = `
-- =========================================================================
-- L7a4eg AI (لحاذگ) - PostgreSQL Database Schema
-- Production Ready Migration for Youth AI Platform
-- =========================================================================

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(180) UNIQUE,
    phone VARCHAR(32) UNIQUE,
    password_hash TEXT,
    password_salt TEXT,
    provider VARCHAR(32) NOT NULL DEFAULT 'local', -- 'local', 'phone_otp', 'google', 'facebook', 'apple'
    avatar_url TEXT,
    role VARCHAR(32) NOT NULL DEFAULT 'member', -- 'member', 'creator', 'researcher', 'admin'
    preferred_language VARCHAR(32) DEFAULT 'hassaniya',
    thinking_mode VARCHAR(16) DEFAULT 'fast',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS phone_otps (
    id VARCHAR(64) PRIMARY KEY,
    phone VARCHAR(32) NOT NULL,
    otp_code VARCHAR(8) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    attempts INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS auth_sessions (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    token_signature VARCHAR(128) NOT NULL,
    user_agent TEXT,
    ip_address VARCHAR(64),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(64) PRIMARY KEY,
    title_ar VARCHAR(255) NOT NULL,
    body_ar TEXT NOT NULL,
    category VARCHAR(32) NOT NULL, -- 'exams', 'scholarships', 'tenders', 'system'
    action_url TEXT,
    badge_label VARCHAR(64),
    is_urgent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_notification_reads (
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    notification_id VARCHAR(64) REFERENCES notifications(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, notification_id)
);

CREATE TABLE IF NOT EXISTS enabled_plugins (
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    plugin_id VARCHAR(64) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    settings JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, plugin_id)
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_otps_phone ON phone_otps(phone);
CREATE INDEX IF NOT EXISTS idx_notifications_cat ON notifications(category);
`;

// Local Data Persistence Setup
const DATA_DIR = path.join(__dirname, '.data');
const DB_FILE = path.join(DATA_DIR, 'l7a4eg_db.json');

// Default initial state with seed notifications
const DEFAULT_NOTIFICATIONS = [
  {
    id: 'notif-bac-2026',
    titleAr: 'روزنامة امتحانات الباكالوريا وختم الدروس 2026',
    bodyAr: 'أعلنت وزارة التربية وإصلاح النظام التعليمي عن فتح باب التأكيد النهائي للمترشحين الأحرار وجداول مراكز امتحان الباكالوريا وشهادة BEPC.',
    category: 'exams',
    actionPrompt: 'لخص لي التواريخ الهامة ومواعيد امتحانات الباكالوريا في موريتانيا لعام 2026',
    badgeLabel: 'هام للطلاب',
    isUrgent: true,
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'notif-scholarship-2026',
    titleAr: 'منح التميز الموريتانية للدراسات العليا 2026-2027',
    bodyAr: 'بدء استقبال ملفات الترشح لمنح التميز للدراسة بالخارج (تونس، المغرب، السنغال وفرنسا) لطلبة كليات العلوم والتقنيات والمعهد العالي للمحاسبة.',
    category: 'scholarships',
    actionPrompt: 'ما هي شروط ملف الترشح لمنح التميز للدراسة بالخارج للطلبة الموريتانيين؟',
    badgeLabel: 'منح دراسية',
    isUrgent: false,
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
  {
    id: 'notif-tender-armp-2026',
    titleAr: 'مناقصة وطنية لوزارة الرقمنة والابتكار وعصرنة الإدارة',
    bodyAr: 'إعلان صفقات عمومية لتطوير منصات وطنية ذكية للخدمات الرقمية للمواطنين عبر سلطة تنظيم الصفقات العمومية (ARMP).',
    category: 'tenders',
    actionPrompt: 'اشرح لي تفاصيل مناقصة وزارة الرقمنة وكيف يمكن للشركات الموريتانية الناشئة التقديم عليها',
    badgeLabel: 'صفقات عمومية',
    isUrgent: true,
    createdAt: new Date(Date.now() - 3600000 * 30).toISOString(),
  },
  {
    id: 'notif-startup-fund',
    titleAr: 'إطلاق صندوق تمويل المشاريع الريادية للشباب الموريتاني',
    bodyAr: 'برنامج جديد لتمويل 50 مشروعاً ناشئاً في مجالات التكنولوجيا والزراعة الذكية برعاية الشركاء الدوليين وصندوق الإيداع والتنمية CDD.',
    category: 'scholarships',
    actionPrompt: 'ما هي معايير القبول لتمويل المشاريع الشبابية في موريتانيا وكيف أصيغ دراسة الجدوى؟',
    badgeLabel: 'ريادة الأعمال',
    isUrgent: false,
    createdAt: new Date(Date.now() - 3600000 * 50).toISOString(),
  },
];

let dbCache = null;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadDatabase() {
  if (dbCache) return dbCache;
  ensureDataDir();

  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      dbCache = JSON.parse(raw);
      if (!dbCache || !dbCache.notifications || dbCache.notifications.length === 0) {
        dbCache = dbCache || {};
        dbCache.notifications = DEFAULT_NOTIFICATIONS;
        saveDatabase(dbCache);
      }
      return dbCache;
    } catch (e) {
      console.warn('Could not read existing db file, initializing fresh store:', e);
    }
  }

  dbCache = {
    users: [],
    otps: [],
    notifications: DEFAULT_NOTIFICATIONS,
    readNotifications: {},
    plugins: {},
  };
  saveDatabase(dbCache);
  return dbCache;
}

function saveDatabase(data) {
  try {
    ensureDataDir();
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to persist database file:', err);
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'l7a4eg-ai-executive-secret-key-2026-mauritania-smart';

export function hashPassword(password) {
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);
  return { hash, salt };
}

export function verifyPassword(password, hash, salt) {
  try {
    if (hash && (hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$'))) {
      return bcrypt.compareSync(password, hash);
    }
    if (salt) {
      const checkHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
      return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(checkHash, 'hex'));
    }
    return false;
  } catch {
    return false;
  }
}

export function generateToken(payload, expiresInHours = 168) {
  try {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: `${expiresInHours}h` });
  } catch {
    const header = { alg: 'HS256', typ: 'JWT' };
    const exp = Math.floor(Date.now() / 1000) + expiresInHours * 3600;
    const fullPayload = { ...payload, exp };
    const encode = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
    const unsignedToken = `${encode(header)}.${encode(fullPayload)}`;
    const signature = crypto.createHmac('sha256', JWT_SECRET).update(unsignedToken).digest('base64url');
    return `${unsignedToken}.${signature}`;
  }
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const [headerB64, payloadB64, signature] = parts;
      const unsignedToken = `${headerB64}.${payloadB64}`;
      const expectedSignature = crypto.createHmac('sha256', JWT_SECRET).update(unsignedToken).digest('base64url');
      if (signature !== expectedSignature) return null;
      const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
      return payload;
    } catch {
      return null;
    }
  }
}

// Mauritanian & International Phone Sanitizer
export function sanitizePhoneNumber(phone) {
  if (!phone) return '';
  let cleaned = String(phone).replace(/[^\d+]/g, '');
  if (!cleaned.startsWith('+')) {
    if (cleaned.length === 8 && /^[234]/.test(cleaned)) {
      cleaned = `+222${cleaned}`;
    } else if (cleaned.startsWith('222') && cleaned.length === 11) {
      cleaned = `+${cleaned}`;
    } else {
      cleaned = `+${cleaned}`;
    }
  }
  return cleaned;
}

// =========================================================================
// Database Service Interface
// =========================================================================

export const database = {
  getPostgresSchema() {
    return POSTGRESQL_SCHEMA_SQL;
  },

  createUser(userData) {
    const db = loadDatabase();
    const id = `usr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    let passwordHash;
    let passwordSalt;

    if (userData.password) {
      const hashed = hashPassword(userData.password);
      passwordHash = hashed.hash;
      passwordSalt = hashed.salt;
    }

    const newUser = {
      id,
      name: userData.name.trim(),
      email: userData.email ? userData.email.toLowerCase().trim() : undefined,
      phone: userData.phone ? sanitizePhoneNumber(userData.phone) : undefined,
      passwordHash,
      passwordSalt,
      provider: userData.provider || 'local',
      avatarUrl: userData.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userData.name)}`,
      role: userData.role || 'member',
      preferences: {
        preferredLanguage: 'hassaniya',
        thinkingMode: 'fast',
        theme: 'light',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.users.push(newUser);
    saveDatabase(db);
    return this.sanitizeUser(newUser);
  },

  findUserById(id) {
    const db = loadDatabase();
    const user = db.users.find((u) => u.id === id);
    return user ? this.sanitizeUser(user) : null;
  },

  findUserByEmail(email) {
    if (!email) return null;
    const db = loadDatabase();
    const cleanEmail = email.toLowerCase().trim();
    const user = db.users.find((u) => u.email === cleanEmail);
    return user || null;
  },

  findUserByPhone(phone) {
    if (!phone) return null;
    const db = loadDatabase();
    const cleanPhone = sanitizePhoneNumber(phone);
    const user = db.users.find((u) => u.phone === cleanPhone);
    return user || null;
  },

  updateUserPreferences(userId, preferences) {
    const db = loadDatabase();
    const user = db.users.find((u) => u.id === userId);
    if (!user) return null;

    user.preferences = { ...user.preferences, ...preferences };
    user.updatedAt = new Date().toISOString();
    saveDatabase(db);
    return this.sanitizeUser(user);
  },

  sanitizeUser(user) {
    const { passwordHash, passwordSalt, ...safeUser } = user;
    return safeUser;
  },

  createOrUpdateOtp(phone) {
    const db = loadDatabase();
    const cleanPhone = sanitizePhoneNumber(phone);
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes TTL

    db.otps = db.otps.filter((o) => o.phone !== cleanPhone);
    db.otps.push({
      id: `otp_${Date.now()}`,
      phone: cleanPhone,
      otpCode,
      expiresAt,
      attempts: 0,
    });

    saveDatabase(db);
    console.log(`[SMS GATEWAY / موريتانيا] 📨 SMS sent to ${cleanPhone}: رمز الدخول إلى لحاذگ هو: ${otpCode}`);
    return { otpCode, expiresAt, phone: cleanPhone };
  },

  verifyOtp(phone, inputCode) {
    const db = loadDatabase();
    const cleanPhone = sanitizePhoneNumber(phone);
    const record = db.otps.find((o) => o.phone === cleanPhone);

    if (!record) {
      return { success: false, error: 'لم يتم العثور على رمز مرسل لهذا الرقم، أعد طلب الرمز' };
    }

    if (Date.now() > record.expiresAt) {
      db.otps = db.otps.filter((o) => o.phone !== cleanPhone);
      saveDatabase(db);
      return { success: false, error: 'انتهت صلاحية رمز التحقق (أكثر من 5 دقائق)، الرجاء طلب رمز جديد' };
    }

    if (record.attempts >= 5) {
      db.otps = db.otps.filter((o) => o.phone !== cleanPhone);
      saveDatabase(db);
      return { success: false, error: 'تجاوزت الحد الأقصى للمحاولات الخاطئة، يرجى طلب رمز جديد' };
    }

    if (record.otpCode !== String(inputCode).trim()) {
      record.attempts += 1;
      saveDatabase(db);
      return { success: false, error: `الرمز المدخل غير صحيح. المحاولات المتبقية: ${5 - record.attempts}` };
    }

    db.otps = db.otps.filter((o) => o.phone !== cleanPhone);
    saveDatabase(db);
    return { success: true };
  },

  getNotifications(userId) {
    const db = loadDatabase();
    const userReads = userId ? db.readNotifications[userId] || [] : [];
    return db.notifications.map((n) => ({
      ...n,
      isRead: userReads.includes(n.id),
    }));
  },

  markNotificationAsRead(userId, notificationId) {
    const db = loadDatabase();
    if (!db.readNotifications[userId]) {
      db.readNotifications[userId] = [];
    }
    if (!db.readNotifications[userId].includes(notificationId)) {
      db.readNotifications[userId].push(notificationId);
      saveDatabase(db);
    }
    return true;
  },

  getUserPlugins(userId) {
    const db = loadDatabase();
    return db.plugins[userId] || {};
  },

  setUserPluginState(userId, pluginId, enabled) {
    const db = loadDatabase();
    if (!db.plugins[userId]) {
      db.plugins[userId] = {};
    }
    db.plugins[userId][pluginId] = enabled;
    saveDatabase(db);
    return db.plugins[userId];
  },
};

export default database;

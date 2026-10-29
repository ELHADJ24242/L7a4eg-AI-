/**
 * L7a4eg AI (لحاذگ) - Standalone Express Authentication & API Server
 * 
 * Features:
 * - Express.js backend with JSON & cookie parsing
 * - Secure password hashing using bcrypt
 * - JWT generation and verification
 * - HTTP-Only Cookie storage for sessions ('auth_token')
 * - Full endpoints: /api/auth/register, /api/auth/login, /api/auth/me, /api/auth/logout
 * - Mauritanian Phone OTP support (+222)
 * - Persistent storage integration with database.js
 */

import express from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { database, verifyPassword, generateToken, verifyToken, sanitizePhoneNumber, POSTGRESQL_SCHEMA_SQL } from './database.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'l7a4eg-ai-executive-secret-key-2026-mauritania-smart';

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// Static public assets
app.use(express.static(path.join(__dirname, 'public')));

// Helper to authenticate request from HTTP-Only cookie or Bearer token
function getAuthenticatedUser(req) {
  let token = undefined;
  if (req.cookies && req.cookies.auth_token) {
    token = req.cookies.auth_token;
  } else if (req.headers.authorization) {
    token = req.headers.authorization.startsWith('Bearer ')
      ? req.headers.authorization.slice(7)
      : req.headers.authorization;
  }

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || !decoded.userId) return null;
    return database.findUserById(decoded.userId);
  } catch {
    return null;
  }
}

// =========================================================================
// AUTHENTICATION ROUTES
// =========================================================================

/**
 * POST /api/auth/register
 * Registers a new user with bcrypt password hashing and JWT in HTTP-Only Cookie
 */
app.post('/api/auth/register', (req, res) => {
  try {
    const { name, email, password, phone, rememberMe = true } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'الاسم الكامل والبريد الإلكتروني وكلمة المرور مطلوبة',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'يجب ألا تقل كلمة المرور عن 6 خانات',
      });
    }

    const existingUser = database.findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'هذا البريد الإلكتروني مسجل مسبقاً، يرجى تسجيل الدخول',
      });
    }

    if (phone) {
      const existingPhone = database.findUserByPhone(phone);
      if (existingPhone) {
        return res.status(409).json({
          success: false,
          error: 'رقم الهاتف هذا مسجل بالفعل في حساب آخر',
        });
      }
    }

    // Hash password with bcrypt
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    // Save to database
    const user = database.createUser({
      name,
      email,
      password, // database.createUser handles hash internally
      phone,
      provider: 'local',
      role: 'member',
    });

    // Generate JWT
    const expiresInHours = rememberMe ? 720 : 24; // 30 days if rememberMe, otherwise 24h
    const token = jwt.sign(
      { userId: user.id, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: `${expiresInHours}h` }
    );

    // Store in secure HTTP-Only Cookie
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: expiresInHours * 3600 * 1000,
      path: '/',
    });

    return res.status(201).json({
      success: true,
      message: 'تم إنشاء الحساب بنجاح، مرحباً بك في لحاذگ AI!',
      user,
      token,
    });
  } catch (error) {
    console.error('Error in /api/auth/register:', error);
    return res.status(500).json({ success: false, error: 'حدث خطأ أثناء إنشاء الحساب', details: error.message });
  }
});

/**
 * POST /api/auth/login
 * Validates credentials via bcrypt and issues JWT in HTTP-Only Cookie
 */
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password, rememberMe = true } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'يرجى إدخال البريد الإلكتروني وكلمة المرور',
      });
    }

    const user = database.findUserByEmail(email);
    if (!user || !user.passwordHash) {
      return res.status(401).json({
        success: false,
        error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
      });
    }

    // Verify password via bcrypt
    const isMatch = verifyPassword(password, user.passwordHash, user.passwordSalt);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
      });
    }

    const safeUser = database.sanitizeUser(user);

    // Generate JWT
    const expiresInHours = rememberMe ? 720 : 24;
    const token = jwt.sign(
      { userId: safeUser.id, name: safeUser.name, role: safeUser.role },
      JWT_SECRET,
      { expiresIn: `${expiresInHours}h` }
    );

    // Store in secure HTTP-Only Cookie
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: expiresInHours * 3600 * 1000,
      path: '/',
    });

    return res.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      user: safeUser,
      token,
    });
  } catch (error) {
    console.error('Error in /api/auth/login:', error);
    return res.status(500).json({ success: false, error: 'حدث خطأ أثناء تسجيل الدخول', details: error.message });
  }
});

/**
 * GET /api/auth/me
 * Retrieves the current session user from HTTP-Only cookie or Bearer token
 */
app.get('/api/auth/me', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ authenticated: false, user: null });
  }
  return res.json({ authenticated: true, user });
});

/**
 * POST /api/auth/logout
 * Clears the HTTP-Only cookie
 */
app.post('/api/auth/logout', (_req, res) => {
  res.clearCookie('auth_token', { path: '/' });
  return res.json({ success: true, message: 'تم تسجيل الخروج بنجاح' });
});

/**
 * Phone OTP Routes (Mauritanian +222)
 */
app.post('/api/auth/otp/send', (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ error: 'رقم الهاتف مطلوب' });
    }
    const cleanPhone = sanitizePhoneNumber(phone);
    const { otpCode, expiresAt } = database.createOrUpdateOtp(cleanPhone);

    return res.json({
      success: true,
      message: `تم إرسال رمز التحقق إلى ${cleanPhone}`,
      phone: cleanPhone,
      expiresAt,
      demoCode: otpCode,
    });
  } catch (err) {
    return res.status(500).json({ error: 'فشل إرسال الرمز' });
  }
});

app.post('/api/auth/otp/verify', (req, res) => {
  try {
    const { phone, code, name } = req.body;
    const verification = database.verifyOtp(phone, code);
    if (!verification.success) {
      return res.status(400).json({ error: verification.error });
    }

    const cleanPhone = sanitizePhoneNumber(phone);
    let userRecord = database.findUserByPhone(cleanPhone);
    let user = userRecord
      ? database.sanitizeUser(userRecord)
      : database.createUser({
          name: name || `مستخدم موريتاني (${cleanPhone.slice(-4)})`,
          phone: cleanPhone,
          provider: 'phone_otp',
          role: 'member',
        });

    const token = jwt.sign(
      { userId: user.id, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '720h' }
    );

    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 720 * 3600 * 1000,
      path: '/',
    });

    return res.json({ success: true, user, token });
  } catch (err) {
    return res.status(500).json({ error: 'فشل التحقق من الرمز' });
  }
});

// Notifications
app.get('/api/notifications', (req, res) => {
  const user = getAuthenticatedUser(req);
  const notifications = database.getNotifications(user ? user.id : undefined);
  return res.json({
    success: true,
    notifications,
    unreadCount: notifications.filter((n) => !n.isRead).length,
  });
});

// Schema DDL endpoint
app.get('/api/db/schema', (_req, res) => {
  return res.json({
    status: 'operational',
    engine: 'Express.js + bcrypt + jsonwebtoken + HTTP-Only Cookie + PostgreSQL DDL Ready',
    schemaSql: POSTGRESQL_SCHEMA_SQL,
  });
});

// Production or Vite Dev Integration
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
} else {
  import('vite').then(({ createServer }) => {
    createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    }).then((vite) => {
      app.use(vite.middlewares);
    });
  });
}

// Start server when run directly
if (process.env.RUN_SERVER_JS) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`L7a4eg AI server.js running at http://0.0.0.0:${PORT}`);
  });
}

export default app;

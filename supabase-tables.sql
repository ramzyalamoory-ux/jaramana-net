-- ========================================
-- جداول Jaramana Net - Supabase SQL
-- ========================================

-- 1. جدول المستخدمين (User)
-- للمستخدمين متعددي الأدوار (Admin, Accountant, Support)
CREATE TABLE IF NOT EXISTS "User" (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100),
  phone VARCHAR(20),
  role VARCHAR(20) NOT NULL DEFAULT 'support', -- admin, accountant, support
  isActive BOOLEAN DEFAULT true,
  lastLogin TIMESTAMP,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);

-- إضافة مستخدم admin افتراضي (كلمة السر: admin123)
INSERT INTO "User" (username, password, name, role, isActive)
VALUES ('admin', 'admin123', 'مدير النظام', 'admin', true)
ON CONFLICT (username) DO NOTHING;

-- إضافة مستخدم محاسب تجريبي
INSERT INTO "User" (username, password, name, role, isActive)
VALUES ('accountant', 'acc123', 'المحاسب', 'accountant', true)
ON CONFLICT (username) DO NOTHING;

-- إضافة مستخدم دعم تجريبي
INSERT INTO "User" (username, password, name, role, isActive)
VALUES ('support', 'sup123', 'الدعم الفني', 'support', true)
ON CONFLICT (username) DO NOTHING;

-- ========================================

-- 2. جدول سجل الإشعارات (NotificationLog)
CREATE TABLE IF NOT EXISTS "NotificationLog" (
  id SERIAL PRIMARY KEY,
  subscriberId INTEGER,
  subscriberName VARCHAR(100),
  subscriberPhone VARCHAR(20),
  type VARCHAR(50) NOT NULL, -- expiring, expired, payment, custom
  title VARCHAR(255) NOT NULL,
  message TEXT,
  channel VARCHAR(20) DEFAULT 'onesignal', -- onesignal, sms, whatsapp
  status VARCHAR(20) DEFAULT 'sent', -- sent, failed, pending
  sentAt TIMESTAMP DEFAULT NOW(),
  error TEXT
);

-- ========================================

-- 3. جدول سجل رسائل WhatsApp (MessageLog)
CREATE TABLE IF NOT EXISTS "MessageLog" (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(20) NOT NULL,
  name VARCHAR(100),
  message TEXT NOT NULL,
  template VARCHAR(50), -- اسم القالب المستخدم
  targetType VARCHAR(50), -- all, expired, paid, grace, custom
  targetCount INTEGER DEFAULT 1,
  status VARCHAR(20) DEFAULT 'sent', -- sent, failed, pending
  sentAt TIMESTAMP DEFAULT NOW(),
  sentBy INTEGER, -- userId
  error TEXT
);

-- ========================================

-- 4. جدول سجل النشاطات (ActivityLog)
CREATE TABLE IF NOT EXISTS "ActivityLog" (
  id SERIAL PRIMARY KEY,
  userId INTEGER,
  userName VARCHAR(100),
  action VARCHAR(50) NOT NULL, -- login, logout, create, update, delete, cut, enable, disable
  entityType VARCHAR(50), -- subscriber, pppoe, user, settings, payment
  entityId INTEGER,
  entityName VARCHAR(100),
  details TEXT,
  ipAddress VARCHAR(50),
  userAgent TEXT,
  createdAt TIMESTAMP DEFAULT NOW()
);

-- ========================================

-- 5. جدول الدفعات (Payment) - إذا لم يكن موجود
CREATE TABLE IF NOT EXISTS "Payment" (
  id SERIAL PRIMARY KEY,
  subscriberId INTEGER NOT NULL,
  subscriberName VARCHAR(100),
  amount DECIMAL(10,2) NOT NULL,
  paymentMethod VARCHAR(20) DEFAULT 'cash', -- cash, bank, electronic
  notes TEXT,
  createdAt TIMESTAMP DEFAULT NOW(),
  createdBy INTEGER
);

-- ========================================

-- الفهارس (Indexes) لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_user_role ON "User"(role);
CREATE INDEX IF NOT EXISTS idx_user_username ON "User"(username);

CREATE INDEX IF NOT EXISTS idx_notification_type ON "NotificationLog"(type);
CREATE INDEX IF NOT EXISTS idx_notification_status ON "NotificationLog"(status);
CREATE INDEX IF NOT EXISTS idx_notification_sentAt ON "NotificationLog"(sentAt);

CREATE INDEX IF NOT EXISTS idx_message_phone ON "MessageLog"(phone);
CREATE INDEX IF NOT EXISTS idx_message_sentAt ON "MessageLog"(sentAt);

CREATE INDEX IF NOT EXISTS idx_activity_action ON "ActivityLog"(action);
CREATE INDEX IF NOT EXISTS idx_activity_entity ON "ActivityLog"(entityType);
CREATE INDEX IF NOT EXISTS idx_activity_createdAt ON "ActivityLog"(createdAt);

CREATE INDEX IF NOT EXISTS idx_payment_subscriber ON "Payment"(subscriberId);
CREATE INDEX IF NOT EXISTS idx_payment_createdAt ON "Payment"(createdAt);

-- ========================================

-- عرض رسالة نجاح
SELECT 'تم إنشاء جميع الجداول بنجاح! ✅' as message;

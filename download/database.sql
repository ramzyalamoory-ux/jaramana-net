-- =====================================================
-- JaraMana Net - Database Schema for Supabase (PostgreSQL)
-- =====================================================
-- Run this SQL in Supabase SQL Editor
-- =====================================================

-- جدول المشتركين
CREATE TABLE IF NOT EXISTS "Subscriber" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT,
    "monthlyFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "pppoeUser" TEXT,
    "pppoePassword" TEXT,
    "ipAddress" TEXT,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "lastSeen" TIMESTAMP(3),
    "macAddress" TEXT,
    "mikrotikDeviceId" INTEGER,
    "graceDays" INTEGER NOT NULL DEFAULT 0,
    "serviceStatus" TEXT NOT NULL DEFAULT 'active',
    "suspendedAt" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "lastRenewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Subscriber_pkey" PRIMARY KEY ("id")
);

-- جدول الفواتير
CREATE TABLE IF NOT EXISTS "Invoice" (
    "id" SERIAL NOT NULL,
    "subscriberId" INTEGER NOT NULL,
    "month" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- جدول تصنيفات المنتجات
CREATE TABLE IF NOT EXISTS "ProductCategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("id")
);

-- جدول المنتجات
CREATE TABLE IF NOT EXISTS "Product" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'قطعة',
    "currentStock" INTEGER NOT NULL DEFAULT 0,
    "minStock" INTEGER NOT NULL DEFAULT 5,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- جدول حركات المخزون
CREATE TABLE IF NOT EXISTS "InventoryTransaction" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" TEXT,
    "recipient" TEXT,
    "supplier" TEXT,
    "price" DOUBLE PRECISION,
    "notes" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InventoryTransaction_pkey" PRIMARY KEY ("id")
);

-- جدول الإعدادات
CREATE TABLE IF NOT EXISTS "Setting" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

-- جدول التذاكر
CREATE TABLE IF NOT EXISTS "Ticket" (
    "id" SERIAL NOT NULL,
    "subscriberId" INTEGER,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "response" TEXT,
    "respondedAt" TIMESTAMP(3),
    "respondedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- جدول سجل النشاطات
CREATE TABLE IF NOT EXISTS "ActivityLog" (
    "id" SERIAL NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- جدول الإشعارات
CREATE TABLE IF NOT EXISTS "Notification" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "relatedId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- جدول النسخ الاحتياطية
CREATE TABLE IF NOT EXISTS "Backup" (
    "id" SERIAL NOT NULL,
    "filename" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Backup_pkey" PRIMARY KEY ("id")
);

-- جدول أجهزة MikroTik
CREATE TABLE IF NOT EXISTS "MikroTikDevice" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "port" INTEGER NOT NULL DEFAULT 8728,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MikroTikDevice_pkey" PRIMARY KEY ("id")
);

-- جدول سجل الاتصالات
CREATE TABLE IF NOT EXISTS "ConnectionLog" (
    "id" SERIAL NOT NULL,
    "subscriberId" INTEGER NOT NULL,
    "ipAddress" TEXT,
    "macAddress" TEXT,
    "action" TEXT NOT NULL,
    "duration" INTEGER,
    "bytesIn" INTEGER,
    "bytesOut" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ConnectionLog_pkey" PRIMARY KEY ("id")
);

-- جدول محاولات الدخول
CREATE TABLE IF NOT EXISTS "LoginAttempt" (
    "id" SERIAL NOT NULL,
    "ip" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "reason" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("id")
);

-- جدول جلسات المدير
CREATE TABLE IF NOT EXISTS "AdminSession" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "userAgent" TEXT,
    "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminSession_pkey" PRIMARY KEY ("id")
);

-- جدول قوالب الرسائل
CREATE TABLE IF NOT EXISTS "MessageTemplate" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subject" TEXT,
    "message" TEXT NOT NULL,
    "variables" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MessageTemplate_pkey" PRIMARY KEY ("id")
);

-- =====================================================
-- INDEXES (الفهارس)
-- =====================================================

CREATE UNIQUE INDEX IF NOT EXISTS "Subscriber_phone_key" ON "Subscriber"("phone");
CREATE UNIQUE INDEX IF NOT EXISTS "Subscriber_pppoeUser_key" ON "Subscriber"("pppoeUser");
CREATE INDEX IF NOT EXISTS "Subscriber_name_idx" ON "Subscriber"("name");
CREATE INDEX IF NOT EXISTS "Subscriber_isActive_idx" ON "Subscriber"("isActive");
CREATE INDEX IF NOT EXISTS "Subscriber_isOnline_idx" ON "Subscriber"("isOnline");
CREATE INDEX IF NOT EXISTS "Subscriber_serviceStatus_idx" ON "Subscriber"("serviceStatus");

CREATE INDEX IF NOT EXISTS "Invoice_isPaid_idx" ON "Invoice"("isPaid");
CREATE INDEX IF NOT EXISTS "Invoice_month_idx" ON "Invoice"("month");
CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_subscriberId_month_key" ON "Invoice"("subscriberId", "month");

CREATE UNIQUE INDEX IF NOT EXISTS "ProductCategory_name_key" ON "ProductCategory"("name");
CREATE INDEX IF NOT EXISTS "Product_categoryId_idx" ON "Product"("categoryId");

CREATE UNIQUE INDEX IF NOT EXISTS "Setting_key_key" ON "Setting"("key");

CREATE INDEX IF NOT EXISTS "Ticket_status_idx" ON "Ticket"("status");
CREATE INDEX IF NOT EXISTS "Ticket_createdAt_idx" ON "Ticket"("createdAt");

CREATE INDEX IF NOT EXISTS "Notification_isRead_idx" ON "Notification"("isRead");
CREATE INDEX IF NOT EXISTS "Notification_createdAt_idx" ON "Notification"("createdAt");

CREATE UNIQUE INDEX IF NOT EXISTS "AdminSession_token_key" ON "AdminSession"("token");
CREATE INDEX IF NOT EXISTS "AdminSession_expiresAt_idx" ON "AdminSession"("expiresAt");

CREATE INDEX IF NOT EXISTS "LoginAttempt_ip_idx" ON "LoginAttempt"("ip");
CREATE INDEX IF NOT EXISTS "LoginAttempt_createdAt_idx" ON "LoginAttempt"("createdAt");

-- =====================================================
-- FOREIGN KEYS (المفاتيح الأجنبية)
-- =====================================================

ALTER TABLE "Invoice" DROP CONSTRAINT IF EXISTS "Invoice_subscriberId_fkey";
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "Subscriber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Ticket" DROP CONSTRAINT IF EXISTS "Ticket_subscriberId_fkey";
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "Subscriber"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ConnectionLog" DROP CONSTRAINT IF EXISTS "ConnectionLog_subscriberId_fkey";
ALTER TABLE "ConnectionLog" ADD CONSTRAINT "ConnectionLog_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "Subscriber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Product" DROP CONSTRAINT IF EXISTS "Product_categoryId_fkey";
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProductCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "InventoryTransaction" DROP CONSTRAINT IF EXISTS "InventoryTransaction_productId_fkey";
ALTER TABLE "InventoryTransaction" ADD CONSTRAINT "InventoryTransaction_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- =====================================================
-- Default Settings (الإعدادات الافتراضية)
-- =====================================================

INSERT INTO "Setting" ("key", "value", "updatedAt") VALUES
('company_name', 'جرمانا نت', CURRENT_TIMESTAMP),
('company_phone', '', CURRENT_TIMESTAMP),
('company_address', '', CURRENT_TIMESTAMP),
('currency', 'ل.س', CURRENT_TIMESTAMP),
('invoice_prefix', 'INV-', CURRENT_TIMESTAMP),
('session_timeout', '24', CURRENT_TIMESTAMP),
('max_login_attempts', '5', CURRENT_TIMESTAMP),
('lockout_duration', '30', CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;

-- =====================================================
-- Default Message Templates (قوالب الرسائل الافتراضية)
-- =====================================================

INSERT INTO "MessageTemplate" ("name", "type", "category", "subject", "message", "variables", "isDefault", "isActive", "createdAt", "updatedAt") VALUES
('تذكير بفاتورة مستحقة', 'sms', 'invoice', NULL, 'عزيزنا {name}، نذكركم بوجود فاتورة مستحقة بقيمة {amount} ل.س لشهر {month}. يرجى التكرم بالتسديد. جرمانا نت', 'name,amount,month', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('إشعار انقطاع الخدمة', 'sms', 'suspension', NULL, 'عزيزنا {name}، نحيطكم علماً بأنه سيتم انقطاع الخدمة بسبب تأخر السداد. للاستمرار في الخدمة يرجى التواصل. جرمانا نت', 'name', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ترحيب بمشترك جديد', 'sms', 'welcome', NULL, 'مرحباً {name} في عائلة جرمانا نت! تم تفعيل اشتراككم بنجاح. للتواصل والدعم الفني: {support_phone}', 'name,support_phone', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('تأكيد دفع الفاتورة', 'sms', 'payment', NULL, 'شكراً لك {name}! تم استلام مبلغ {amount} ل.س وتجديد اشتراككم حتى {expiry_date}. جرمانا نت', 'name,amount,expiry_date', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- =====================================================
-- DONE! Database schema created successfully!
-- =====================================================

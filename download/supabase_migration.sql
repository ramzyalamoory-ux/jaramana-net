-- ============================================
-- Jaramana Net - Supabase Migration Script
-- Eng Ramzy Company 2026
-- ============================================

-- 1. إضافة أعمدة حالة الدفع والتواريخ لجدول المشتركين
ALTER TABLE "Subscriber" ADD COLUMN IF NOT EXISTS "paymentStatus" TEXT DEFAULT 'paid';
ALTER TABLE "Subscriber" ADD COLUMN IF NOT EXISTS "lastRenewalDate" TIMESTAMP;
ALTER TABLE "Subscriber" ADD COLUMN IF NOT EXISTS "expiryDate" TIMESTAMP;

-- 2. تحديث المشتركين الحاليين (وضع حالة دافع وتاريخ التجديد)
UPDATE "Subscriber" 
SET 
    "paymentStatus" = 'paid',
    "lastRenewalDate" = NOW(),
    "expiryDate" = NOW() + INTERVAL '30 days'
WHERE "paymentStatus" IS NULL OR "paymentStatus" = '';

-- 3. التأكد من وجود أعمدة PPPoE
ALTER TABLE "Subscriber" ADD COLUMN IF NOT EXISTS "pppoeUser" TEXT;
ALTER TABLE "Subscriber" ADD COLUMN IF NOT EXISTS "pppoePassword" TEXT;

-- 4. التأكد من وجود عمود الباقة
ALTER TABLE "Subscriber" ADD COLUMN IF NOT EXISTS "plan" TEXT;

-- ============================================
-- إنشاء الجداول إذا لم تكن موجودة
-- ============================================

-- جدول الإعدادات
CREATE TABLE IF NOT EXISTS "Setting" (
    "id" SERIAL PRIMARY KEY,
    "adminPassword" TEXT DEFAULT '1998',
    "adminPin" TEXT DEFAULT '1998',
    "supportName1" TEXT DEFAULT 'Eng. Ramzi',
    "supportPhone1" TEXT DEFAULT '963959128944',
    "supportName2" TEXT DEFAULT 'Mr. Gassan',
    "supportPhone2" TEXT DEFAULT '963998417870'
);

-- إدراج إعدادات افتراضية إذا لم تكن موجودة
INSERT INTO "Setting" ("adminPassword", "adminPin", "supportName1", "supportPhone1", "supportName2", "supportPhone2")
SELECT '1998', '1998', 'Eng. Ramzi', '963959128944', 'Mr. Gassan', '963998417870'
WHERE NOT EXISTS (SELECT 1 FROM "Setting");

-- جدول الشكاوى
CREATE TABLE IF NOT EXISTS "Ticket" (
    "id" SERIAL PRIMARY KEY,
    "name" TEXT,
    "phone" TEXT,
    "subject" TEXT,
    "description" TEXT,
    "status" TEXT DEFAULT 'open',
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP
);

-- جدول الديون
CREATE TABLE IF NOT EXISTS "Debts" (
    "id" SERIAL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "reason" TEXT,
    "amount" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- تم الانتهاء من التحديث بنجاح!
-- Eng Ramzy Company 2026
-- ============================================

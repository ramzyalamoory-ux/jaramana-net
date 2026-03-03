-- ============================================
-- Jaramana Net - Complete Database Setup
-- Eng Ramzy Company 2026
-- ============================================

-- 1. التأكد من إيقاف RLS على جميع الجداول
ALTER TABLE "Subscriber" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Ticket" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Debts" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Setting" DISABLE ROW LEVEL SECURITY;

-- 2. إضافة جميع الأعمدة المطلوبة لجدول Subscriber
ALTER TABLE "Subscriber" ADD COLUMN IF NOT EXISTS "paymentStatus" TEXT DEFAULT 'paid';
ALTER TABLE "Subscriber" ADD COLUMN IF NOT EXISTS "lastRenewalDate" TIMESTAMP;
ALTER TABLE "Subscriber" ADD COLUMN IF NOT EXISTS "expiryDate" TIMESTAMP;
ALTER TABLE "Subscriber" ADD COLUMN IF NOT EXISTS "pppoeUser" TEXT;
ALTER TABLE "Subscriber" ADD COLUMN IF NOT EXISTS "pppoePassword" TEXT;
ALTER TABLE "Subscriber" ADD COLUMN IF NOT EXISTS "plan" TEXT;
ALTER TABLE "Subscriber" ADD COLUMN IF NOT EXISTS "balance" INTEGER DEFAULT 0;
ALTER TABLE "Subscriber" ADD COLUMN IF NOT EXISTS "monthlyFee" INTEGER DEFAULT 0;
ALTER TABLE "Subscriber" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'active';
ALTER TABLE "Subscriber" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "Subscriber" ADD COLUMN IF NOT EXISTS "address" TEXT;

-- 3. تحديث المشتركين الحاليين
UPDATE "Subscriber" 
SET 
    "paymentStatus" = COALESCE("paymentStatus", 'paid'),
    "status" = COALESCE("status", 'active'),
    "balance" = COALESCE("balance", 0),
    "monthlyFee" = COALESCE("monthlyFee", 0)
WHERE "paymentStatus" IS NULL OR "status" IS NULL;

-- 4. التأكد من وجود جدول Setting مع البيانات
CREATE TABLE IF NOT EXISTS "Setting" (
    "id" SERIAL PRIMARY KEY,
    "adminPassword" TEXT DEFAULT '1998',
    "adminPin" TEXT DEFAULT '1998',
    "supportName1" TEXT DEFAULT 'Eng. Ramzi',
    "supportPhone1" TEXT DEFAULT '963959128944',
    "supportName2" TEXT DEFAULT 'Mr. Gassan',
    "supportPhone2" TEXT DEFAULT '963998417870'
);

-- إدراج إعدادات افتراضية
INSERT INTO "Setting" ("adminPassword", "adminPin", "supportName1", "supportPhone1", "supportName2", "supportPhone2")
SELECT '1998', '1998', 'Eng. Ramzi', '963959128944', 'Mr. Gassan', '963998417870'
WHERE NOT EXISTS (SELECT 1 FROM "Setting");

-- 5. التأكد من وجود جدول Ticket
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

-- 6. التأكد من وجود جدول Debts
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
-- تم الانتهاء! جميع العمليات جاهزة:
-- ✅ إضافة مشتركين
-- ✅ تعديل مشتركين
-- ✅ حذف مشتركين
-- ✅ إضافة ديون
-- ✅ تعديل ديون
-- ✅ حذف ديون
-- ✅ إضافة شكاوى
-- ✅ تعديل حالة شكاوى
-- ✅ حذف شكاوى
-- ✅ حفظ الإعدادات
-- ============================================

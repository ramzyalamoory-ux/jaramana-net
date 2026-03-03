-- =============================================
-- 🗃️ Jaramana Net - Complete Database Fix v2
-- =============================================
-- Execute this in Supabase SQL Editor
-- URL: https://supabase.com/dashboard/project/pypomilurmkzlceecukr/sql

-- =============================================
-- 1. Disable RLS on all tables
-- =============================================
ALTER TABLE "Subscriber" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Ticket" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Debts" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Setting" DISABLE ROW LEVEL SECURITY;

-- =============================================
-- 2. Ensure Subscriber table has all columns
-- =============================================
ALTER TABLE "Subscriber" ADD COLUMN IF NOT EXISTS "paymentStatus" TEXT DEFAULT 'paid';
ALTER TABLE "Subscriber" ADD COLUMN IF NOT EXISTS "lastRenewalDate" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "Subscriber" ADD COLUMN IF NOT EXISTS "expiryDate" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "Subscriber" ADD COLUMN IF NOT EXISTS "pppoeUser" TEXT;
ALTER TABLE "Subscriber" ADD COLUMN IF NOT EXISTS "pppoePassword" TEXT;
ALTER TABLE "Subscriber" ADD COLUMN IF NOT EXISTS "plan" TEXT;
ALTER TABLE "Subscriber" ADD COLUMN IF NOT EXISTS "balance" INTEGER DEFAULT 0;
ALTER TABLE "Subscriber" ADD COLUMN IF NOT EXISTS "monthlyFee" INTEGER DEFAULT 0;
ALTER TABLE "Subscriber" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'active';
ALTER TABLE "Subscriber" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "Subscriber" ADD COLUMN IF NOT EXISTS "address" TEXT;

-- =============================================
-- 3. Create Payment table (سجل الدفعات)
-- =============================================
CREATE TABLE IF NOT EXISTS "Payment" (
    id SERIAL PRIMARY KEY,
    "subscriberId" INTEGER,
    "subscriberName" TEXT,
    amount DECIMAL(10,0) DEFAULT 0,
    method TEXT DEFAULT 'cash',
    notes TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE "Payment" DISABLE ROW LEVEL SECURITY;

-- =============================================
-- 4. Create MikroTikDevice table (أجهزة الميكروتيك)
-- =============================================
CREATE TABLE IF NOT EXISTS "MikroTikDevice" (
    id SERIAL PRIMARY KEY,
    name TEXT DEFAULT 'السيرفر الرئيسي',
    host TEXT,
    port INTEGER DEFAULT 8728,
    username TEXT,
    password TEXT,
    "isDefault" BOOLEAN DEFAULT true,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE "MikroTikDevice" DISABLE ROW LEVEL SECURITY;

-- =============================================
-- 5. Create NotificationLog table (سجل الإشعارات)
-- =============================================
CREATE TABLE IF NOT EXISTS "NotificationLog" (
    id SERIAL PRIMARY KEY,
    title TEXT,
    message TEXT,
    recipients INTEGER DEFAULT 0,
    "sentAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE "NotificationLog" DISABLE ROW LEVEL SECURITY;

-- =============================================
-- 6. Create indexes for better performance
-- =============================================
CREATE INDEX IF NOT EXISTS idx_payment_subscriber ON "Payment"("subscriberId");
CREATE INDEX IF NOT EXISTS idx_payment_date ON "Payment"("createdAt");
CREATE INDEX IF NOT EXISTS idx_mikrotik_active ON "MikroTikDevice"("isActive");
CREATE INDEX IF NOT EXISTS idx_notification_date ON "NotificationLog"("sentAt");

-- =============================================
-- 7. Insert default MikroTik device if not exists
-- =============================================
INSERT INTO "MikroTikDevice" (name, host, port, username, password, "isDefault", "isActive", "createdAt", "updatedAt")
SELECT 'السيرفر الرئيسي', '', 8728, '', '', true, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "MikroTikDevice" WHERE "isDefault" = true);

-- =============================================
-- ✅ Success! All tables are ready
-- =============================================
SELECT '✅ تم بنجاح! جميع الجداول جاهزة' as status;

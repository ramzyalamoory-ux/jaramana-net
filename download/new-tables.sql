-- Jaramana Net - New Tables for PWA Features
-- Run this in Supabase SQL Editor

-- 1. Payment Table (سجل الدفعات)
CREATE TABLE IF NOT EXISTS "Payment" (
  id SERIAL PRIMARY KEY,
  "subscriberId" INTEGER REFERENCES "Subscriber"(id),
  "subscriberName" TEXT,
  amount DECIMAL(10,0) DEFAULT 0,
  method TEXT DEFAULT 'cash',
  notes TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. MikroTik Device Table (أجهزة الميكروتيك)
CREATE TABLE IF NOT EXISTS "MikroTikDevice" (
  id SERIAL PRIMARY KEY,
  name TEXT DEFAULT 'السيرفر الرئيسي',
  host TEXT,
  port INTEGER DEFAULT 8728,
  username TEXT,
  password TEXT,
  "isDefault" BOOLEAN DEFAULT true,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Notification Log Table (سجل الإشعارات)
CREATE TABLE IF NOT EXISTS "NotificationLog" (
  id SERIAL PRIMARY KEY,
  title TEXT,
  message TEXT,
  recipients INTEGER DEFAULT 0,
  "sentAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS for new tables
ALTER TABLE "Payment" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "MikroTikDevice" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "NotificationLog" DISABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_subscriber ON "Payment"("subscriberId");
CREATE INDEX IF NOT EXISTS idx_payment_date ON "Payment"("createdAt");
CREATE INDEX IF NOT EXISTS idx_mikrotik_active ON "MikroTikDevice"("isActive");

-- Success message
SELECT 'Tables created successfully!' as message;

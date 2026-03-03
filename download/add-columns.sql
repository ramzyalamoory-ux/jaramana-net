-- =============================================
-- 🔧 إضافة الأعمدة الناقصة لجدول Subscriber
-- =============================================
-- نفذ هذا الكود في SQL Editor في Supabase

-- إضافة عمود balance (الحساب/الرصيد)
ALTER TABLE "Subscriber" ADD COLUMN IF NOT EXISTS balance INTEGER DEFAULT 0;

-- إضافة عمود plan (الباقة)
ALTER TABLE "Subscriber" ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT '';

-- إضافة عمود status (الحالة) - للتوافق مع الكود
ALTER TABLE "Subscriber" ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- تحديث البيانات الحالية
UPDATE "Subscriber"
SET
    balance = 0,
    plan = '',
    status = CASE WHEN "isActive" = true THEN 'active' ELSE 'suspended' END
WHERE balance IS NULL OR plan IS NULL;

-- =============================================
-- التحقق من النتيجة
-- =============================================
SELECT id, name, phone, balance, plan, status, "serviceStatus"
FROM "Subscriber"
LIMIT 5;

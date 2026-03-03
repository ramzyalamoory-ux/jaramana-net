-- =============================================
-- 🔧 إصلاح جدول MikroTikDevice الموجود
-- =============================================
-- تشغيل هذا إذا كان الجدول موجود مسبقاً

-- إضافة عمود updatedAt إذا لم يكن موجوداً
ALTER TABLE "MikroTikDevice" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- تحديث جميع الصفوف الحالية
UPDATE "MikroTikDevice" SET "updatedAt" = NOW() WHERE "updatedAt" IS NULL;

-- إضافة عمود createdAt إذا لم يكن موجوداً
ALTER TABLE "MikroTikDevice" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- تحديث الصفوف الحالية
UPDATE "MikroTikDevice" SET "createdAt" = NOW() WHERE "createdAt" IS NULL;

-- إضافة سيرفر افتراضي إذا لم يكن موجوداً
INSERT INTO "MikroTikDevice" (name, host, port, username, password, "isDefault", "isActive", "createdAt", "updatedAt")
SELECT 'السيرفر الرئيسي', '', 8728, '', '', true, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "MikroTikDevice" WHERE "isDefault" = true);

SELECT '✅ تم الإصلاح!' as status;

-- ========================================
-- إصلاح جداول Jaramana Net
-- ========================================

-- 1. إنشاء جدول الشكاوى (Ticket) بالأعمدة الصحيحة
CREATE TABLE IF NOT EXISTS "Ticket" (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  phone VARCHAR(20),
  subject VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'open',
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP
);

-- إضافة أعمدة مفقودة إذا كانت موجودة
DO $$ 
BEGIN
  -- إضافة عمود message إذا لم يكن موجود
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Ticket' AND column_name = 'message') THEN
    ALTER TABLE "Ticket" ADD COLUMN message TEXT;
  END IF;
END $$;

-- 2. التأكد من أن السيرفر له isActive = true
UPDATE "MikroTikDevice" SET "isActive" = true WHERE "isActive" IS NULL;
UPDATE "MikroTikDevice" SET "isDefault" = true WHERE "isDefault" IS NULL LIMIT 1;

-- 3. إنشاء جدول Complaint كبديل
CREATE TABLE IF NOT EXISTS "Complaint" (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  phone VARCHAR(20),
  title VARCHAR(255),
  content TEXT,
  status VARCHAR(20) DEFAULT 'open',
  createdAt TIMESTAMP DEFAULT NOW()
);

-- عرض رسالة نجاح
SELECT 'تم إصلاح الجداول بنجاح! ✅' as message;

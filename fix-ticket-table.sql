-- إضافة عمود description إذا لم يكن موجود
ALTER TABLE "Ticket" ADD COLUMN IF NOT EXISTS description TEXT;

-- إضافة عمود status إذا لم يكن موجود
ALTER TABLE "Ticket" ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'open';

-- إضافة شكاوى تجريبية
INSERT INTO "Ticket" (name, phone, subject, description, status)
VALUES
  ('أحمد', '0999123456', 'بطء الإنترنت', 'السرعة بطيئة جداً', 'open'),
  ('محمد', '0999654321', 'انقطاع الخدمة', 'انقطع الإنترنت منذ يومين', 'open');

-- عرض الجدول
SELECT * FROM "Ticket" ORDER BY id DESC LIMIT 5;

-- ===========================================
-- جداول جرمانا نت - JaraMana Net
-- انسخ والصق في Supabase SQL Editor
-- ===========================================

-- 1. جدول المشتركين
CREATE TABLE IF NOT EXISTS "Subscriber" (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  pppoeUser TEXT,
  pppoePassword TEXT,
  plan TEXT,
  monthlyFee INTEGER DEFAULT 0,
  balance INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  notes TEXT,
  mikrotikDeviceId INTEGER,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP
);

-- 2. جدول الفواتير
CREATE TABLE IF NOT EXISTS "Invoice" (
  id SERIAL PRIMARY KEY,
  subscriberId INTEGER REFERENCES "Subscriber"(id),
  amount INTEGER DEFAULT 0,
  month TEXT,
  dueDate DATE,
  paid BOOLEAN DEFAULT false,
  paidAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT NOW()
);

-- 3. جدول الديون الجديدة
CREATE TABLE IF NOT EXISTS "Debts" (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  reason TEXT,
  amount INTEGER DEFAULT 0,
  createdAt TIMESTAMP DEFAULT NOW()
);

-- 4. جدول الشكاوى
CREATE TABLE IF NOT EXISTS "Complaints" (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  phone TEXT,
  details TEXT,
  status TEXT DEFAULT 'pending',
  createdAt TIMESTAMP DEFAULT NOW()
);

-- 5. جدول التذاكر (للأدمن)
CREATE TABLE IF NOT EXISTS "Ticket" (
  id SERIAL PRIMARY KEY,
  name TEXT,
  phone TEXT,
  subject TEXT,
  description TEXT,
  subscriberId INTEGER,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'open',
  response TEXT,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP
);

-- 6. جدول الإعدادات
CREATE TABLE IF NOT EXISTS "Setting" (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  updatedAt TIMESTAMP DEFAULT NOW()
);

-- 7. جدول أجهزة MikroTik
CREATE TABLE IF NOT EXISTS "MikroTikDevice" (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  host TEXT NOT NULL,
  port INTEGER DEFAULT 8728,
  username TEXT,
  password TEXT,
  isDefault BOOLEAN DEFAULT false,
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT NOW()
);

-- 8. جدول المنتجات
CREATE TABLE IF NOT EXISTS "Product" (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  categoryId INTEGER,
  price INTEGER DEFAULT 0,
  cost INTEGER DEFAULT 0,
  quantity INTEGER DEFAULT 0,
  minStock INTEGER DEFAULT 5,
  createdAt TIMESTAMP DEFAULT NOW()
);

-- 9. جدول التصنيفات
CREATE TABLE IF NOT EXISTS "ProductCategory" (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL
);

-- 10. إدراج التصنيفات الافتراضية
INSERT INTO "ProductCategory" (name) VALUES 
  ('راوتر'),
  ('كبلات'),
  ('وصلات'),
  ('أخرى')
ON CONFLICT DO NOTHING;

-- 11. إدراج الإعدادات الافتراضية
INSERT INTO "Setting" (key, value) VALUES 
  ('adminPassword', '1998'),
  ('adminPin', '1998'),
  ('supportName1', 'المهندس رمزي'),
  ('supportPhone1', '963959128944'),
  ('supportName2', 'الاستاذ غسان'),
  ('supportPhone2', '963998417870')
ON CONFLICT (key) DO NOTHING;

-- 12. تفعيل RLS (Row Level Security) - اختياري
ALTER TABLE "Subscriber" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Invoice" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Debts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Complaints" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Ticket" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Setting" ENABLE ROW LEVEL SECURITY;

-- 13. السماح بالوصول العام (للتطبيق)
CREATE POLICY "Allow all" ON "Subscriber" FOR ALL USING (true);
CREATE POLICY "Allow all" ON "Invoice" FOR ALL USING (true);
CREATE POLICY "Allow all" ON "Debts" FOR ALL USING (true);
CREATE POLICY "Allow all" ON "Complaints" FOR ALL USING (true);
CREATE POLICY "Allow all" ON "Ticket" FOR ALL USING (true);
CREATE POLICY "Allow all" ON "Setting" FOR ALL USING (true);
CREATE POLICY "Allow all" ON "Product" FOR ALL USING (true);
CREATE POLICY "Allow all" ON "ProductCategory" FOR ALL USING (true);
CREATE POLICY "Allow all" ON "MikroTikDevice" FOR ALL USING (true);

-- ===========================================
-- تم! ✅
-- ===========================================

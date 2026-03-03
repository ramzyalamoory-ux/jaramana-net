-- ===============================================
-- سكريبت إنشاء جداول Supabase لمشروع جرمانا نت
-- ===============================================
-- تشغيل هذا السكريبت في SQL Editor في لوحة تحكم Supabase
-- https://supabase.com/dashboard/project/pypomilurmkzlceecukr/sql

-- 1. جدول المشتركين (Subscriber)
CREATE TABLE IF NOT EXISTS "Subscriber" (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  pppoe_user TEXT,
  pppoe_password TEXT,
  plan TEXT,
  monthly_fee INTEGER DEFAULT 0,
  balance INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  expiry_date DATE
);

-- 2. جدول الفواتير (Invoice)
CREATE TABLE IF NOT EXISTS "Invoice" (
  id SERIAL PRIMARY KEY,
  subscriber_id INTEGER REFERENCES "Subscriber"(id),
  amount INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  due_date DATE,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. جدول التذاكر/الشكاوى (Ticket)
CREATE TABLE IF NOT EXISTS "Ticket" (
  id SERIAL PRIMARY KEY,
  name TEXT,
  phone TEXT,
  subject TEXT NOT NULL,
  description TEXT,
  subscriber_id INTEGER,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'open',
  response TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- 4. جدول الإعدادات (Setting)
CREATE TABLE IF NOT EXISTS "Setting" (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. جدول الديون (Debts)
CREATE TABLE IF NOT EXISTS "Debts" (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  reason TEXT,
  amount INTEGER NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'pending',
  subscriber_id INTEGER REFERENCES "Subscriber"(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);

-- 6. جدول الشكاوى العام (Complaints)
CREATE TABLE IF NOT EXISTS "Complaints" (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  phone TEXT,
  details TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- 7. جدول أجهزة MikroTik
CREATE TABLE IF NOT EXISTS "MikroTikDevice" (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  ip TEXT NOT NULL,
  username TEXT NOT NULL,
  password TEXT,
  port INTEGER DEFAULT 8728,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. جدول المنتجات (Product)
CREATE TABLE IF NOT EXISTS "Product" (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category_id INTEGER,
  price INTEGER DEFAULT 0,
  quantity INTEGER DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. جدول تصنيفات المنتجات (ProductCategory)
CREATE TABLE IF NOT EXISTS "ProductCategory" (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. جدول الإشعارات (Notification)
CREATE TABLE IF NOT EXISTS "Notification" (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT,
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. جدول حركة المخزون (InventoryTransaction)
CREATE TABLE IF NOT EXISTS "InventoryTransaction" (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES "Product"(id),
  quantity INTEGER NOT NULL,
  type TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===============================================
-- إدراج الإعدادات الافتراضية
-- ===============================================
INSERT INTO "Setting" (key, value) 
VALUES 
  ('adminUsername', 'admin'),
  ('adminPassword', '1998'),
  ('adminPin', '1998'),
  ('companyName', 'جرمانا نت'),
  ('supportPhone1', '963959128944'),
  ('supportPhone2', '963998417870'),
  ('supportName1', 'المهندس رمزي'),
  ('supportName2', 'الاستاذ غسان')
ON CONFLICT (key) DO NOTHING;

-- ===============================================
-- تفعيل Row Level Security (RLS)
-- ===============================================
-- تفعيل الوصول العام للقراءة والكتابة (للتطبيق)
-- يمكنك تغيير هذه السياسات حسب احتياجاتك

ALTER TABLE "Subscriber" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Invoice" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Ticket" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Setting" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Debts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Complaints" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MikroTikDevice" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProductCategory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "InventoryTransaction" ENABLE ROW LEVEL SECURITY;

-- سياسة السماح بالوصول الكامل (للتطوير)
CREATE POLICY "Allow all access" ON "Subscriber" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON "Invoice" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON "Ticket" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON "Setting" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON "Debts" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON "Complaints" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON "MikroTikDevice" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON "Product" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON "ProductCategory" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON "Notification" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON "InventoryTransaction" FOR ALL USING (true) WITH CHECK (true);

-- ===============================================
-- إنشاء فهارس لتحسين الأداء
-- ===============================================
CREATE INDEX IF NOT EXISTS idx_subscriber_phone ON "Subscriber"(phone);
CREATE INDEX IF NOT EXISTS idx_subscriber_name ON "Subscriber"(name);
CREATE INDEX IF NOT EXISTS idx_ticket_status ON "Ticket"(status);
CREATE INDEX IF NOT EXISTS idx_debts_status ON "Debts"(status);

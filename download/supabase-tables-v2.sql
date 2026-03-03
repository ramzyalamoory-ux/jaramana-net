-- =============================================
-- 🗃️ جداول Supabase لمشروع جرمانا نت
-- =============================================
-- تنفيذ هذا الكود في SQL Editor في Supabase

-- 1. جدول الإعدادات
CREATE TABLE IF NOT EXISTS "Setting" (
    id SERIAL PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. جدول المشتركين
CREATE TABLE IF NOT EXISTS "Subscriber" (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    "monthlyFee" INTEGER DEFAULT 0,
    balance INTEGER DEFAULT 0,
    "pppoeUser" TEXT,
    "pppoePassword" TEXT,
    plan TEXT,
    status TEXT DEFAULT 'active',
    notes TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE
);

-- 3. جدول الشكاوى/التذاكر
CREATE TABLE IF NOT EXISTS "Ticket" (
    id SERIAL PRIMARY KEY,
    name TEXT,
    phone TEXT,
    subject TEXT,
    description TEXT,
    status TEXT DEFAULT 'open',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. جدول الديون (الناقص!)
CREATE TABLE IF NOT EXISTS "Debts" (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    reason TEXT,
    amount INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 🔓 تعطيل RLS للسماح بالقراءة والكتابة
-- =============================================
ALTER TABLE "Setting" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Subscriber" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Ticket" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Debts" DISABLE ROW LEVEL SECURITY;

-- =============================================
-- 📝 إدراج إعدادات افتراضية
-- =============================================
INSERT INTO "Setting" (key, value) VALUES
    ('adminUsername', 'admin'),
    ('adminPassword', '1998'),
    ('adminPin', '1998'),
    ('companyName', 'جرمانا نت'),
    ('supportName1', 'المهندس رمزي'),
    ('supportPhone1', '963959128944'),
    ('supportName2', 'الاستاذ غسان'),
    ('supportPhone2', '963998417870')
ON CONFLICT (key) DO NOTHING;

-- =============================================
-- ✅ التحقق من الجداول
-- =============================================
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('Setting', 'Subscriber', 'Ticket', 'Debts');

import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = 'https://pypomilurmkzlceecukr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_R30YtCj6dqhLwjTQsrR1Uw_tcItK0JV';

const getHeaders = () => ({
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
});

// صلاحيات الأدوار
const ROLE_PERMISSIONS = {
  admin: {
    dashboard: true,
    subscribers: true,
    debts: true,
    tickets: true,
    notifications: true,
    payments: true,
    reports: true,
    monitor: true,
    whatsapp: true,
    users: true,
    mikrotik: true,
    pppoe: true,
    settings: true,
  },
  accountant: {
    dashboard: true,
    subscribers: true,
    debts: true,
    tickets: false,
    notifications: false,
    payments: true,
    reports: true,
    monitor: false,
    whatsapp: false,
    users: false,
    mikrotik: false,
    pppoe: false,
    settings: false,
  },
  support: {
    dashboard: true,
    subscribers: true,
    debts: false,
    tickets: true,
    notifications: false,
    payments: false,
    reports: false,
    monitor: true,
    whatsapp: true,
    users: false,
    mikrotik: true,
    pppoe: true,
    settings: false,
  },
};

// POST - تسجيل الدخول
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, pin } = body;

    if (!username || !password) {
      return NextResponse.json({ error: 'اسم المستخدم وكلمة السر مطلوبان' }, { status: 400 });
    }

    // 1. محاولة الدخول كمستخدم من جدول User
    const userRes = await fetch(`${SUPABASE_URL}/rest/v1/User?select=*&username=eq.${username}&password=eq.${password}&isActive=eq.true`, {
      headers: getHeaders(),
    });
    const users = await userRes.json();

    if (users && users.length > 0) {
      const user = users[0];
      
      // تحديث آخر تسجيل دخول
      await fetch(`${SUPABASE_URL}/rest/v1/User?id=eq.${user.id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ lastLogin: new Date().toISOString() }),
      });

      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          permissions: ROLE_PERMISSIONS[user.role as keyof typeof ROLE_PERMISSIONS] || {},
        },
        token: `user_${user.id}_${Date.now()}`,
      });
    }

    // 2. محاولة الدخول كأدمن رئيسي (من جدول Setting)
    if (username === 'admin') {
      const settingsRes = await fetch(`${SUPABASE_URL}/rest/v1/Setting?select=*&limit=1`, {
        headers: getHeaders(),
      });
      const settings = await settingsRes.json();

      if (settings && settings[0]) {
        const setting = settings[0];
        
        // التحقق من كلمة السر و PIN
        if (password === setting.adminPassword) {
          // إذا دخل كلمة السر صح، نطلب PIN
          if (!pin) {
            return NextResponse.json({
              success: false,
              requirePin: true,
              message: 'أدخل رمز PIN',
            });
          }
          
          if (pin === setting.adminPin) {
            return NextResponse.json({
              success: true,
              user: {
                id: 0,
                username: 'admin',
                name: 'مدير النظام',
                role: 'admin',
                permissions: ROLE_PERMISSIONS.admin,
              },
              token: `admin_${Date.now()}`,
            });
          }
        }
      }
    }

    return NextResponse.json({ error: 'اسم المستخدم أو كلمة السر غير صحيحة' }, { status: 401 });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({
      error: 'حدث خطأ أثناء تسجيل الدخول',
      details: error instanceof Error ? error.message : 'خطأ غير معروف',
    }, { status: 500 });
  }
}

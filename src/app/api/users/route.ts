import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = 'https://pypomilurmkzlceecukr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_R30YtCj6dqhLwjTQsrR1Uw_tcItK0JV';

const getHeaders = () => ({
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
});

// صلاحيات المستخدمين
const USER_ROLES = {
  admin: {
    name: 'مدير',
    permissions: ['all'],
    description: 'صلاحيات كاملة على النظام',
  },
  accountant: {
    name: 'محاسب',
    permissions: ['subscribers', 'payments', 'debts', 'reports'],
    description: 'إدارة المشتركين والدفعات والتقارير',
  },
  support: {
    name: 'دعم فني',
    permissions: ['subscribers', 'tickets', 'notifications'],
    description: 'إدارة المشتركين والشكاوى والإشعارات',
  },
};

// GET - جلب المستخدمين
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('id');
  const action = searchParams.get('action');

  // جلب الأدوار المتاحة
  if (action === 'roles') {
    return NextResponse.json({ roles: USER_ROLES });
  }

  // جلب مستخدم محدد
  if (userId) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/User?select=*&id=eq.${userId}`, {
      headers: getHeaders(),
    });
    const users = await res.json();
    return NextResponse.json({ user: users[0] || null });
  }

  // جلب جميع المستخدمين
  const res = await fetch(`${SUPABASE_URL}/rest/v1/User?select=*&order=createdAt.desc`, {
    headers: getHeaders(),
  });
  const users = await res.json();

  // إزالة كلمات السر من الاستجابة
  const safeUsers = users.map((u: any) => ({
    ...u,
    password: undefined,
  }));

  return NextResponse.json({ users: safeUsers, roles: USER_ROLES });
}

// POST - إنشاء مستخدم جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, name, role, phone } = body;

    if (!username || !password || !name || !role) {
      return NextResponse.json({ error: 'جميع الحقول مطلوبة' }, { status: 400 });
    }

    // التحقق من عدم وجود المستخدم
    const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/User?select=*&username=eq.${username}`, {
      headers: getHeaders(),
    });
    const existingUsers = await checkRes.json();

    if (existingUsers.length > 0) {
      return NextResponse.json({ error: 'اسم المستخدم موجود مسبقاً' }, { status: 400 });
    }

    // إنشاء المستخدم
    const res = await fetch(`${SUPABASE_URL}/rest/v1/User`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        username,
        password, // في الإنتاج يجب تشفير كلمة السر
        name,
        role,
        phone,
        permissions: USER_ROLES[role as keyof typeof USER_ROLES]?.permissions || [],
        isActive: true,
        createdAt: new Date().toISOString(),
        lastLogin: null,
      }),
    });

    if (!res.ok) {
      throw new Error('فشل إنشاء المستخدم');
    }

    return NextResponse.json({ success: true, message: 'تم إنشاء المستخدم بنجاح' });

  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json({
      error: 'فشل إنشاء المستخدم',
      details: error instanceof Error ? error.message : 'خطأ غير معروف',
    }, { status: 500 });
  }
}

// PATCH - تحديث مستخدم
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'معرف المستخدم مطلوب' }, { status: 400 });
    }

    // تحديث صلاحيات المستخدم إذا تم تغيير الدور
    if (updateData.role) {
      updateData.permissions = USER_ROLES[updateData.role as keyof typeof USER_ROLES]?.permissions || [];
    }

    const res = await fetch(`${SUPABASE_URL}/rest/v1/User?id=eq.${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({
        ...updateData,
        updatedAt: new Date().toISOString(),
      }),
    });

    if (!res.ok) {
      throw new Error('فشل تحديث المستخدم');
    }

    return NextResponse.json({ success: true, message: 'تم تحديث المستخدم بنجاح' });

  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({
      error: 'فشل تحديث المستخدم',
      details: error instanceof Error ? error.message : 'خطأ غير معروف',
    }, { status: 500 });
  }
}

// DELETE - حذف مستخدم
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'معرف المستخدم مطلوب' }, { status: 400 });
    }

    const res = await fetch(`${SUPABASE_URL}/rest/v1/User?id=eq.${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    if (!res.ok) {
      throw new Error('فشل حذف المستخدم');
    }

    return NextResponse.json({ success: true, message: 'تم حذف المستخدم بنجاح' });

  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({
      error: 'فشل حذف المستخدم',
      details: error instanceof Error ? error.message : 'خطأ غير معروف',
    }, { status: 500 });
  }
}

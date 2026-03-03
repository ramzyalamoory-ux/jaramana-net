import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const SUPABASE_URL = 'https://pypomilurmkzlceecukr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_R30YtCj6dqhLwjTQsrR1Uw_tcItK0JV';

export const dynamic = 'force-dynamic';

// GET settings from database
async function getSettings() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/Setting?select=*`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
    });

    const data = await res.json();
    const map: Record<string, string> = {};

    if (Array.isArray(data)) {
      data.forEach((s: any) => {
        map[s.key] = s.value;
      });
    }

    return {
      username: map.adminUsername || 'admin',
      password: map.adminPassword || '1998',
      pin: map.adminPin || '1998',
    };
  } catch {
    return {
      username: 'admin',
      password: '1998',
      pin: '1998',
    };
  }
}

function makeToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// POST - Login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, pin } = body;

    // Get settings from database
    const settings = await getSettings();

    // Check credentials
    if (username !== settings.username) {
      return NextResponse.json(
        { success: false, error: 'اسم المستخدم غير صحيح' },
        { status: 401 }
      );
    }

    if (password !== settings.password) {
      return NextResponse.json(
        { success: false, error: 'كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }

    if (pin !== settings.pin) {
      return NextResponse.json(
        { success: false, error: 'رمز PIN غير صحيح' },
        { status: 401 }
      );
    }

    // Success
    const token = makeToken();
    return NextResponse.json({
      success: true,
      token,
      message: 'تم تسجيل الدخول بنجاح',
    });
  } catch (err) {
    console.error('Auth error:', err);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ داخلي' },
      { status: 500 }
    );
  }
}

// GET - Validate session
export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');

  if (!token || token.length !== 64 || !/^[a-f0-9]{64}$/.test(token)) {
    return NextResponse.json({ valid: false }, { status: 401 });
  }

  return NextResponse.json({ valid: true });
}

// DELETE - Logout
export async function DELETE() {
  return NextResponse.json({ success: true });
}

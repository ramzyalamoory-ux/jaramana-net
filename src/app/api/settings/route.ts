import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = 'https://pypomilurmkzlceecukr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_R30YtCj6dqhLwjTQsrR1Uw_tcItK0JV';

// GET - جلب الإعدادات
export async function GET() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/Setting?select=*`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
    });

    const data = await res.json();

    // تحويل لمفاتيح
    const settingsMap: Record<string, string> = {};
    if (Array.isArray(data)) {
      data.forEach((s: any) => {
        settingsMap[s.key] = s.value;
      });
    }

    return NextResponse.json({
      adminUsername: settingsMap.adminUsername || 'admin',
      adminPassword: settingsMap.adminPassword || '1998',
      adminPin: settingsMap.adminPin || '1998',
      companyName: settingsMap.companyName || 'Jaramana Net',
      supportPhone1: settingsMap.supportPhone1 || '963959128944',
      supportPhone2: settingsMap.supportPhone2 || '963998417870',
      supportName1: settingsMap.supportName1 || 'المهندس رمزي',
      supportName2: settingsMap.supportName2 || 'الاستاذ غسان',
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({
      adminUsername: 'admin',
      adminPassword: '1998',
      adminPin: '1998',
      companyName: 'Jaramana Net',
      supportPhone1: '963959128944',
      supportPhone2: '963998417870',
      supportName1: 'المهندس رمزي',
      supportName2: 'الاستاذ غسان',
    });
  }
}

// POST - حفظ الإعدادات
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Saving settings:', body);

    const settings = [
      { key: 'adminPassword', value: String(body.adminPassword || '1998') },
      { key: 'adminPin', value: String(body.adminPin || '1998') },
      { key: 'supportName1', value: String(body.supportName1 || '') },
      { key: 'supportPhone1', value: String(body.supportPhone1 || '') },
      { key: 'supportName2', value: String(body.supportName2 || '') },
      { key: 'supportPhone2', value: String(body.supportPhone2 || '') },
    ];

    // حفظ كل إعداد
    for (const s of settings) {
      // أولاً نحاول تحديث، إذا لم يوجد نضيف
      const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/Setting?key=eq.${s.key}&select=id`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
      });
      const existing = await checkRes.json();

      if (existing && existing.length > 0) {
        // تحديث
        await fetch(`${SUPABASE_URL}/rest/v1/Setting?key=eq.${s.key}`, {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({ value: s.value }),
        });
      } else {
        // إضافة
        await fetch(`${SUPABASE_URL}/rest/v1/Setting`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify(s),
        });
      }
    }

    return NextResponse.json({ success: true, message: 'تم حفظ الإعدادات' });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حفظ الإعدادات: ' + String(error) },
      { status: 500 }
    );
  }
}

// PUT - نفس POST
export async function PUT(request: NextRequest) {
  return POST(request);
}

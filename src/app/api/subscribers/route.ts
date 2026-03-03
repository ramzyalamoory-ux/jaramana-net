import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = 'https://pypomilurmkzlceecukr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_R30YtCj6dqhLwjTQsrR1Uw_tcItK0JV';
const TABLE_NAME = 'Subscriber';

// GET - جلب كل المشتركين أو البحث
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    let url = `${SUPABASE_URL}/rest/v1/${TABLE_NAME}?select=*&order=id.desc`;

    if (search) {
      url = `${SUPABASE_URL}/rest/v1/${TABLE_NAME}?select=*&or=(name.ilike.%25${encodeURIComponent(search)}%25,phone.ilike.%25${encodeURIComponent(search)}%25)`;
    }

    const res = await fetch(url, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
    });

    const data = await res.json();

    // تحويل البيانات لتتوافق مع الواجهة
    const formattedData = (Array.isArray(data) ? data : []).map((s: any) => ({
      id: s.id,
      name: s.name,
      phone: s.phone,
      address: s.address,
      monthlyFee: s.monthlyFee || 0,
      balance: s.balance || 0,
      pppoeUser: s.pppoeUser,
      pppoePassword: s.pppoePassword,
      plan: s.plan || '',
      status: s.serviceStatus || (s.isActive ? 'active' : 'suspended'),
      notes: s.notes,
      createdAt: s.createdAt,
    }));

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    return NextResponse.json([]);
  }
}

// POST - إضافة مشترك جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Adding subscriber:', body);

    const {
      name,
      phone,
      address,
      monthlyFee,
      balance,
      pppoeUser,
      pppoePassword,
      plan,
      status,
      notes
    } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { error: 'الاسم ورقم الهاتف مطلوبان' },
        { status: 400 }
      );
    }

    // تحويل البيانات لتتوافق مع هيكل الجدول الحقيقي
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE_NAME}`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        name,
        phone,
        address: address || null,
        monthlyFee: monthlyFee || 0,
        balance: balance || 0,
        pppoeUser: pppoeUser || null,
        pppoePassword: pppoePassword || null,
        plan: plan || null,
        serviceStatus: status || 'active',
        isActive: status !== 'suspended',
        notes: notes || null,
        createdAt: new Date().toISOString(),
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('Supabase error:', data);
      return NextResponse.json(
        { error: 'حدث خطأ: ' + JSON.stringify(data) },
        { status: 500 }
      );
    }

    console.log('Created subscriber:', data);
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating subscriber:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إضافة المشترك: ' + String(error) },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = 'https://pypomilurmkzlceecukr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_R30YtCj6dqhLwjTQsrR1Uw_tcItK0JV';
const TABLE_NAME = 'Complaints';

// GET - جلب كل الشكاوى (للأدمن)
export async function GET() {
  try {
    // نجرب جدول Complaints، إذا مش موجود نستخدم Ticket
    let res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE_NAME}?select=*&order=id.desc`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
    });

    // إذا الجدول مش موجود، نستخدم Ticket
    if (!res.ok) {
      res = await fetch(`${SUPABASE_URL}/rest/v1/Ticket?select=*&order=id.desc`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
      });
    }

    const data = await res.json();
    return NextResponse.json(Array.isArray(data) ? data : []);
  } catch (error) {
    console.error('Error fetching complaints:', error);
    return NextResponse.json([]);
  }
}

// POST - إضافة شكوى جديدة (للزبون)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('New complaint:', body);

    const { title, phone, details } = body;

    if (!title || !details) {
      return NextResponse.json({ error: 'العنوان والتفاصيل مطلوبان' }, { status: 400 });
    }

    // نحفظ في جدول Ticket (لأنه موجود)
    const res = await fetch(`${SUPABASE_URL}/rest/v1/Ticket`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        name: title,
        phone: phone || null,
        subject: title,
        description: details,
        status: 'pending',
        createdAt: new Date().toISOString(),
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('Error creating complaint:', data);
      return NextResponse.json({ error: 'حدث خطأ: ' + JSON.stringify(data) }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'تم إرسال الشكوى بنجاح', data }, { status: 201 });
  } catch (error) {
    console.error('Error adding complaint:', error);
    return NextResponse.json({ error: 'حدث خطأ: ' + String(error) }, { status: 500 });
  }
}

// PUT - تحديث حالة الشكوى
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id) {
      return NextResponse.json({ error: 'معرف الشكوى مطلوب' }, { status: 400 });
    }

    const res = await fetch(`${SUPABASE_URL}/rest/v1/Ticket?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating complaint:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

// DELETE - حذف شكوى
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'معرف الشكوى مطلوب' }, { status: 400 });
    }

    const res = await fetch(`${SUPABASE_URL}/rest/v1/Ticket?id=eq.${id}`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting complaint:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

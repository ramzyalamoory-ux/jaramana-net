import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = 'https://pypomilurmkzlceecukr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_R30YtCj6dqhLwjTQsrR1Uw_tcItK0JV';
const DEBTS_TABLE = 'Debts';

// GET - جلب كل الديون
export async function GET() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${DEBTS_TABLE}?select=*&order=id.desc`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
    });

    if (!res.ok) {
      console.log('Debts table error:', res.status);
      return NextResponse.json([]);
    }

    const data = await res.json();
    return NextResponse.json(Array.isArray(data) ? data : []);
  } catch (error) {
    console.error('Error fetching debts:', error);
    return NextResponse.json([]);
  }
}

// POST - إضافة دين جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Adding debt:', body);

    const { name, phone, address, reason, amount } = body;

    if (!name) {
      return NextResponse.json({ error: 'الاسم مطلوب' }, { status: 400 });
    }

    if (!amount || Number(amount) <= 0) {
      return NextResponse.json({ error: 'المبلغ مطلوب ويجب أن يكون أكبر من صفر' }, { status: 400 });
    }

    // إدراج في جدول Debts
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${DEBTS_TABLE}`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',  // مهم: يرجع الصف المُدرج
      },
      body: JSON.stringify({
        name,
        phone: phone || null,
        address: address || null,
        reason: reason || null,
        amount: Number(amount),
        createdAt: new Date().toISOString(),
      }),
    });

    const responseText = await res.text();
    console.log('Supabase response status:', res.status);
    console.log('Supabase response:', responseText);

    // التحقق من حالة الاستجابة
    if (res.status === 201 || res.ok) {
      // نجح الإدراج
      let data = null;
      try {
        data = responseText ? JSON.parse(responseText) : null;
      } catch {
        // لا يهم إذا فشل parse
      }

      return NextResponse.json({
        success: true,
        message: 'تم إضافة الاستدانة بنجاح',
        data: data
      }, { status: 201 });
    }

    // خطأ في الإدراج
    if (responseText.includes('relation') || responseText.includes('does not exist')) {
      return NextResponse.json({
        error: '⚠️ جدول Debts غير موجود في Supabase!\n\n🔧 اذهب لـ SQL Editor في Supabase ونفذ:\n\nCREATE TABLE "Debts" (\n  id SERIAL PRIMARY KEY,\n  name TEXT NOT NULL,\n  phone TEXT,\n  address TEXT,\n  reason TEXT,\n  amount INTEGER NOT NULL DEFAULT 0,\n  "createdAt" TIMESTAMPTZ DEFAULT NOW()\n);\n\nALTER TABLE "Debts" DISABLE ROW LEVEL SECURITY;'
      }, { status: 500 });
    }

    return NextResponse.json({
      error: 'حدث خطأ: ' + responseText
    }, { status: 500 });

  } catch (error) {
    console.error('Error adding debt:', error);
    return NextResponse.json({ error: 'حدث خطأ: ' + String(error) }, { status: 500 });
  }
}

// DELETE - حذف دين
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'معرف الدين مطلوب' }, { status: 400 });
    }

    const res = await fetch(`${SUPABASE_URL}/rest/v1/${DEBTS_TABLE}?id=eq.${id}`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=minimal',
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'حدث خطأ في الحذف' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'تم الحذف بنجاح' });
  } catch (error) {
    console.error('Error deleting debt:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

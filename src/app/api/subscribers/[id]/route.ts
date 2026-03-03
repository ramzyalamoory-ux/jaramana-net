import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = 'https://pypomilurmkzlceecukr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_R30YtCj6dqhLwjTQsrR1Uw_tcItK0JV';
const TABLE_NAME = 'Subscriber';

// GET - جلب مشترك محدد
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE_NAME}?id=eq.${id}&select=*`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
    });

    const data = await res.json();

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'المشترك غير موجود' }, { status: 404 });
    }

    const s = data[0];
    const formatted = {
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
    };

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Error fetching subscriber:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

// PUT - تحديث مشترك
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    console.log('Updating subscriber:', id, body);

    // تحويل البيانات لتتوافق مع هيكل الجدول
    const updateData: any = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.monthlyFee !== undefined) updateData.monthlyFee = body.monthlyFee;
    if (body.balance !== undefined) updateData.balance = body.balance;
    if (body.pppoeUser !== undefined) updateData.pppoeUser = body.pppoeUser;
    if (body.pppoePassword !== undefined) updateData.pppoePassword = body.pppoePassword;
    if (body.plan !== undefined) updateData.plan = body.plan;
    if (body.status !== undefined) {
      updateData.serviceStatus = body.status;
      updateData.isActive = body.status !== 'suspended';
    }
    if (body.notes !== undefined) updateData.notes = body.notes;

    updateData.updatedAt = new Date().toISOString();

    const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE_NAME}?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(updateData),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('Update error:', data);
      return NextResponse.json({ error: 'حدث خطأ: ' + JSON.stringify(data) }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating subscriber:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء التحديث: ' + String(error) }, { status: 500 });
  }
}

// DELETE - حذف مشترك
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('Deleting subscriber:', id);

    const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE_NAME}?id=eq.${id}`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=minimal',
      },
    });

    if (!res.ok) {
      const error = await res.text();
      console.error('Delete error:', error);
      return NextResponse.json({ error: 'حدث خطأ أثناء الحذف' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting subscriber:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء الحذف: ' + String(error) }, { status: 500 });
  }
}

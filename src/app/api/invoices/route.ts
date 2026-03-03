import { NextRequest, NextResponse } from 'next/server';
import { supabaseFetch, supabaseInsert, isSupabaseConfigured } from '@/lib/supabase';

// GET - جلب الفواتير
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subscriberId = searchParams.get('subscriberId');
    const isPaid = searchParams.get('isPaid');

    if (!isSupabaseConfigured()) {
      return NextResponse.json([]);
    }

    let filter = '';
    if (subscriberId) {
      filter = `subscriberId=eq.${subscriberId}`;
    }
    if (isPaid !== null) {
      filter += filter ? '&' : '';
      filter += `isPaid=eq.${isPaid === 'true'}`;
    }

    const invoices = await supabaseFetch('invoices', {
      select: '*, subscriber(*)',
      filter: filter || undefined,
      order: 'createdAt.desc'
    });

    return NextResponse.json(invoices || []);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json([]);
  }
}

// POST - إضافة فاتورة جديدة
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscriberId, month, amount, notes } = body;

    if (!subscriberId || !month || !amount) {
      return NextResponse.json(
        { error: 'جميع البيانات مطلوبة' },
        { status: 400 }
      );
    }

    // التحقق من عدم وجود فاتورة لنفس الشهر
    const existing = await supabaseFetch('invoices', {
      filter: `subscriberId=eq.${subscriberId}&month=eq.${month}`,
      limit: 1
    });

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: 'يوجد فاتورة لهذا الشهر' },
        { status: 400 }
      );
    }

    const invoice = await supabaseInsert('invoices', {
      subscriberId,
      month,
      amount,
      notes: notes || null,
      isPaid: false,
      dueDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إضافة الفاتورة' },
      { status: 500 }
    );
  }
}

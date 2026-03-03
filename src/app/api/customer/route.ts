import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = 'https://pypomilurmkzlceecukr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_R30YtCj6dqhLwjTQsrR1Uw_tcItK0JV';

const getHeaders = () => ({
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
});

// GET - بيانات الزبون
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get('phone');
  const subscriberId = searchParams.get('id');

  try {
    // البحث عن المشترك
    let filterUrl = `${SUPABASE_URL}/rest/v1/Subscriber?select=*`;
    if (subscriberId) {
      filterUrl += `&id=eq.${subscriberId}`;
    } else if (phone) {
      filterUrl += `&phone=eq.${phone}`;
    } else {
      return NextResponse.json({ error: 'رقم الهاتف أو المعرف مطلوب' }, { status: 400 });
    }

    const res = await fetch(filterUrl, { headers: getHeaders() });
    const subscribers = await res.json();

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json({ error: 'المشترك غير موجود' }, { status: 404 });
    }

    const subscriber = subscribers[0];

    // جلب سجل الدفعات
    const paymentsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/Payment?select=*&subscriberId=eq.${subscriber.id}&order=createdAt.desc&limit=10`,
      { headers: getHeaders() }
    );
    const payments = await paymentsRes.json();

    // جلب شكاوى المشترك
    const ticketsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/Ticket?select=*&phone=eq.${subscriber.phone}&order=createdAt.desc`,
      { headers: getHeaders() }
    );
    const tickets = await ticketsRes.json();

    // حساب الأيام المتبقية
    const now = new Date();
    let daysRemaining = 0;
    let isExpired = false;

    if (subscriber.expiryDate) {
      const expiry = new Date(subscriber.expiryDate);
      daysRemaining = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      isExpired = daysRemaining < 0;
      if (isExpired) daysRemaining = 0;
    }

    return NextResponse.json({
      subscriber: {
        id: subscriber.id,
        name: subscriber.name,
        phone: subscriber.phone,
        address: subscriber.address,
        plan: subscriber.plan,
        monthlyFee: subscriber.monthlyFee,
        balance: subscriber.balance,
        status: subscriber.status,
        paymentStatus: subscriber.paymentStatus,
        expiryDate: subscriber.expiryDate,
        lastRenewalDate: subscriber.lastRenewalDate,
        daysRemaining,
        isExpired,
      },
      payments,
      tickets,
    });

  } catch (error) {
    console.error('Customer data error:', error);
    return NextResponse.json({
      error: 'فشل جلب بيانات المشترك',
      details: error instanceof Error ? error.message : 'خطأ غير معروف',
    }, { status: 500 });
  }
}

// POST - تقديم شكوى أو طلب تجديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, subscriberId, phone } = body;

    // تقديم شكوى
    if (action === 'complaint') {
      const { subject, description, name } = body;

      if (!subject || !description) {
        return NextResponse.json({ error: 'الموضوع والتفاصيل مطلوبة' }, { status: 400 });
      }

      const res = await fetch(`${SUPABASE_URL}/rest/v1/Ticket`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          name: name || 'زبون',
          phone: phone,
          subject,
          description,
          status: 'open',
          createdAt: new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        throw new Error('فشل تقديم الشكوى');
      }

      return NextResponse.json({ success: true, message: 'تم تقديم الشكوى بنجاح' });
    }

    // طلب تجديد
    if (action === 'renewal-request') {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/RenewalRequest`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          subscriberId,
          phone,
          status: 'pending',
          createdAt: new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        throw new Error('فشل تقديم طلب التجديد');
      }

      return NextResponse.json({ success: true, message: 'تم تقديم طلب التجديد بنجاح' });
    }

    return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 });

  } catch (error) {
    console.error('Customer action error:', error);
    return NextResponse.json({
      error: 'فشل تنفيذ العملية',
      details: error instanceof Error ? error.message : 'خطأ غير معروف',
    }, { status: 500 });
  }
}

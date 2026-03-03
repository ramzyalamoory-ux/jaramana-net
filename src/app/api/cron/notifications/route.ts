import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = 'https://pypomilurmkzlceecukr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_R30YtCj6dqhLwjTQsrR1Uw_tcItK0JV';

const getHeaders = () => ({
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
});

// OneSignal Config - من إعدادات المشروع
const ONESIGNAL_APP_ID = '06d9e1b5-7db3-4a75-93a3-e761013786f1';
const ONESIGNAL_API_KEY = 'os_v2_app_a3m6dnl5wnfhle5d45qqcn4g6em62ffp2ucekuvo3oalpj674zkvgohllzamr2gna2wug666kp2q7bfrwpjttsnthifxvv7e3ywm6zy';

// إرسال إشعار عبر OneSignal
async function sendOneSignalNotification(title: string, message: string, includeExternalUserIds?: string[]) {
  try {
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONESIGNAL_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        headings: { en: title, ar: title },
        contents: { en: message, ar: message },
        include_external_user_ids: includeExternalUserIds,
        included_segments: includeExternalUserIds ? undefined : ['All'],
      }),
    });
    return await response.json();
  } catch (error) {
    console.error('OneSignal error:', error);
    return null;
  }
}

// GET - التحقق من التنبيهات وإرسالها
export async function GET(request: NextRequest) {
  const results = {
    expiring3Days: [] as any[],
    expired: [] as any[],
    notificationsSent: 0,
    errors: [] as string[],
  };

  try {
    const now = new Date();
    const threeDaysFromNow = new Date(now);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    // جلب جميع المشتركين
    const res = await fetch(`${SUPABASE_URL}/rest/v1/Subscriber?select=*`, {
      headers: getHeaders(),
    });
    const subscribers = await res.json();

    // 1. المشتركين الذين سينتهي اشتراكهم خلال 3 أيام
    const expiring3Days = subscribers.filter((sub: any) => {
      if (!sub.expiryDate) return false;
      const expiry = new Date(sub.expiryDate);
      return expiry >= now && expiry <= threeDaysFromNow && sub.status !== 'suspended';
    });

    results.expiring3Days = expiring3Days.map((sub: any) => ({
      id: sub.id,
      name: sub.name,
      phone: sub.phone,
      expiryDate: sub.expiryDate,
      daysLeft: Math.ceil((new Date(sub.expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    }));

    // 2. المشتركين المنتهية صلاحيتهم
    const expired = subscribers.filter((sub: any) => {
      if (!sub.expiryDate) return false;
      return new Date(sub.expiryDate) < now && sub.status !== 'suspended';
    });

    results.expired = expired.map((sub: any) => ({
      id: sub.id,
      name: sub.name,
      phone: sub.phone,
      expiryDate: sub.expiryDate,
      daysOverdue: Math.ceil((now.getTime() - new Date(sub.expiryDate).getTime()) / (1000 * 60 * 60 * 24)),
    }));

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      results,
      summary: {
        totalSubscribers: subscribers.length,
        expiringIn3Days: expiring3Days.length,
        expired: expired.length,
      }
    });

  } catch (error) {
    console.error('Notifications check error:', error);
    return NextResponse.json({
      error: 'فشل في التحقق من التنبيهات',
      details: error instanceof Error ? error.message : 'خطأ غير معروف',
    }, { status: 500 });
  }
}

// POST - إرسال إشعارات يدوية
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, subscriberIds, title, message } = body;

    // جلب المشتركين المحددين
    let targetSubscribers = [];
    
    if (type === 'expiring') {
      // المشتركين المنتهية صلاحيتهم خلال 3 أيام
      const now = new Date();
      const threeDaysFromNow = new Date(now);
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

      const res = await fetch(`${SUPABASE_URL}/rest/v1/Subscriber?select=*&expiryDate=gte.${now.toISOString()}&expiryDate=lte.${threeDaysFromNow.toISOString()}`, {
        headers: getHeaders(),
      });
      targetSubscribers = await res.json();
    } else if (type === 'expired') {
      // المشتركين المنتهية صلاحيتهم
      const now = new Date();
      const res = await fetch(`${SUPABASE_URL}/rest/v1/Subscriber?select=*&expiryDate=lt.${now.toISOString()}`, {
        headers: getHeaders(),
      });
      targetSubscribers = await res.json();
    } else if (subscriberIds && Array.isArray(subscriberIds)) {
      // مشتركين محددين
      const res = await fetch(`${SUPABASE_URL}/rest/v1/Subscriber?select=*&id=in.(${subscriberIds.join(',')})`, {
        headers: getHeaders(),
      });
      targetSubscribers = await res.json();
    }

    if (targetSubscribers.length === 0) {
      return NextResponse.json({ error: 'لا يوجد مشتركين للإرسال' }, { status: 400 });
    }

    // إرسال الإشعارات
    const phoneNumbers = targetSubscribers.map((s: any) => s.phone).filter(Boolean);
    
    // تسجيل الإشعارات في قاعدة البيانات
    for (const sub of targetSubscribers) {
      await fetch(`${SUPABASE_URL}/rest/v1/NotificationLog`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          subscriberId: sub.id,
          subscriberName: sub.name,
          type: type || 'manual',
          title: title || 'تذكير',
          message: message || 'يرجى تجديد اشتراكك',
          sentAt: new Date().toISOString(),
          status: 'sent',
        }),
      });
    }

    // إرسال عبر OneSignal (إذا كان معدًا)
    const notificationResult = await sendOneSignalNotification(
      title || 'تنبيه من Jaramana Net',
      message || 'يرجى تجديد اشتراكك',
      phoneNumbers
    );

    return NextResponse.json({
      success: true,
      message: `تم إرسال ${targetSubscribers.length} إشعار`,
      sent: targetSubscribers.length,
      notificationResult,
    });

  } catch (error) {
    console.error('Send notifications error:', error);
    return NextResponse.json({
      error: 'فشل إرسال الإشعارات',
      details: error instanceof Error ? error.message : 'خطأ غير معروف',
    }, { status: 500 });
  }
}

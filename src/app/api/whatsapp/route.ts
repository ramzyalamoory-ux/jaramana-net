import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = 'https://pypomilurmkzlceecukr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_R30YtCj6dqhLwjTQsrR1Uw_tcItK0JV';

const getHeaders = () => ({
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
});

// قوالب رسائل WhatsApp جاهزة
const WHATSAPP_TEMPLATES = [
  {
    id: 'renewal_reminder',
    name: 'تذكير بتجديد الاشتراك',
    template: 'مرحباً {name}،\n\nنود تذكيرك بأن اشتراكك في Jaramana Net سينتهي في {expiryDate}.\n\nيرجى تجديد اشتراكك لضمان استمرار الخدمة.\n\nللاستفسار: {supportPhone}',
    category: 'renewal',
  },
  {
    id: 'subscription_expired',
    name: 'انتهاء الاشتراك',
    template: 'مرحباً {name}،\n\nنود إعلامك بأن اشتراكك في Jaramana Net قد انتهى بتاريخ {expiryDate}.\n\nيرجى التواصل معنا لتجديد الخدمة.\n\nللاستفسار: {supportPhone}',
    category: 'renewal',
  },
  {
    id: 'payment_confirmation',
    name: 'تأكيد الدفع',
    template: 'شكراً لك {name}،\n\nتم استلام دفعتك بمبلغ {amount} ل.س بنجاح.\n\nتاريخ الدفع: {paymentDate}\n\nشكراً لثقتكم بـ Jaramana Net',
    category: 'payment',
  },
  {
    id: 'welcome',
    name: 'ترحيب بمشترك جديد',
    template: 'أهلاً وسهلاً {name} في Jaramana Net! 🎉\n\nتم تفعيل اشتراكك بنجاح.\n\n🔹 السرعة: {plan}\n🔹 تاريخ الانتهاء: {expiryDate}\n\nللاستفسار والدعم: {supportPhone}',
    category: 'welcome',
  },
  {
    id: 'maintenance',
    name: 'إشعار صيانة',
    template: 'إشعار هام 📢\n\nسيتم إجراء صيانة للشبكة بتاريخ {date} من الساعة {time}.\n\nقد يحدث انقطاع مؤقت للخدمة.\n\nنعتذر عن أي إزعاج.',
    category: 'general',
  },
  {
    id: 'offer',
    name: 'عرض خاص',
    template: 'عرض خاص! 🎁\n\n{name}،\n\n{offerDetails}\n\nالعرض ساري حتى {expiryDate}\n\nللاشتراك: {supportPhone}',
    category: 'marketing',
  },
  {
    id: 'debt_reminder',
    name: 'تذكير بالدين',
    template: 'مرحباً {name}،\n\nنود تذكيرك بمبلغ {amount} ل.س المستحق عليك.\n\n{reason}\n\nيرجى التواصل معنا لترتيب الدفع.\n\n{supportPhone}',
    category: 'debt',
  },
];

// GET - جلب القوالب أو سجل الرسائل
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  // جلب قوالب الرسائل
  if (action === 'templates') {
    return NextResponse.json({ templates: WHATSAPP_TEMPLATES });
  }

  // جلب سجل الرسائل المرسلة
  if (action === 'history') {
    const limit = searchParams.get('limit') || '50';
    const res = await fetch(`${SUPABASE_URL}/rest/v1/WhatsAppLog?select=*&order=createdAt.desc&limit=${limit}`, {
      headers: getHeaders(),
    });
    const logs = await res.json();
    return NextResponse.json({ logs });
  }

  return NextResponse.json({ templates: WHATSAPP_TEMPLATES });
}

// POST - إرسال رسالة WhatsApp
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, message, templateId, subscriberIds, category } = body;

    let recipients: { phone: string; name: string; subscriberId?: number }[] = [];

    // تحديد المستلمين
    if (subscriberIds && Array.isArray(subscriberIds)) {
      // مشتركين محددين
      const res = await fetch(`${SUPABASE_URL}/rest/v1/Subscriber?select=*&id=in.(${subscriberIds.join(',')})`, {
        headers: getHeaders(),
      });
      const subscribers = await res.json();
      recipients = subscribers.map((s: any) => ({
        phone: s.phone,
        name: s.name,
        subscriberId: s.id,
      }));
    } else if (category) {
      // فئة معينة
      let filterUrl = `${SUPABASE_URL}/rest/v1/Subscriber?select=*`;
      const now = new Date();

      if (category === 'expired') {
        filterUrl += `&expiryDate=lt.${now.toISOString()}`;
      } else if (category === 'expiring') {
        const threeDays = new Date(now);
        threeDays.setDate(threeDays.getDate() + 3);
        filterUrl += `&expiryDate=gte.${now.toISOString()}&expiryDate=lte.${threeDays.toISOString()}`;
      } else if (category === 'paid') {
        filterUrl += `&paymentStatus=eq.paid`;
      }

      const res = await fetch(filterUrl, { headers: getHeaders() });
      const subscribers = await res.json();
      recipients = subscribers.map((s: any) => ({
        phone: s.phone,
        name: s.name,
        subscriberId: s.id,
      }));
    } else if (phone) {
      // رقم محدد
      recipients = [{ phone, name: body.name || 'زبون' }];
    }

    if (recipients.length === 0) {
      return NextResponse.json({ error: 'لا يوجد مستلمين' }, { status: 400 });
    }

    // تجهيز الرسالة
    let messageToSend = message;
    if (templateId) {
      const template = WHATSAPP_TEMPLATES.find(t => t.id === templateId);
      if (template) {
        messageToSend = template.template;
      }
    }

    // إرسال الرسائل (محاكاة - في الواقع سيتم استخدام WhatsApp Business API)
    const sentMessages = [];
    for (const recipient of recipients) {
      const personalizedMessage = messageToSend
        .replace('{name}', recipient.name)
        .replace('{phone}', recipient.phone);

      // إنشاء رابط WhatsApp
      const whatsappUrl = `https://wa.me/${recipient.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(personalizedMessage)}`;

      // تسجيل في سجل الرسائل
      await fetch(`${SUPABASE_URL}/rest/v1/WhatsAppLog`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          phone: recipient.phone,
          name: recipient.name,
          subscriberId: recipient.subscriberId,
          message: personalizedMessage,
          templateId,
          category: category || 'custom',
          whatsappUrl,
          status: 'sent',
          createdAt: new Date().toISOString(),
        }),
      });

      sentMessages.push({
        phone: recipient.phone,
        name: recipient.name,
        whatsappUrl,
      });
    }

    return NextResponse.json({
      success: true,
      message: `تم تجهيز ${sentMessages.length} رسالة`,
      sentMessages,
      totalSent: sentMessages.length,
    });

  } catch (error) {
    console.error('WhatsApp send error:', error);
    return NextResponse.json({
      error: 'فشل إرسال الرسائل',
      details: error instanceof Error ? error.message : 'خطأ غير معروف',
    }, { status: 500 });
  }
}

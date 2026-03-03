import { NextRequest, NextResponse } from 'next/server';

// OneSignal Configuration
const ONESIGNAL_APP_ID = '06d9e1b5-7db3-4a75-93a3-e761013786f1';
const ONESIGNAL_API_KEY = 'os_v2_app_a3m6dnl5wnfhle5d45qqcn4g6em62ffp2ucekuvo3oalpj674zkvgohllzamr2gna2wug666kp2q7bfrwpjttsnthifxvv7e3ywm6zy';

interface NotificationRequest {
  title: string;
  message: string;
  url?: string;
  segments?: string[];
  includePlayerIds?: string[];
  // إرسال لزبون محدد برقم الهاتف
  targetPhone?: string;
  targetName?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: NotificationRequest = await request.json();
    
    const { title, message, url, segments, includePlayerIds, targetPhone, targetName } = body;
    
    if (!title || !message) {
      return NextResponse.json(
        { error: 'العنوان والرسالة مطلوبان' },
        { status: 400 }
      );
    }

    // بناء payload للإشعار
    const notificationPayload: any = {
      app_id: ONESIGNAL_APP_ID,
      headings: { en: title, ar: title },
      contents: { en: message, ar: message },
      url: url || 'https://jaramanaramzy.vercel.app',
    };

    // إرسال لزبون محدد برقم الهاتف (tag)
    if (targetPhone) {
      notificationPayload.filters = [
        { field: 'tag', key: 'phone', value: targetPhone, relation: '=' }
      ];
    } 
    // إرسال لزبون محدد بالاسم
    else if (targetName) {
      notificationPayload.filters = [
        { field: 'tag', key: 'name', value: targetName, relation: '=' }
      ];
    }
    // إرسال لجميع المشتركين أو لفئة معينة
    else if (includePlayerIds && includePlayerIds.length > 0) {
      notificationPayload.include_player_ids = includePlayerIds;
    } else if (segments && segments.length > 0) {
      notificationPayload.included_segments = segments;
    } else {
      // إرسال للجميع
      notificationPayload.included_segments = ['All'];
    }

    // إرسال الإشعار عبر OneSignal API
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${ONESIGNAL_API_KEY}`,
      },
      body: JSON.stringify(notificationPayload),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('OneSignal error:', result);
      return NextResponse.json(
        { error: result.errors?.[0] || 'فشل إرسال الإشعار' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      id: result.id,
      recipients: result.recipients,
    });

  } catch (error: any) {
    console.error('Notification error:', error);
    return NextResponse.json(
      { error: error.message || 'حدث خطأ أثناء إرسال الإشعار' },
      { status: 500 }
    );
  }
}

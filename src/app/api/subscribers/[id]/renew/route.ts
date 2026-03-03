import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { enablePPPoEUser, getMikroTikConfig } from '@/lib/mikrotik';

// POST - تجديد اشتراك 30 يوم
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { days = 30 } = body;

    const subscriber = await db.subscriber.findUnique({
      where: { id: parseInt(id) },
    });

    if (!subscriber) {
      return NextResponse.json(
        { error: 'المشترك غير موجود' },
        { status: 404 }
      );
    }

    // حساب تاريخ الانتهاء الجديد
    const now = new Date();
    let newExpiryDate: Date;

    if (subscriber.expiryDate && new Date(subscriber.expiryDate) > now) {
      // إذا كان الاشتراك لا يزال ساريًا، أضف الأيام على الباقي
      newExpiryDate = new Date(subscriber.expiryDate);
      newExpiryDate.setDate(newExpiryDate.getDate() + days);
    } else {
      // إذا انتهى الاشتراك، ابدأ من اليوم
      newExpiryDate = new Date();
      newExpiryDate.setDate(newExpiryDate.getDate() + days);
    }

    // تحديث المشترك
    const updated = await db.subscriber.update({
      where: { id: parseInt(id) },
      data: {
        expiryDate: newExpiryDate,
        lastRenewedAt: now,
        serviceStatus: 'active',
        suspendedAt: null,
        isActive: true,
      },
    });

    // تفعيل الخدمة على MikroTik
    if (subscriber.pppoeUser) {
      try {
        const config = await getMikroTikConfig();
        if (config) {
          await enablePPPoEUser(config, subscriber.pppoeUser);
        }
      } catch (error) {
        console.error('Failed to enable PPPoE user:', error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `تم تجديد الاشتراك ${days} يوم`,
      expiryDate: newExpiryDate,
      subscriber: updated,
    });
  } catch (error) {
    console.error('Error renewing subscription:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تجديد الاشتراك' },
      { status: 500 }
    );
  }
}

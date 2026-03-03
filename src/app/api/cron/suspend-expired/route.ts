import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { disablePPPoEUser, getMikroTikConfig } from '@/lib/mikrotik';

// GET - قطع المشتركين المنتهية اشتراكاتهم
// يمكن استدعاؤه يدويًا أو عبر cron job
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    // تحقق بسيط من الأمان (يمكن تحسينه)
    if (secret !== 'jaramana-net-auto-suspend') {
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 401 }
      );
    }

    const now = new Date();

    // البحث عن المشتركين المنتهية اشتراكاتهم
    const expiredSubscribers = await db.subscriber.findMany({
      where: {
        isActive: true,
        serviceStatus: 'active',
        expiryDate: {
          lt: now,
        },
      },
    });

    const config = await getMikroTikConfig();
    const results: { id: number; name: string; pppoeUser: string | null; success: boolean; error?: string }[] = [];

    for (const subscriber of expiredSubscribers) {
      try {
        // تحديث حالة المشترك
        await db.subscriber.update({
          where: { id: subscriber.id },
          data: {
            serviceStatus: 'suspended',
            suspendedAt: now,
            isActive: false,
          },
        });

        // قطع الخدمة على MikroTik
        if (subscriber.pppoeUser && config) {
          await disablePPPoEUser(config, subscriber.pppoeUser);
        }

        results.push({
          id: subscriber.id,
          name: subscriber.name,
          pppoeUser: subscriber.pppoeUser,
          success: true,
        });
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({
          id: subscriber.id,
          name: subscriber.name,
          pppoeUser: subscriber.pppoeUser,
          success: false,
          error: errorMessage,
        });
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      totalExpired: expiredSubscribers.length,
      suspended: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
    });
  } catch (error) {
    console.error('Error in auto-suspend:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء القطع التلقائي' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Get login attempts log
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    const attempts = await db.loginAttempt.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    // Get statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = {
      totalToday: await db.loginAttempt.count({
        where: { createdAt: { gte: today } }
      }),
      failedToday: await db.loginAttempt.count({
        where: { createdAt: { gte: today }, success: false }
      }),
      successToday: await db.loginAttempt.count({
        where: { createdAt: { gte: today }, success: true }
      }),
      uniqueIPsToday: (await db.loginAttempt.findMany({
        where: { createdAt: { gte: today } },
        select: { ip: true },
        distinct: ['ip']
      })).length
    };

    // Get blocked IPs
    const blockedIPs = await db.loginAttempt.groupBy({
      by: ['ip'],
      where: {
        success: false,
        createdAt: {
          gte: new Date(Date.now() - 15 * 60 * 1000)
        }
      },
      _count: true,
      having: {
        ip: { _count: { gte: 5 } }
      }
    });

    return NextResponse.json({
      attempts,
      stats,
      blockedIPs: blockedIPs.map(b => ({ ip: b.ip, attempts: b._count }))
    });

  } catch (error) {
    console.error('Error fetching login attempts:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

// DELETE - Clear old attempts
export async function DELETE(request: NextRequest) {
  try {
    // Delete attempts older than 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const result = await db.loginAttempt.deleteMany({
      where: { createdAt: { lt: sevenDaysAgo } }
    });

    return NextResponse.json({
      success: true,
      deleted: result.count
    });

  } catch (error) {
    console.error('Error clearing attempts:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

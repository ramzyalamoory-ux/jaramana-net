import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = 'https://pypomilurmkzlceecukr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_R30YtCj6dqhLwjTQsrR1Uw_tcItK0JV';

const getHeaders = () => ({
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
});

// MikroTik API Request
async function mikrotikRequest(config: { host: string; port: number; username: string; password: string }, path: string, method: string = 'GET', body?: object) {
  const url = `http://${config.host}:${config.port}/rest${path}`;
  const auth = Buffer.from(`${config.username}:${config.password}`).toString('base64');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000); // 5 ثواني timeout

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`MikroTik Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

// تسجيل حدث في سجل الأحداث
async function logEvent(event: { type: string; deviceId?: number; deviceName?: string; message: string; details?: any }) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/ActivityLog`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        ...event,
        createdAt: new Date().toISOString(),
      }),
    });
  } catch (error) {
    console.error('Failed to log event:', error);
  }
}

// GET - فحص حالة السيرفرات
export async function GET(request: NextRequest) {
  const results = {
    servers: [] as any[],
    totalUptime: 0,
    totalChecks: 0,
    onlineServers: 0,
    offlineServers: 0,
    timestamp: new Date().toISOString(),
  };

  try {
    // جلب جميع أجهزة MikroTik
    const res = await fetch(`${SUPABASE_URL}/rest/v1/MikroTikDevice?select=*`, {
      headers: getHeaders(),
    });
    const devices = await res.json();

    for (const device of devices) {
      const config = {
        host: device.host,
        port: device.port || 8728,
        username: device.username,
        password: device.password,
      };

      let isOnline = false;
      let responseTime = 0;
      let systemInfo = null;
      let error = null;

      try {
        const startTime = Date.now();
        // محاولة جلب معلومات النظام كاختبار اتصال
        systemInfo = await mikrotikRequest(config, '/system/resource');
        responseTime = Date.now() - startTime;
        isOnline = true;
        results.onlineServers++;

        // تحديث حالة الجهاز في قاعدة البيانات
        await fetch(`${SUPABASE_URL}/rest/v1/MikroTikDevice?id=eq.${device.id}`, {
          method: 'PATCH',
          headers: getHeaders(),
          body: JSON.stringify({
            isActive: true,
            lastCheck: new Date().toISOString(),
            responseTime: responseTime,
          }),
        });

        // تسجيل نقطة فحص
        await fetch(`${SUPABASE_URL}/rest/v1/ServerMonitor`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({
            deviceId: device.id,
            deviceName: device.name,
            status: 'online',
            responseTime: responseTime,
            cpu: systemInfo['cpu-load'],
            memory: systemInfo['free-memory'] ? ((systemInfo['total-memory'] - systemInfo['free-memory']) / systemInfo['total-memory'] * 100).toFixed(1) : null,
            uptime: systemInfo.uptime,
            checkedAt: new Date().toISOString(),
          }),
        });

      } catch (e: any) {
        error = e.message || 'فشل الاتصال';
        results.offlineServers++;

        // تحديث حالة الجهاز
        await fetch(`${SUPABASE_URL}/rest/v1/MikroTikDevice?id=eq.${device.id}`, {
          method: 'PATCH',
          headers: getHeaders(),
          body: JSON.stringify({
            isActive: false,
            lastCheck: new Date().toISOString(),
          }),
        });

        // تسجيل نقطة فحص (offline)
        await fetch(`${SUPABASE_URL}/rest/v1/ServerMonitor`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({
            deviceId: device.id,
            deviceName: device.name,
            status: 'offline',
            responseTime: 0,
            checkedAt: new Date().toISOString(),
          }),
        });

        // تسجيل حدث انقطاع
        await logEvent({
          type: 'server_offline',
          deviceId: device.id,
          deviceName: device.name,
          message: `السيرفر ${device.name} غير متصل`,
          details: { error },
        });
      }

      results.servers.push({
        id: device.id,
        name: device.name,
        host: device.host,
        port: device.port,
        isOnline,
        responseTime,
        systemInfo: systemInfo ? {
          cpu: systemInfo['cpu-load'],
          memory: systemInfo['free-memory'],
          totalMemory: systemInfo['total-memory'],
          uptime: systemInfo.uptime,
          version: systemInfo.version,
          boardName: systemInfo['board-name'],
        } : null,
        error,
      });
    }

    // حساب نسبة الاتصال
    results.totalChecks = devices.length;
    results.totalUptime = results.totalChecks > 0 ? (results.onlineServers / results.totalChecks * 100) : 0;

    return NextResponse.json(results);

  } catch (error) {
    console.error('Server monitor error:', error);
    return NextResponse.json({
      error: 'فشل في فحص السيرفرات',
      details: error instanceof Error ? error.message : 'خطأ غير معروف',
    }, { status: 500 });
  }
}

// POST - إرسال تنبيه انقطاع
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deviceId, deviceName, message } = body;

    // تسجيل الحدث
    await logEvent({
      type: 'alert_sent',
      deviceId,
      deviceName,
      message: message || `تم إرسال تنبيه انقطاع السيرفر ${deviceName}`,
    });

    // هنا يمكن إرسال إشعار OneSignal للأدمن
    // TODO: Implement OneSignal notification to admin

    return NextResponse.json({
      success: true,
      message: 'تم إرسال التنبيه',
    });

  } catch (error) {
    return NextResponse.json({
      error: 'فشل إرسال التنبيه',
      details: error instanceof Error ? error.message : 'خطأ غير معروف',
    }, { status: 500 });
  }
}

// DELETE - جلب سجل الأحداث
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '50';
    const deviceId = searchParams.get('deviceId');

    let url = `${SUPABASE_URL}/rest/v1/ActivityLog?select=*&order=createdAt.desc&limit=${limit}`;
    if (deviceId) {
      url += `&deviceId=eq.${deviceId}`;
    }

    const res = await fetch(url, { headers: getHeaders() });
    const logs = await res.json();

    return NextResponse.json({ logs });

  } catch (error) {
    return NextResponse.json({
      error: 'فشل جلب سجل الأحداث',
      details: error instanceof Error ? error.message : 'خطأ غير معروف',
    }, { status: 500 });
  }
}

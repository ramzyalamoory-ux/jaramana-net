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

  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw new Error(`MikroTik Error: ${response.status}`);
  }

  return await response.json();
}

// RADIUS-style Auto Sync
export async function GET(request: NextRequest) {
  const results = {
    checked: 0,
    suspended: 0,
    grace: 0,
    reactivated: 0,
    errors: [] as string[],
  };

  try {
    // 1. Get MikroTik device
    const deviceRes = await fetch(`${SUPABASE_URL}/rest/v1/MikroTikDevice?select=*&isActive=eq.true&isDefault=eq.true`, {
      headers: getHeaders(),
    });
    const devices = await deviceRes.json();

    if (!devices || devices.length === 0) {
      return NextResponse.json({ error: 'لا يوجد سيرفر MikroTik' });
    }

    const device = devices[0];
    const config = {
      host: device.host,
      port: device.port || 8728,
      username: device.username,
      password: device.password,
    };

    // 2. Get all subscribers with PPPoE
    const subscribersRes = await fetch(`${SUPABASE_URL}/rest/v1/Subscriber?select=*&pppoeUser=not.is.null`, {
      headers: getHeaders(),
    });
    const subscribers = await subscribersRes.json();

    // 3. Get PPPoE secrets from MikroTik
    const secrets = await mikrotikRequest(config, '/ppp/secret');
    const secretsMap = new Map(secrets.map((s: Record<string, unknown>) => [s.name, s]));

    const now = new Date();
    const GRACE_PERIOD_DAYS = 3; // مهلة 3 أيام

    // 4. Process each subscriber
    for (const sub of subscribers) {
      results.checked++;
      const secret = secretsMap.get(sub.pppoeUser);
      if (!secret) continue;

      const expiryDate = sub.expiryDate ? new Date(sub.expiryDate) : null;
      const lastRenewal = sub.lastRenewalDate ? new Date(sub.lastRenewalDate) : null;

      // Calculate days since expiry
      let daysOverdue = 0;
      if (expiryDate) {
        daysOverdue = Math.floor((now.getTime() - expiryDate.getTime()) / (1000 * 60 * 60 * 24));
      } else if (lastRenewal) {
        // Assume 30-day subscription
        const expectedExpiry = new Date(lastRenewal);
        expectedExpiry.setDate(expectedExpiry.getDate() + 30);
        daysOverdue = Math.floor((now.getTime() - expectedExpiry.getTime()) / (1000 * 60 * 60 * 24));
      }

      const secretId = secret['.id'];
      const isCurrentlyDisabled = secret.disabled === 'true' || secret.disabled === true;

      // RADIUS Logic
      if (daysOverdue <= 0) {
        // Active subscription
        if (isCurrentlyDisabled) {
          await mikrotikRequest(config, `/ppp/secret/${secretId}`, 'PATCH', { disabled: 'false' });
          results.reactivated++;
          await fetch(`${SUPABASE_URL}/rest/v1/Subscriber?id=eq.${sub.id}`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify({ status: 'active', paymentStatus: 'paid' }),
          });
        }
      } else if (daysOverdue <= GRACE_PERIOD_DAYS) {
        // Grace period
        if (isCurrentlyDisabled) {
          await mikrotikRequest(config, `/ppp/secret/${secretId}`, 'PATCH', { disabled: 'false' });
        }
        results.grace++;
        await fetch(`${SUPABASE_URL}/rest/v1/Subscriber?id=eq.${sub.id}`, {
          method: 'PATCH',
          headers: getHeaders(),
          body: JSON.stringify({ status: 'grace', paymentStatus: 'grace' }),
        });
      } else {
        // Expired - disable
        if (!isCurrentlyDisabled) {
          await mikrotikRequest(config, `/ppp/secret/${secretId}`, 'PATCH', { disabled: 'true' });
          results.suspended++;

          // Disconnect if online
          try {
            const activeUsers = await mikrotikRequest(config, '/ppp/active');
            const activeUser = activeUsers.find((u: Record<string, unknown>) => u.name === sub.pppoeUser);
            if (activeUser && activeUser['.id']) {
              await mikrotikRequest(config, '/ppp/active/remove', 'POST', { '.id': activeUser['.id'] });
            }
          } catch (e) {}

          await fetch(`${SUPABASE_URL}/rest/v1/Subscriber?id=eq.${sub.id}`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify({ status: 'suspended', paymentStatus: 'expired' }),
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'تمت المزامنة بنجاح',
      results,
      timestamp: now.toISOString(),
    });

  } catch (error) {
    console.error('RADIUS sync error:', error);
    return NextResponse.json({
      error: 'فشل المزامنة',
      details: error instanceof Error ? error.message : 'خطأ غير معروف',
      results,
    }, { status: 500 });
  }
}

// Manual actions for single subscriber
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscriberId, action } = body;

    const subRes = await fetch(`${SUPABASE_URL}/rest/v1/Subscriber?id=eq.${subscriberId}&select=*`, {
      headers: getHeaders(),
    });
    const subs = await subRes.json();
    if (!subs || subs.length === 0) {
      return NextResponse.json({ error: 'المشترك غير موجود' }, { status: 404 });
    }
    const sub = subs[0];

    if (!sub.pppoeUser) {
      return NextResponse.json({ error: 'المشترك ليس له حساب PPPoE' }, { status: 400 });
    }

    const deviceRes = await fetch(`${SUPABASE_URL}/rest/v1/MikroTikDevice?select=*&isActive=eq.true&isDefault=eq.true`, {
      headers: getHeaders(),
    });
    const devices = await deviceRes.json();
    if (!devices || devices.length === 0) {
      return NextResponse.json({ error: 'لا يوجد سيرفر MikroTik' }, { status: 404 });
    }

    const device = devices[0];
    const config = {
      host: device.host,
      port: device.port || 8728,
      username: device.username,
      password: device.password,
    };

    const secrets = await mikrotikRequest(config, '/ppp/secret');
    const secret = secrets.find((s: Record<string, unknown>) => s.name === sub.pppoeUser);

    if (!secret) {
      return NextResponse.json({ error: 'حساب PPPoE غير موجود' }, { status: 404 });
    }

    const secretId = secret['.id'];

    if (action === 'renew') {
      const now = new Date();
      
      // حساب تاريخ الانتهاء الجديد
      // لو منتهي: من اليوم + 30 يوم
      // لو ساري: من تاريخ الانتهاء + 30 يوم
      const currentExpiry = sub.expiryDate ? new Date(sub.expiryDate) : null;
      let newExpiry: Date;
      
      if (currentExpiry && currentExpiry > now) {
        // الاشتراك ساري → نضيف 30 يوم على تاريخ الانتهاء
        newExpiry = new Date(currentExpiry);
        newExpiry.setDate(newExpiry.getDate() + 30);
      } else {
        // الاشتراك منتهي أو غير موجود → من اليوم + 30 يوم
        newExpiry = new Date(now);
        newExpiry.setDate(newExpiry.getDate() + 30);
      }

      // تفعيل PPPoE
      await mikrotikRequest(config, `/ppp/secret/${secretId}`, 'PATCH', { disabled: 'false' });

      // تحديث المشترك
      await fetch(`${SUPABASE_URL}/rest/v1/Subscriber?id=eq.${subscriberId}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({
          status: 'active',
          paymentStatus: 'paid',
          lastRenewalDate: now.toISOString(),
          expiryDate: newExpiry.toISOString(),
        }),
      });

      const daysAdded = currentExpiry && currentExpiry > now 
        ? 30 
        : Math.ceil((newExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      return NextResponse.json({ 
        success: true, 
        message: `تم التجديد! الجديد: ${newExpiry.toLocaleDateString('ar')} (+${daysAdded} يوم)`,
        newExpiry: newExpiry.toISOString(),
        daysAdded
      });
    }

    if (action === 'suspend') {
      await mikrotikRequest(config, `/ppp/secret/${secretId}`, 'PATCH', { disabled: 'true' });

      try {
        const activeUsers = await mikrotikRequest(config, '/ppp/active');
        const activeUser = activeUsers.find((u: Record<string, unknown>) => u.name === sub.pppoeUser);
        if (activeUser && activeUser['.id']) {
          await mikrotikRequest(config, '/ppp/active/remove', 'POST', { '.id': activeUser['.id'] });
        }
      } catch (e) {}

      await fetch(`${SUPABASE_URL}/rest/v1/Subscriber?id=eq.${subscriberId}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status: 'suspended', paymentStatus: 'expired' }),
      });

      return NextResponse.json({ success: true, message: 'تم تعليق الخدمة' });
    }

    if (action === 'grace') {
      await mikrotikRequest(config, `/ppp/secret/${secretId}`, 'PATCH', { disabled: 'false' });

      await fetch(`${SUPABASE_URL}/rest/v1/Subscriber?id=eq.${subscriberId}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status: 'grace', paymentStatus: 'grace' }),
      });

      return NextResponse.json({ success: true, message: 'تم منح مهلة' });
    }

    return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 });

  } catch (error) {
    console.error('Manual sync error:', error);
    return NextResponse.json({
      error: 'فشل التنفيذ',
      details: error instanceof Error ? error.message : 'خطأ غير معروف',
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = 'https://pypomilurmkzlceecukr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_R30YtCj6dqhLwjTQsrR1Uw_tcItK0JV';

// Headers for Supabase
const getHeaders = () => ({
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
});

// MikroTik REST API request
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

// GET - Fetch PPPoE users from MikroTik
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('deviceId');

    // Get MikroTik device from Supabase - جلب جميع السيرفرات
    let deviceUrl = `${SUPABASE_URL}/rest/v1/MikroTikDevice?select=*&order=id.asc`;
    if (deviceId) {
      deviceUrl = `${SUPABASE_URL}/rest/v1/MikroTikDevice?select=*&id=eq.${deviceId}`;
    }

    const deviceRes = await fetch(deviceUrl, { headers: getHeaders() });
    const devices = await deviceRes.json();

    console.log('Found devices:', devices?.length || 0);

    // البحث عن سيرفر نشط (isDefault أو isActive)
    let device = null;
    if (devices && devices.length > 0) {
      // أولاً البحث عن الافتراضي
      device = devices.find((d: any) => d.isDefault === true || d.isDefault === 'true');
      // إذا لم يوجد، البحث عن أي سيرفر نشط
      if (!device) {
        device = devices.find((d: any) => d.isActive === true || d.isActive === 'true');
      }
      // إذا لم يوجد، أخذ أول سيرفر
      if (!device) {
        device = devices[0];
      }
    }

    if (!device) {
      return NextResponse.json({ 
        error: 'لا يوجد سيرفر MikroTik',
        hint: 'أضف سيرفر من تبويب MikroTik',
        devicesFound: devices?.length || 0
      }, { status: 404 });
    }
    const config = {
      host: device.host,
      port: device.port || 8728,
      username: device.username,
      password: device.password,
    };

    // Fetch PPPoE secrets (all users)
    const secrets = await mikrotikRequest(config, '/ppp/secret');

    // Fetch active connections
    const activeUsers = await mikrotikRequest(config, '/ppp/active');
    const activeNames = new Set(activeUsers.map((u: Record<string, unknown>) => u.name));

    // Get PPPoE Profiles to fetch rate limits
    const profiles = await mikrotikRequest(config, '/ppp/profile');
    const profileMap = new Map(profiles.map((p: Record<string, unknown>) => [p.name, p]));

    // Combine data with session info and speed
    const pppoeUsers = secrets.map((secret: Record<string, unknown>) => {
      const session = activeUsers.find((u: Record<string, unknown>) => u.name === secret.name);
      const profileData = profileMap.get(secret.profile) as Record<string, unknown> | undefined;

      return {
        name: secret.name,
        password: secret.password,
        profile: secret.profile,
        service: secret.service,
        disabled: secret.disabled === 'true' || secret.disabled === true,
        localAddress: secret['local-address'],
        remoteAddress: secret['remote-address'],
        isOnline: !!session,
        // Session details
        session: session ? {
          uptime: session.uptime || null,
          bytesIn: session['bytes-in'] || 0,
          bytesOut: session['bytes-out'] || 0,
          packetsIn: session['packets-in'] || 0,
          packetsOut: session['packets-out'] || 0,
          callerId: session['caller-id'] || null,
          encoding: session.encoding || null,
        } : null,
        // Speed from profile rate-limit
        rateLimit: profileData?.['rate-limit'] || null,
      };
    });

    // Get subscribers from Supabase to link
    const subscribersRes = await fetch(`${SUPABASE_URL}/rest/v1/Subscriber?select=id,name,phone,pppoeUser`, { headers: getHeaders() });
    const subscribers = await subscribersRes.json();

    // Create a map of pppoeUser -> subscriber
    const subscriberMap = new Map();
    subscribers.forEach((sub: Record<string, unknown>) => {
      if (sub.pppoeUser) {
        subscriberMap.set(sub.pppoeUser, sub);
      }
    });

    // Link PPPoE users with subscribers
    const linkedUsers = pppoeUsers.map((user: Record<string, unknown>) => ({
      ...user,
      subscriber: subscriberMap.get(user.name) || null,
    }));

    return NextResponse.json({
      device: { id: device.id, name: device.name, host: device.host },
      users: linkedUsers,
      total: linkedUsers.length,
      online: linkedUsers.filter((u: Record<string, unknown>) => u.isOnline).length,
      offline: linkedUsers.filter((u: Record<string, unknown>) => !u.isOnline).length,
    });

  } catch (error) {
    console.error('PPPoE fetch error:', error);
    return NextResponse.json({
      error: 'فشل الاتصال بـ MikroTik',
      details: error instanceof Error ? error.message : 'خطأ غير معروف'
    }, { status: 500 });
  }
}

// POST - Action on PPPoE user (enable/disable/disconnect)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, username, deviceId } = body;

    // Get MikroTik device
    let deviceUrl = `${SUPABASE_URL}/rest/v1/MikroTikDevice?select=*&isActive=eq.true`;
    if (deviceId) {
      deviceUrl += `&id=eq.${deviceId}`;
    } else {
      deviceUrl += `&isDefault=eq.true`;
    }

    const deviceRes = await fetch(deviceUrl, { headers: getHeaders() });
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

    if (action === 'disconnect') {
      const activeUsers = await mikrotikRequest(config, '/ppp/active');
      const user = activeUsers.find((u: Record<string, unknown>) => u.name === username);

      if (user && user['.id']) {
        await mikrotikRequest(config, '/ppp/active/remove', 'POST', { '.id': user['.id'] });
        return NextResponse.json({ success: true, message: 'تم قطع الاتصال' });
      }
      return NextResponse.json({ error: 'المستخدم غير متصل' }, { status: 400 });
    }

    if (action === 'disable') {
      const secrets = await mikrotikRequest(config, '/ppp/secret');
      const secret = secrets.find((s: Record<string, unknown>) => s.name === username);

      if (secret && secret['.id']) {
        await mikrotikRequest(config, `/ppp/secret/${secret['.id']}`, 'PATCH', { disabled: 'true' });

        // Also disconnect if online
        const activeUsers = await mikrotikRequest(config, '/ppp/active');
        const user = activeUsers.find((u: Record<string, unknown>) => u.name === username);
        if (user && user['.id']) {
          await mikrotikRequest(config, '/ppp/active/remove', 'POST', { '.id': user['.id'] });
        }

        return NextResponse.json({ success: true, message: 'تم إيقاف الخدمة' });
      }
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    }

    if (action === 'enable') {
      const secrets = await mikrotikRequest(config, '/ppp/secret');
      const secret = secrets.find((s: Record<string, unknown>) => s.name === username);

      if (secret && secret['.id']) {
        await mikrotikRequest(config, `/ppp/secret/${secret['.id']}`, 'PATCH', { disabled: 'false' });
        return NextResponse.json({ success: true, message: 'تم تفعيل الخدمة' });
      }
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    }

    if (action === 'change-profile') {
      const { profile } = body;
      if (!profile) {
        return NextResponse.json({ error: 'الـ Profile مطلوب' }, { status: 400 });
      }
      
      const secrets = await mikrotikRequest(config, '/ppp/secret');
      const secret = secrets.find((s: Record<string, unknown>) => s.name === username);

      if (secret && secret['.id']) {
        await mikrotikRequest(config, `/ppp/secret/${secret['.id']}`, 'PATCH', { profile });
        
        // Also disconnect to apply new profile
        const activeUsers = await mikrotikRequest(config, '/ppp/active');
        const user = activeUsers.find((u: Record<string, unknown>) => u.name === username);
        if (user && user['.id']) {
          await mikrotikRequest(config, '/ppp/active/remove', 'POST', { '.id': user['.id'] });
        }
        
        return NextResponse.json({ success: true, message: `تم تغيير السرعة إلى ${profile}` });
      }
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    }

    if (action === 'change-password') {
      const { newPassword } = body;
      if (!newPassword) {
        return NextResponse.json({ error: 'كلمة السر الجديدة مطلوبة' }, { status: 400 });
      }
      
      const secrets = await mikrotikRequest(config, '/ppp/secret');
      const secret = secrets.find((s: Record<string, unknown>) => s.name === username);

      if (secret && secret['.id']) {
        await mikrotikRequest(config, `/ppp/secret/${secret['.id']}`, 'PATCH', { password: newPassword });
        return NextResponse.json({ success: true, message: 'تم تغيير كلمة السر' });
      }
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    }

    if (action === 'get-profiles') {
      const profiles = await mikrotikRequest(config, '/ppp/profile');
      return NextResponse.json({ 
        profiles: profiles.map((p: Record<string, unknown>) => ({
          name: p.name,
          localAddress: p['local-address'],
          remoteAddress: p['remote-address'],
          rateLimit: p['rate-limit'],
        }))
      });
    }

    // ===== ميزات جديدة =====

    // إنشاء حساب PPPoE جديد
    if (action === 'create') {
      const { password, profile, subscriberId } = body;
      
      if (!username || !password) {
        return NextResponse.json({ error: 'اسم المستخدم وكلمة السر مطلوبان' }, { status: 400 });
      }

      // التحقق من عدم وجود المستخدم
      const secrets = await mikrotikRequest(config, '/ppp/secret');
      const existingUser = secrets.find((s: Record<string, unknown>) => s.name === username);
      
      if (existingUser) {
        return NextResponse.json({ error: 'اسم المستخدم موجود مسبقاً' }, { status: 400 });
      }

      // إنشاء الحساب
      await mikrotikRequest(config, '/ppp/secret', 'POST', {
        name: username,
        password: password,
        profile: profile || 'default',
        service: 'pppoe',
        disabled: 'false',
      });

      // رط الحساب بالمشترك إذا تم تحديده
      if (subscriberId) {
        await fetch(`${SUPABASE_URL}/rest/v1/Subscriber?id=eq.${subscriberId}`, {
          method: 'PATCH',
          headers: getHeaders(),
          body: JSON.stringify({
            pppoeUser: username,
            pppoePassword: password,
          }),
        });
      }

      return NextResponse.json({ 
        success: true, 
        message: `تم إنشاء حساب ${username} بنجاح`,
        user: { username, password, profile }
      });
    }

    // حذف حساب PPPoE
    if (action === 'delete') {
      const secrets = await mikrotikRequest(config, '/ppp/secret');
      const secret = secrets.find((s: Record<string, unknown>) => s.name === username);

      if (!secret) {
        return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
      }

      // قطع الاتصال أولاً إذا كان متصلاً
      try {
        const activeUsers = await mikrotikRequest(config, '/ppp/active');
        const user = activeUsers.find((u: Record<string, unknown>) => u.name === username);
        if (user && user['.id']) {
          await mikrotikRequest(config, '/ppp/active/remove', 'POST', { '.id': user['.id'] });
        }
      } catch (e) {}

      // حذف الحساب
      await mikrotikRequest(config, `/ppp/secret/${secret['.id']}`, 'DELETE');

      // إزالة الربط من المشترك
      await fetch(`${SUPABASE_URL}/rest/v1/Subscriber?pppoeUser=eq.${username}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({
          pppoeUser: null,
          pppoePassword: null,
        }),
      });

      return NextResponse.json({ success: true, message: `تم حذف حساب ${username}` });
    }

    // استنساخ حساب PPPoE
    if (action === 'clone') {
      const { newUsername, newPassword, newProfile } = body;

      if (!newUsername) {
        return NextResponse.json({ error: 'اسم المستخدم الجديد مطلوب' }, { status: 400 });
      }

      // جلب بيانات الحساب الأصلي
      const secrets = await mikrotikRequest(config, '/ppp/secret');
      const originalSecret = secrets.find((s: Record<string, unknown>) => s.name === username);

      if (!originalSecret) {
        return NextResponse.json({ error: 'الحساب الأصلي غير موجود' }, { status: 404 });
      }

      // التحقق من عدم وجود الحساب الجديد
      const existingUser = secrets.find((s: Record<string, unknown>) => s.name === newUsername);
      if (existingUser) {
        return NextResponse.json({ error: 'اسم المستخدم الجديد موجود مسبقاً' }, { status: 400 });
      }

      // إنشاء الحساب الجديد
      const newSecret = {
        name: newUsername,
        password: newPassword || originalSecret.password,
        profile: newProfile || originalSecret.profile,
        service: originalSecret.service || 'pppoe',
        disabled: 'false',
      };

      await mikrotikRequest(config, '/ppp/secret', 'POST', newSecret);

      return NextResponse.json({ 
        success: true, 
        message: `تم استنساخ الحساب باسم ${newUsername}`,
        user: newSecret
      });
    }

    // إعادة تعيين كلمة السر
    if (action === 'reset-password') {
      const { newPassword } = body;
      const generatedPassword = newPassword || Math.random().toString(36).slice(-8);

      const secrets = await mikrotikRequest(config, '/ppp/secret');
      const secret = secrets.find((s: Record<string, unknown>) => s.name === username);

      if (!secret) {
        return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
      }

      await mikrotikRequest(config, `/ppp/secret/${secret['.id']}`, 'PATCH', { password: generatedPassword });

      // تحديث كلمة السر في قاعدة البيانات
      await fetch(`${SUPABASE_URL}/rest/v1/Subscriber?pppoeUser=eq.${username}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ pppoePassword: generatedPassword }),
      });

      // قطع الاتصال لإجبار إعادة الاتصال
      try {
        const activeUsers = await mikrotikRequest(config, '/ppp/active');
        const user = activeUsers.find((u: Record<string, unknown>) => u.name === username);
        if (user && user['.id']) {
          await mikrotikRequest(config, '/ppp/active/remove', 'POST', { '.id': user['.id'] });
        }
      } catch (e) {}

      return NextResponse.json({ 
        success: true, 
        message: 'تم إعادة تعيين كلمة السر',
        newPassword: generatedPassword
      });
    }

    return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 });

  } catch (error) {
    console.error('PPPoE action error:', error);
    return NextResponse.json({
      error: 'فشل تنفيذ العملية',
      details: error instanceof Error ? error.message : 'خطأ غير معروف'
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { 
  testMikroTikConnection, 
  getPPPoEActiveUsers, 
  getPPPoESecrets,
  disconnectPPPoEUser,
  togglePPPoEUser,
  enablePPPoEUser,
  disablePPPoEUser,
  parseUptime,
  formatBytes
} from '@/lib/mikrotik';

// GET - جلب معلومات MikroTik
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // جلب إعدادات MikroTik
    const device = await db.mikroTikDevice.findFirst({
      where: { isDefault: true, isActive: true }
    });

    if (!device) {
      return NextResponse.json({ 
        error: 'لم يتم إعداد جهاز MikroTik',
        needsSetup: true 
      });
    }

    const config = {
      host: device.host,
      port: device.port,
      username: device.username,
      password: device.password,
    };

    if (action === 'test') {
      // دعم اختبار جهاز معين
      const deviceIdParam = searchParams.get('deviceId');
      let testConfig = config;

      if (deviceIdParam) {
        const specificDevice = await db.mikroTikDevice.findUnique({
          where: { id: parseInt(deviceIdParam) }
        });
        if (specificDevice) {
          testConfig = {
            host: specificDevice.host,
            port: specificDevice.port,
            username: specificDevice.username,
            password: specificDevice.password,
          };
        }
      }

      const result = await testMikroTikConnection(testConfig);
      return NextResponse.json(result);
    }

    if (action === 'active-users') {
      const activeUsers = await getPPPoEActiveUsers(config);
      return NextResponse.json(activeUsers);
    }

    if (action === 'secrets') {
      const secrets = await getPPPoESecrets(config);
      return NextResponse.json(secrets);
    }

    if (action === 'status') {
      // جلب كل السيرفرات النشطة
      const allDevices = await db.mikroTikDevice.findMany({
        where: { isActive: true }
      });

      let totalOnline = 0;
      let allActiveUsers: Array<{
        name: string;
        address: string;
        uptime: string;
        uptimeSeconds: number;
        bytesIn: number;
        bytesOut: number;
        bytesInFormatted: string;
        bytesOutFormatted: string;
        deviceId: number;
        deviceName: string;
      }> = [];

      // جلب المستخدمين من كل سيرفر
      for (const dev of allDevices) {
        try {
          const devConfig = {
            host: dev.host,
            port: dev.port,
            username: dev.username,
            password: dev.password,
          };
          const users = await getPPPoEActiveUsers(devConfig);
          allActiveUsers.push(...users.map(u => ({
            ...u,
            uptimeSeconds: parseUptime(u.uptime),
            bytesInFormatted: formatBytes(u.bytesIn),
            bytesOutFormatted: formatBytes(u.bytesOut),
            deviceId: dev.id,
            deviceName: dev.name,
          })));
          totalOnline += users.length;
        } catch (error) {
          console.error(`Error fetching from device ${dev.name}:`, error);
        }
      }

      // جلب كل المشتركين
      const subscribers = await db.subscriber.findMany({
        where: { pppoeUser: { not: null } },
        select: { id: true, name: true, pppoeUser: true, ipAddress: true, mikrotikDeviceId: true }
      });

      // تحديث حالة الاتصال للمشتركين
      const updates: Promise<unknown>[] = [];
      for (const sub of subscribers) {
        const activeUser = allActiveUsers.find(u => u.name === sub.pppoeUser);

        if (activeUser) {
          updates.push(
            db.subscriber.update({
              where: { id: sub.id },
              data: {
                isOnline: true,
                lastSeen: new Date(),
                ipAddress: activeUser.address,
                mikrotikDeviceId: activeUser.deviceId,
              }
            })
          );
        } else {
          updates.push(
            db.subscriber.update({
              where: { id: sub.id },
              data: { isOnline: false }
            })
          );
        }
      }

      if (updates.length > 0) {
        await Promise.all(updates);
      }

      // إحصائيات
      const stats = {
        totalSubscribers: subscribers.length,
        online: totalOnline,
        offline: subscribers.length - totalOnline,
        activeUsers: allActiveUsers,
        devices: allDevices.map(d => ({
          id: d.id,
          name: d.name,
          host: d.host,
          isDefault: d.isDefault,
          online: allActiveUsers.filter(u => u.deviceId === d.id).length,
        })),
      };

      return NextResponse.json(stats);
    }

    // جلب قائمة الأجهزة
    const devices = await db.mikroTikDevice.findMany();
    return NextResponse.json(devices);

  } catch (error) {
    console.error('MikroTik API error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

// POST - إضافة جهاز MikroTik جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, host, port, username, password, isDefault } = body;

    if (!name || !host || !username || !password) {
      return NextResponse.json({ error: 'جميع البيانات مطلوبة' }, { status: 400 });
    }

    // إذا كان الجهاز الافتراضي، إلغاء تعيين الأجهزة الأخرى
    if (isDefault) {
      await db.mikroTikDevice.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      });
    }

    const device = await db.mikroTikDevice.create({
      data: {
        name,
        host,
        port: port || 8728,
        username,
        password,
        isDefault: isDefault || false,
      }
    });

    return NextResponse.json(device, { status: 201 });
  } catch (error) {
    console.error('Error creating MikroTik device:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

// PUT - تحديث أو قطع اتصال
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, username, deviceId, enable } = body;

    const device = await db.mikroTikDevice.findFirst({
      where: { id: deviceId, isActive: true }
    }) || await db.mikroTikDevice.findFirst({
      where: { isDefault: true, isActive: true }
    });

    if (!device) {
      return NextResponse.json({ error: 'جهاز MikroTik غير موجود' }, { status: 404 });
    }

    const config = {
      host: device.host,
      port: device.port,
      username: device.username,
      password: device.password,
    };

    if (action === 'disconnect' && username) {
      const success = await disconnectPPPoEUser(config, username);
      if (success) {
        // تحديث حالة المشترك
        await db.subscriber.updateMany({
          where: { pppoeUser: username },
          data: { isOnline: false }
        });
        
        // إضافة سجل انقطاع
        const sub = await db.subscriber.findFirst({
          where: { pppoeUser: username }
        });
        
        if (sub) {
          await db.connectionLog.create({
            data: {
              subscriberId: sub.id,
              action: 'disconnect',
            }
          });
        }
      }
      return NextResponse.json({ success });
    }

    if (action === 'toggle' && username) {
      const success = await togglePPPoEUser(config, username, enable);
      return NextResponse.json({ success });
    }

    // تفعيل/إيقاف الخدمة
    if (action === 'enable-service' && username) {
      const success = await enablePPPoEUser(config, username);
      if (success) {
        await db.subscriber.updateMany({
          where: { pppoeUser: username },
          data: { 
            serviceStatus: 'active',
            isActive: true,
            suspendedAt: null
          }
        });
      }
      return NextResponse.json({ success });
    }

    if (action === 'disable-service' && username) {
      const success = await disablePPPoEUser(config, username);
      if (success) {
        await db.subscriber.updateMany({
          where: { pppoeUser: username },
          data: { 
            serviceStatus: 'suspended',
            isActive: false,
            suspendedAt: new Date(),
            isOnline: false
          }
        });
      }
      return NextResponse.json({ success });
    }

    // وضع المهلة (Grace Period)
    if (action === 'grace' && username) {
      const success = await enablePPPoEUser(config, username);
      if (success) {
        await db.subscriber.updateMany({
          where: { pppoeUser: username },
          data: {
            serviceStatus: 'grace',
            isActive: true,
            suspendedAt: null
          }
        });
      }
      return NextResponse.json({ success });
    }

    // تعيين جهاز كافتراضي
    if (action === 'set-default' && deviceId) {
      // إلغاء تعيين جميع الأجهزة الأخرى
      await db.mikroTikDevice.updateMany({
        data: { isDefault: false }
      });

      // تعيين الجهاز المحدد كافتراضي
      await db.mikroTikDevice.update({
        where: { id: deviceId },
        data: { isDefault: true }
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 });
  } catch (error) {
    console.error('MikroTik action error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

// DELETE - حذف جهاز
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'معرف الجهاز مطلوب' }, { status: 400 });
    }

    await db.mikroTikDevice.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting device:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getPPPoESecrets, getPPPoEProfiles } from '@/lib/mikrotik';

// POST - استيراد المشتركين من MikroTik
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deviceId, importAll, selectedUsers, defaultFee } = body;

    const device = await db.mikroTikDevice.findFirst({
      where: deviceId ? { id: deviceId } : { isDefault: true, isActive: true }
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

    // جلب المستخدمين من MikroTik
    const secrets = await getPPPoESecrets(config);
    
    if (secrets.length === 0) {
      return NextResponse.json({ error: 'لا يوجد مستخدمين PPPoE في MikroTik' }, { status: 400 });
    }

    // جلب المشتركين الموجودين
    const existingSubscribers = await db.subscriber.findMany({
      where: { pppoeUser: { not: null } },
      select: { pppoeUser: true }
    });
    const existingPppoeUsers = existingSubscribers.map(s => s.pppoeUser);

    // تحديد المستخدمين للاستيراد
    let usersToImport = secrets.filter(s => !existingPppoeUsers.includes(s.name));
    
    if (!importAll && selectedUsers) {
      usersToImport = usersToImport.filter(s => selectedUsers.includes(s.name));
    }

    if (usersToImport.length === 0) {
      return NextResponse.json({ 
        message: 'جميع المستخدمين موجودون بالفعل',
        imported: 0,
        skipped: secrets.length 
      });
    }

    // استيراد المستخدمين
    let imported = 0;
    let failed = 0;

    for (const user of usersToImport) {
      try {
        await db.subscriber.create({
          data: {
            name: user.name,
            phone: '0000000000',
            pppoeUser: user.name,
            ipAddress: user.remoteAddress || null,
            monthlyFee: defaultFee || 0,
            isActive: !user.disabled,
          }
        });
        imported++;
      } catch (error) {
        console.error(`Failed to import user ${user.name}:`, error);
        failed++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `تم استيراد ${imported} مشترك`,
      imported,
      failed,
      total: secrets.length,
      skipped: existingPppoeUsers.length,
    });

  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء الاستيراد' }, { status: 500 });
  }
}

// GET - معاينة المستخدمين للاستيراد
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('deviceId');

    const device = await db.mikroTikDevice.findFirst({
      where: deviceId ? { id: parseInt(deviceId) } : { isDefault: true, isActive: true }
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

    // جلب المستخدمين من MikroTik
    const secrets = await getPPPoESecrets(config);
    
    // جلب المشتركين الموجودين
    const existingSubscribers = await db.subscriber.findMany({
      where: { pppoeUser: { not: null } },
      select: { pppoeUser: true }
    });
    const existingPppoeUsers = existingSubscribers.map(s => s.pppoeUser);

    // تصنيف المستخدمين
    const newUsers = secrets.filter(s => !existingPppoeUsers.includes(s.name));
    const existingUsers = secrets.filter(s => existingPppoeUsers.includes(s.name));

    // جلب البروفايلات
    const profiles = await getPPPoEProfiles(config);

    return NextResponse.json({
      total: secrets.length,
      newUsers: newUsers.map(u => ({
        name: u.name,
        profile: u.profile,
        remoteAddress: u.remoteAddress,
        disabled: u.disabled
      })),
      existingUsers: existingUsers.map(u => ({
        name: u.name,
        alreadyImported: true
      })),
      profiles
    });

  } catch (error) {
    console.error('Preview error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

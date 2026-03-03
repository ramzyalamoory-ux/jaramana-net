// MikroTik API Library
// يتطلب تفعيل API في MikroTik: /ip service enable api

import { db } from './db';

interface MikroTikConfig {
  host: string;
  port: number;
  username: string;
  password: string;
}

interface PPPoEUser {
  name: string;
  address: string;
  macAddress: string;
  uptime: string;
  bytesIn: number;
  bytesOut: number;
  callerId: string;
}

interface PPPoESecret {
  name: string;
  password: string;
  profile: string;
  service: string;
  disabled: boolean;
  localAddress?: string;
  remoteAddress?: string;
}

// جلب إعدادات MikroTik الافتراضية
export async function getMikroTikConfig(): Promise<MikroTikConfig | null> {
  try {
    const device = await db.mikroTikDevice.findFirst({
      where: { isDefault: true, isActive: true }
    });
    
    if (!device) return null;
    
    return {
      host: device.host,
      port: device.port,
      username: device.username,
      password: device.password,
    };
  } catch (error) {
    console.error('Error getting MikroTik config:', error);
    return null;
  }
}

// دالة للاتصال بـ MikroTik عبر REST API (RouterOS 7+)
export async function mikrotikRequest(
  config: MikroTikConfig,
  path: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'GET',
  body?: object
) {
  const url = `http://${config.host}:${config.port}/rest${path}`;
  
  const auth = Buffer.from(`${config.username}:${config.password}`).toString('base64');
  
  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`MikroTik API Error: ${response.status} - ${text}`);
    }

    return await response.json();
  } catch (error) {
    console.error('MikroTik connection error:', error);
    throw error;
  }
}

// جلب المشتركين المتصلين PPPoE
export async function getPPPoEActiveUsers(config: MikroTikConfig): Promise<PPPoEUser[]> {
  try {
    const users = await mikrotikRequest(config, '/ppp/active');
    return users.map((user: Record<string, unknown>) => ({
      name: user.name as string,
      address: user.address as string,
      macAddress: (user['caller-id'] as string) || '',
      uptime: user.uptime as string,
      bytesIn: (user['bytes-in'] as number) || 0,
      bytesOut: (user['bytes-out'] as number) || 0,
      callerId: user['caller-id'] as string,
    }));
  } catch (error) {
    console.error('Error fetching PPPoE active users:', error);
    return [];
  }
}

// جلب جميع أسماء المستخدمين PPPoE
export async function getPPPoESecrets(config: MikroTikConfig): Promise<PPPoESecret[]> {
  try {
    const secrets = await mikrotikRequest(config, '/ppp/secret');
    return secrets.map((secret: Record<string, unknown>) => ({
      name: secret.name as string,
      password: secret.password as string,
      profile: secret.profile as string,
      service: secret.service as string,
      disabled: secret.disabled === 'true' || secret.disabled === true,
      localAddress: secret['local-address'] as string,
      remoteAddress: secret['remote-address'] as string,
    }));
  } catch (error) {
    console.error('Error fetching PPPoE secrets:', error);
    return [];
  }
}

// قطع اتصال مستخدم PPPoE
export async function disconnectPPPoEUser(config: MikroTikConfig, username: string): Promise<boolean> {
  try {
    // البحث عن المستخدم النشط
    const users = await mikrotikRequest(config, '/ppp/active');
    const user = users.find((u: Record<string, unknown>) => u.name === username);
    
    if (user && user['.id']) {
      await mikrotikRequest(config, '/ppp/active/remove', 'POST', {
        '.id': user['.id']
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error disconnecting user:', error);
    return false;
  }
}

// تفعيل/تعطيل مستخدم PPPoE
export async function togglePPPoEUser(config: MikroTikConfig, username: string, enable: boolean): Promise<boolean> {
  try {
    const secrets = await mikrotikRequest(config, '/ppp/secret');
    const secret = secrets.find((s: Record<string, unknown>) => s.name === username);
    
    if (secret && secret['.id']) {
      await mikrotikRequest(config, `/ppp/secret/${secret['.id']}`, 'PATCH', {
        disabled: enable ? 'false' : 'true'
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error toggling user:', error);
    return false;
  }
}

// جلب إحصائيات الواجهات
export async function getInterfaceStats(config: MikroTikConfig) {
  try {
    const interfaces = await mikrotikRequest(config, '/interface');
    return interfaces.map((iface: Record<string, unknown>) => ({
      name: iface.name as string,
      type: iface.type as string,
      running: iface.running === 'true' || iface.running === true,
      disabled: iface.disabled === 'true' || iface.disabled === true,
      rxBytes: iface['rx-byte'] as number || 0,
      txBytes: iface['tx-byte'] as number || 0,
    }));
  } catch (error) {
    console.error('Error fetching interface stats:', error);
    return [];
  }
}

// اختبار الاتصال بـ MikroTik
export async function testMikroTikConnection(config: MikroTikConfig): Promise<{ success: boolean; message: string; routerName?: string }> {
  try {
    const identity = await mikrotikRequest(config, '/system/identity');
    return {
      success: true,
      message: 'تم الاتصال بنجاح',
      routerName: identity[0]?.name as string || 'Unknown',
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'فشل الاتصال',
    };
  }
}

// تحويل مدة MikroTik إلى ثواني
export function parseUptime(uptime: string): number {
  if (!uptime) return 0;
  
  let seconds = 0;
  const weeks = uptime.match(/(\d+)w/);
  const days = uptime.match(/(\d+)d/);
  const hours = uptime.match(/(\d+)h/);
  const minutes = uptime.match(/(\d+)m/);
  const secs = uptime.match(/(\d+)s/);
  
  if (weeks) seconds += parseInt(weeks[1]) * 7 * 24 * 60 * 60;
  if (days) seconds += parseInt(days[1]) * 24 * 60 * 60;
  if (hours) seconds += parseInt(hours[1]) * 60 * 60;
  if (minutes) seconds += parseInt(minutes[1]) * 60;
  if (secs) seconds += parseInt(secs[1]);
  
  return seconds;
}

// تنسيق البايت
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// جلب PPPoE Profiles
export async function getPPPoEProfiles(config: MikroTikConfig): Promise<string[]> {
  try {
    const profiles = await mikrotikRequest(config, '/ppp/profile');
    return profiles.map((p: Record<string, unknown>) => p.name as string);
  } catch (error) {
    console.error('Error fetching profiles:', error);
    return [];
  }
}

// إضافة مستخدم PPPoE جديد
export async function addPPPoEUser(
  config: MikroTikConfig, 
  username: string, 
  password: string, 
  profile: string = 'default',
  localAddress?: string,
  remoteAddress?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const data: Record<string, unknown> = {
      name: username,
      password: password,
      profile: profile,
      service: 'pppoe',
    };
    
    if (localAddress) data['local-address'] = localAddress;
    if (remoteAddress) data['remote-address'] = remoteAddress;
    
    await mikrotikRequest(config, '/ppp/secret', 'POST', data);
    return { success: true, message: 'تم إضافة المستخدم بنجاح' };
  } catch (error) {
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'حدث خطأ' 
    };
  }
}

// تحديث مستخدم PPPoE
export async function updatePPPoEUser(
  config: MikroTikConfig,
  username: string,
  updates: { password?: string; profile?: string; disabled?: boolean }
): Promise<boolean> {
  try {
    const secrets = await mikrotikRequest(config, '/ppp/secret');
    const secret = secrets.find((s: Record<string, unknown>) => s.name === username);
    
    if (secret && secret['.id']) {
      const data: Record<string, unknown> = {};
      if (updates.password) data.password = updates.password;
      if (updates.profile) data.profile = updates.profile;
      if (updates.disabled !== undefined) data.disabled = updates.disabled ? 'true' : 'false';
      
      await mikrotikRequest(config, `/ppp/secret/${secret['.id']}`, 'PATCH', data);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error updating PPPoE user:', error);
    return false;
  }
}

// حذف مستخدم PPPoE
export async function deletePPPoEUser(config: MikroTikConfig, username: string): Promise<boolean> {
  try {
    const secrets = await mikrotikRequest(config, '/ppp/secret');
    const secret = secrets.find((s: Record<string, unknown>) => s.name === username);
    
    if (secret && secret['.id']) {
      await mikrotikRequest(config, `/ppp/secret/${secret['.id']}`, 'DELETE');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting PPPoE user:', error);
    return false;
  }
}

// تعطيل مستخدم PPPoE (إيقاف الخدمة)
export async function disablePPPoEUser(config: MikroTikConfig, username: string): Promise<boolean> {
  try {
    const secrets = await mikrotikRequest(config, '/ppp/secret');
    const secret = secrets.find((s: Record<string, unknown>) => s.name === username);
    
    if (secret && secret['.id']) {
      await mikrotikRequest(config, `/ppp/secret/${secret['.id']}`, 'PATCH', {
        disabled: 'true'
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error disabling PPPoE user:', error);
    return false;
  }
}

// تفعيل مستخدم PPPoE (إعادة الخدمة)
export async function enablePPPoEUser(config: MikroTikConfig, username: string): Promise<boolean> {
  try {
    const secrets = await mikrotikRequest(config, '/ppp/secret');
    const secret = secrets.find((s: Record<string, unknown>) => s.name === username);
    
    if (secret && secret['.id']) {
      await mikrotikRequest(config, `/ppp/secret/${secret['.id']}`, 'PATCH', {
        disabled: 'false'
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error enabling PPPoE user:', error);
    return false;
  }
}

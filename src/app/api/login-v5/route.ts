import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Brand new login endpoint - V5 - COMPLETELY ISOLATED
export const dynamic = 'force-dynamic';

const CREDS = {
  u: 'admin',
  p: 'admin!@#admin!@#',
  n: '1998'
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password, pin } = body;

    if (username === CREDS.u && password === CREDS.p && pin === CREDS.n) {
      const token = crypto.randomBytes(32).toString('hex');
      return NextResponse.json({
        ok: true,
        token,
        msg: 'Login successful'
      });
    }

    return NextResponse.json({
      ok: false,
      msg: 'بيانات الدخول غير صحيحة'
    }, { status: 401 });

  } catch (e) {
    return NextResponse.json({
      ok: false,
      msg: 'خطأ داخلي'
    }, { status: 500 });
  }
}

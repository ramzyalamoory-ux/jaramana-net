import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    message: 'Auth v4 is working!',
    timestamp: new Date().toISOString(),
    credentials: {
      username: 'admin',
      password: 'admin!@#admin!@#',
      pin: '1998'
    }
  });
}

export async function POST() {
  return NextResponse.json({
    success: true,
    message: 'POST v4 works!',
    timestamp: new Date().toISOString()
  });
}

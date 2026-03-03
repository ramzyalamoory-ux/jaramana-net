import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST - استيراد المشتركين من CSV
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'الملف مطلوب' }, { status: 400 });
    }

    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());

    // تخطي العنوان (السطر الأول)
    const dataLines = lines.slice(1);
    
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const line of dataLines) {
      try {
        // تحليل السطر (CSV format: name,phone,address,monthlyFee)
        const parts = line.split(',').map(p => p.replace(/"/g, '').trim());
        
        if (parts.length < 2) {
          skipped++;
          continue;
        }

        const [name, phone, address, monthlyFeeStr] = parts;
        const monthlyFee = parseFloat(monthlyFeeStr) || 0;

        if (!name || !phone) {
          skipped++;
          continue;
        }

        // التحقق من عدم وجود المشترك
        const existing = await db.subscriber.findUnique({
          where: { phone },
        });

        if (existing) {
          skipped++;
          continue;
        }

        await db.subscriber.create({
          data: {
            name,
            phone,
            address: address || null,
            monthlyFee,
          },
        });

        imported++;
      } catch (e) {
        skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      skipped,
      errors,
    });
  } catch (error) {
    console.error('Error importing data:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

const SUPABASE_URL = 'https://pypomilurmkzlceecukr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_R30YtCj6dqhLwjTQsrR1Uw_tcItK0JV';

const getHeaders = () => ({
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
});

// POST - استيراد من ملف Excel
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'subscribers' or 'inventory'

    if (!file) {
      return NextResponse.json({ error: 'لم يتم رفع ملف' }, { status: 400 });
    }

    // قراءة الملف
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'الملف فارغ' }, { status: 400 });
    }

    const results = {
      total: data.length,
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    // استيراد المشتركين
    if (type === 'subscribers') {
      for (const row of data) {
        try {
          const subscriber: any = {
            name: row['الاسم'] || row['name'] || row['Name'] || '',
            phone: String(row['الهاتف'] || row['phone'] || row['Phone'] || ''),
            address: row['العنوان'] || row['address'] || row['Address'] || '',
            plan: row['الباقة'] || row['plan'] || row['Plan'] || '',
            monthlyFee: Number(row['سعر الباقة'] || row['monthlyFee'] || row['Fee'] || 0),
            balance: Number(row['الرصيد'] || row['balance'] || row['Balance'] || 0),
            pppoeUser: row['PPPoE'] || row['pppoeUser'] || row['Username'] || null,
            pppoePassword: row['PPPoE Password'] || row['pppoePassword'] || row['Password'] || null,
            status: 'active',
            paymentStatus: 'paid',
            createdAt: new Date().toISOString(),
          };

          if (!subscriber.name || !subscriber.phone) {
            results.failed++;
            results.errors.push(`صف ${data.indexOf(row) + 2}: الاسم والهاتف مطلوبان`);
            continue;
          }

          const res = await fetch(`${SUPABASE_URL}/rest/v1/Subscriber`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(subscriber),
          });

          if (res.ok) {
            results.success++;
          } else {
            results.failed++;
            const err = await res.json();
            results.errors.push(`صف ${data.indexOf(row) + 2}: ${err.message || 'خطأ في الإضافة'}`);
          }
        } catch (e) {
          results.failed++;
          results.errors.push(`صف ${data.indexOf(row) + 2}: خطأ في المعالجة`);
        }
      }
    }

    // استيراد المخزون
    if (type === 'inventory') {
      for (const row of data) {
        try {
          const product: any = {
            name: row['المنتج'] || row['name'] || row['Name'] || row['Product'] || '',
            category: row['التصنيف'] || row['category'] || row['Category'] || 'راوتر',
            quantity: Number(row['الكمية'] || row['quantity'] || row['Quantity'] || 0),
            minStock: Number(row['الحد الأدنى'] || row['minStock'] || 5),
            price: Number(row['السعر'] || row['price'] || row['Price'] || 0),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          if (!product.name) {
            results.failed++;
            results.errors.push(`صف ${data.indexOf(row) + 2}: اسم المنتج مطلوب`);
            continue;
          }

          const res = await fetch(`${SUPABASE_URL}/rest/v1/Inventory`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(product),
          });

          if (res.ok) {
            results.success++;
          } else {
            results.failed++;
            const err = await res.json();
            results.errors.push(`صف ${data.indexOf(row) + 2}: ${err.message || 'خطأ في الإضافة'}`);
          }
        } catch (e) {
          results.failed++;
          results.errors.push(`صف ${data.indexOf(row) + 2}: خطأ في المعالجة`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `تم استيراد ${results.success} من ${results.total} بنجاح`,
      results,
    });

  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({
      error: 'حدث خطأ أثناء الاستيراد',
      details: error instanceof Error ? error.message : 'خطأ غير معروف',
    }, { status: 500 });
  }
}

// GET - تحميل قالب Excel
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'subscribers';

  let headers: string[];
  let data: Record<string, string | number>[];

  if (type === 'subscribers') {
    headers = ['الاسم', 'الهاتف', 'العنوان', 'الباقة', 'سعر الباقة', 'الرصيد', 'PPPoE', 'PPPoE Password'];
    data = [
      { 'الاسم': 'أحمد محمد', 'الهاتف': '0999123456', 'العنوان': 'دمشق', 'الباقة': '2 ميغا', 'سعر الباقة': 20000, 'الرصيد': 0, 'PPPoE': 'ahmed123', 'PPPoE Password': 'pass123' },
      { 'الاسم': 'محمود علي', 'الهاتف': '0999789012', 'العنوان': 'حلب', 'الباقة': '5 ميغا', 'سعر الباقة': 30000, 'الرصيد': 5000, 'PPPoE': 'mahmoud456', 'PPPoE Password': 'pass456' },
    ];
  } else {
    headers = ['المنتج', 'التصنيف', 'الكمية', 'الحد الأدنى', 'السعر'];
    data = [
      { 'المنتج': 'راوتر TP-Link', 'التصنيف': 'راوتر', 'الكمية': 10, 'الحد الأدنى': 5, 'السعر': 50000 },
      { 'المنتج': 'كبل شبكة 10م', 'التصنيف': 'بقية العدة', 'الكمية': 50, 'الحد الأدنى': 10, 'السعر': 5000 },
    ];
  }

  const worksheet = XLSX.utils.json_to_sheet(data, { header: headers });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

  const buffer = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });

  return new NextResponse(Buffer.from(buffer, 'base64'), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="template_${type}.xlsx"`,
    },
  });
}

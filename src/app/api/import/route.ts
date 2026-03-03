import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = 'https://pypomilurmkzlceecukr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_R30YtCj6dqhLwjTQsrR1Uw_tcItK0JV';

const getHeaders = () => ({
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
});

// تحويل اسم العمود
function mapColumn(row: any, possibleNames: string[]): any {
  for (const name of possibleNames) {
    if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
      return row[name];
    }
  }
  return undefined;
}

// تحويل CSV إلى مصفوفة
function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const rows: Record<string, string>[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || '';
    });
    rows.push(row);
  }
  
  return rows;
}

// POST - استيراد من ملف
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;

    if (!file) {
      return NextResponse.json({ error: 'لم يتم رفع ملف' }, { status: 400 });
    }

    // قراءة الملف
    const text = await file.text();
    let data: Record<string, any>[] = [];

    // التحقق من نوع الملف
    const fileName = file.name.toLowerCase();
    
    if (fileName.endsWith('.csv')) {
      // ملف CSV
      data = parseCSV(text);
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      // ملف Excel
      try {
        const xlsx = await import('xlsx');
        const buffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(buffer);
        const workbook = xlsx.read(uint8Array, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        data = xlsx.utils.sheet_to_json(sheet);
      } catch (e) {
        // إذا فشل xlsx، نحاول كـ CSV
        data = parseCSV(text);
      }
    } else {
      // نحاول كـ CSV
      data = parseCSV(text);
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ 
        error: 'الملف فارغ أو لا يحتوي بيانات صحيحة',
        hint: 'تأكد أن الملف CSV أو Excel مع أعمدة صحيحة'
      }, { status: 400 });
    }

    const results = {
      total: data.length,
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    // استيراد المشتركين
    if (type === 'subscribers') {
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        try {
          const name = mapColumn(row, ['الاسم', 'name', 'Name', 'اسم المشترك']);
          const phone = String(mapColumn(row, ['الهاتف', 'phone', 'Phone', 'رقم الهاتف', 'موبايل']) || '').trim();
          
          if (!name || !phone) {
            results.failed++;
            results.errors.push(`صف ${i + 2}: الاسم والهاتف مطلوبان`);
            continue;
          }

          const subscriber: Record<string, any> = {
            name: String(name).trim(),
            phone: phone,
            address: String(mapColumn(row, ['العنوان', 'address', 'Address']) || '').trim(),
            plan: String(mapColumn(row, ['الباقة', 'plan', 'Plan', 'السرعة']) || '').trim(),
            monthlyFee: Number(mapColumn(row, ['سعر الباقة', 'monthlyFee', 'السعر', 'price']) || 0),
            balance: Number(mapColumn(row, ['الرصيد', 'balance', 'المبلغ المستحق']) || 0),
            status: 'active',
            paymentStatus: 'paid',
            createdAt: new Date().toISOString(),
          };

          // PPPoE اختياري
          const pppoeUser = mapColumn(row, ['PPPoE', 'pppoeUser', 'Username', 'حساب PPPoE']);
          const pppoePass = mapColumn(row, ['PPPoE Password', 'pppoePassword', 'Password', 'كلمة السر PPPoE']);
          if (pppoeUser) {
            subscriber.pppoeUser = String(pppoeUser).trim();
            subscriber.pppoePassword = pppoePass ? String(pppoePass).trim() : '';
          }

          const res = await fetch(`${SUPABASE_URL}/rest/v1/Subscriber`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(subscriber),
          });

          if (res.ok) {
            results.success++;
          } else {
            const err = await res.json();
            results.failed++;
            results.errors.push(`صف ${i + 2}: ${err.message || err.details || JSON.stringify(err)}`);
          }
        } catch (e: any) {
          results.failed++;
          results.errors.push(`صف ${i + 2}: ${e.message || 'خطأ'}`);
        }
      }
    }

    // استيراد المخزون
    if (type === 'inventory') {
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        try {
          const productName = mapColumn(row, ['المنتج', 'name', 'Name', 'Product', 'اسم المنتج']);
          
          if (!productName) {
            results.failed++;
            results.errors.push(`صف ${i + 2}: اسم المنتج مطلوب`);
            continue;
          }

          const product: Record<string, any> = {
            name: String(productName).trim(),
            category: String(mapColumn(row, ['التصنيف', 'category', 'Category', 'النوع']) || 'راوتر'),
            quantity: Number(mapColumn(row, ['الكمية', 'quantity', 'Quantity', 'عدد']) || 0),
            minStock: Number(mapColumn(row, ['الحد الأدنى', 'minStock', 'Min']) || 5),
            price: Number(mapColumn(row, ['السعر', 'price', 'Price']) || 0),
            createdAt: new Date().toISOString(),
          };

          const res = await fetch(`${SUPABASE_URL}/rest/v1/Inventory`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(product),
          });

          if (res.ok) {
            results.success++;
          } else {
            const err = await res.json();
            results.failed++;
            results.errors.push(`صف ${i + 2}: ${err.message || err.details || JSON.stringify(err)}`);
          }
        } catch (e: any) {
          results.failed++;
          results.errors.push(`صف ${i + 2}: ${e.message || 'خطأ'}`);
        }
      }
    }

    return NextResponse.json({
      success: results.success > 0,
      message: `تم استيراد ${results.success} من ${results.total}`,
      results,
    });

  } catch (error: any) {
    console.error('Import error:', error);
    return NextResponse.json({
      error: 'حدث خطأ أثناء الاستيراد',
      details: error.message,
    }, { status: 500 });
  }
}

// GET - تحميل قالب
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'subscribers';

  let csvContent: string;
  let filename: string;

  if (type === 'subscribers') {
    csvContent = 'الاسم,الهاتف,العنوان,الباقة,سعر الباقة,الرصيد,PPPoE,PPPoE Password\nأحمد محمد,0999123456,دمشق,2 ميغا,20000,0,user1,pass1\nمحمود علي,0999789012,حلب,5 ميغا,30000,5000,user2,pass2';
    filename = 'template_subscribers.csv';
  } else {
    csvContent = 'المنتج,التصنيف,الكمية,الحد الأدنى,السعر\nراوتر TP-Link,راوتر,10,5,50000\nكبل شبكة 10م,بقية العدة,50,10,5000\nسويتش 8 بورت,أخرى,5,2,30000';
    filename = 'template_inventory.csv';
  }

  return new NextResponse('\ufeff' + csvContent, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

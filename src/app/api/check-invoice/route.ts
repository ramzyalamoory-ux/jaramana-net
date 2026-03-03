import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = 'https://pypomilurmkzlceecukr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_R30YtCj6dqhLwjTQsrR1Uw_tcItK0JV';
const TABLE_NAME = 'Subscriber';

// GET - البحث عن فاتورة مشترك بالاسم أو رقم الموبايل
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('name');

    console.log('Search request for:', search);

    if (!search || search.trim().length < 1) {
      return NextResponse.json(
        { subscriber: null, error: 'الرجاء إدخال الاسم أو رقم الموبايل' }
      );
    }

    const searchTerm = search.trim();

    // البحث بالاسم أو الهاتف
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${TABLE_NAME}?select=*&or=(name.ilike.%25${encodeURIComponent(searchTerm)}%25,phone.ilike.%25${encodeURIComponent(searchTerm)}%25)&limit=10`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
      }
    );

    const data = await res.json();
    console.log('Search results:', data?.length || 0, 'found');

    if (!data || data.length === 0) {
      return NextResponse.json(
        { subscriber: null, error: 'لا يوجد مشترك بهذا الاسم أو الرقم' }
      );
    }

    // إذا في نتيجة واحدة
    if (data.length === 1) {
      const s = data[0];
      const balance = s.balance || 0;

      return NextResponse.json({
        subscriber: {
          id: s.id,
          name: s.name,
          phone: s.phone,
          address: s.address,
          plan: s.plan || '',
          monthlyFee: s.monthlyFee || 0,
          balance: balance,
          status: s.serviceStatus || (s.isActive ? 'active' : 'suspended'),
          pppoeUser: s.pppoeUser,
        },
        totalDue: balance,
      });
    }

    // إذا في أكثر من نتيجة
    return NextResponse.json({
      subscriber: null,
      multipleResults: data.map((s: any) => ({
        id: s.id,
        name: s.name,
        phone: s.phone,
        balance: s.balance || 0,
      })),
      error: `تم العثور على ${data.length} نتائج، حدد أكثر`,
    });
  } catch (error) {
    console.error('Error checking invoice:', error);
    return NextResponse.json(
      { subscriber: null, error: 'حدث خطأ أثناء البحث: ' + String(error) }
    );
  }
}

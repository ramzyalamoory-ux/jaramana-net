import { NextRequest, NextResponse } from 'next/server';
import { supabaseUpdate, isSupabaseConfigured } from '@/lib/supabase';

// PUT - تحديث فاتورة
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'قاعدة البيانات غير متاحة' }, { status: 500 });
    }

    const updateData: any = {
      ...body,
      updatedAt: new Date().toISOString()
    };

    if (body.isPaid === true) {
      updateData.paidAt = new Date().toISOString();
    }

    const updated = await supabaseUpdate('invoices', `id=eq.${id}`, updateData);

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating invoice:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

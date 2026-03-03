import { NextRequest, NextResponse } from 'next/server';
import { supabaseUpdate, supabaseDelete, isSupabaseConfigured } from '@/lib/supabase';

// PUT - تحديث تذكرة
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

    if (body.response) {
      updateData.respondedAt = new Date().toISOString();
    }

    const updated = await supabaseUpdate('tickets', `id=eq.${id}`, updateData);

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating ticket:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

// DELETE - حذف تذكرة
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'قاعدة البيانات غير متاحة' }, { status: 500 });
    }

    await supabaseDelete('tickets', `id=eq.${id}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting ticket:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

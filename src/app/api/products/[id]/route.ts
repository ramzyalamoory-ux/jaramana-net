import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// PUT - تحديث منتج
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, categoryId, unit, currentStock, minStock, price, notes } = body;

    const product = await db.product.update({
      where: { id: parseInt(id) },
      data: {
        name,
        categoryId: categoryId ? parseInt(categoryId) : undefined,
        unit,
        currentStock,
        minStock,
        price,
        notes,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تحديث المنتج' },
      { status: 500 }
    );
  }
}

// DELETE - حذف منتج
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // حذف جميع الحركات المرتبطة
    await db.inventoryTransaction.deleteMany({
      where: { productId: parseInt(id) },
    });

    await db.product.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حذف المنتج' },
      { status: 500 }
    );
  }
}

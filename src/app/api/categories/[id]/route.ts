import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// DELETE - حذف تصنيف
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // التحقق من وجود منتجات في التصنيف
    const productsCount = await db.product.count({
      where: { categoryId: parseInt(id) },
    });

    if (productsCount > 0) {
      return NextResponse.json(
        { error: 'لا يمكن حذف التصنيف لأنه يحتوي على منتجات' },
        { status: 400 }
      );
    }

    await db.productCategory.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حذف التصنيف' },
      { status: 500 }
    );
  }
}

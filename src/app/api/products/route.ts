import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - جلب كل المنتجات
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');

    const products = await db.product.findMany({
      where: categoryId ? { categoryId: parseInt(categoryId) } : {},
      include: {
        category: true,
        _count: {
          select: { transactions: true },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب المنتجات' },
      { status: 500 }
    );
  }
}

// POST - إضافة منتج جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, categoryId, unit, currentStock, minStock, price, notes } = body;

    if (!name || !categoryId) {
      return NextResponse.json(
        { error: 'اسم المنتج والتصنيف مطلوبان' },
        { status: 400 }
      );
    }

    const product = await db.product.create({
      data: {
        name,
        categoryId: parseInt(categoryId),
        unit: unit || 'قطعة',
        currentStock: currentStock || 0,
        minStock: minStock || 5,
        price: price || 0,
        notes: notes || null,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إضافة المنتج' },
      { status: 500 }
    );
  }
}

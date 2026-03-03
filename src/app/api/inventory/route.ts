import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - جلب كل حركات المخزون
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const productId = searchParams.get('productId');

    const transactions = await db.inventoryTransaction.findMany({
      where: {
        ...(type ? { type } : {}),
        ...(productId ? { productId: parseInt(productId) } : {}),
      },
      include: {
        product: {
          include: {
            category: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
      take: 100,
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Error fetching inventory transactions:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب حركات المخزون' },
      { status: 500 }
    );
  }
}

// POST - إضافة حركة مخزون جديدة
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, type, quantity, reason, recipient, supplier, price, notes } = body;

    if (!productId || !type || !quantity) {
      return NextResponse.json(
        { error: 'المنتج والنوع والكمية مطلوبة' },
        { status: 400 }
      );
    }

    if (type !== 'in' && type !== 'out') {
      return NextResponse.json(
        { error: 'النوع يجب أن يكون "داخل" أو "خارج"' },
        { status: 400 }
      );
    }

    // إنشاء الحركة وتحديث المخزون في نفس الوقت
    const transaction = await db.$transaction(async (tx) => {
      // جلب المنتج الحالي
      const product = await tx.product.findUnique({
        where: { id: parseInt(productId) },
      });

      if (!product) {
        throw new Error('المنتج غير موجود');
      }

      // التحقق من الكمية في حالة الإخراج
      if (type === 'out' && product.currentStock < quantity) {
        throw new Error('الكمية المطلوبة أكبر من المخزون الحالي');
      }

      // إنشاء الحركة
      const newTransaction = await tx.inventoryTransaction.create({
        data: {
          productId: parseInt(productId),
          type,
          quantity,
          reason: reason || null,
          recipient: recipient || null,
          supplier: supplier || null,
          price: price || null,
          notes: notes || null,
        },
        include: {
          product: {
            include: {
              category: true,
            },
          },
        },
      });

      // تحديث المخزون
      const newStock = type === 'in'
        ? product.currentStock + quantity
        : product.currentStock - quantity;

      await tx.product.update({
        where: { id: parseInt(productId) },
        data: { currentStock: newStock },
      });

      return newTransaction;
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error: any) {
    console.error('Error creating inventory transaction:', error);
    return NextResponse.json(
      { error: error.message || 'حدث خطأ أثناء إضافة الحركة' },
      { status: 500 }
    );
  }
}

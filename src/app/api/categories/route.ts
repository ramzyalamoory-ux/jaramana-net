import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - جلب كل التصنيفات
export async function GET() {
  try {
    const categories = await db.productCategory.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب التصنيفات' },
      { status: 500 }
    );
  }
}

// POST - إضافة تصنيف جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, nameEn, description } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'اسم التصنيف مطلوب' },
        { status: 400 }
      );
    }

    const category = await db.productCategory.create({
      data: {
        name,
        nameEn: nameEn || null,
        description: description || null,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'يوجد تصنيف بهذا الاسم' },
        { status: 400 }
      );
    }
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إضافة التصنيف' },
      { status: 500 }
    );
  }
}

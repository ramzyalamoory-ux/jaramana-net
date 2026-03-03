import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = 'https://pypomilurmkzlceecukr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_R30YtCj6dqhLwjTQsrR1Uw_tcItK0JV';

const getHeaders = () => ({
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
});

// التصنيفات - كل تصنيف هو منتج (name = category)
const CATEGORIES = [
  { name: 'راوتر', icon: '📡' },
  { name: 'سويتش', icon: '🔀' },
  { name: 'بقية العدة', icon: '🔧' },
  { name: 'أخرى', icon: '📦' },
];

// GET - جلب المخزون
export async function GET(request: NextRequest) {
  try {
    // جلب المنتجات
    const productsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/Product?select=*`,
      { headers: getHeaders() }
    );
    let products = await productsRes.json();
    if (!products || products.code) products = [];

    // جلب الحركات
    const transactionsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/InventoryTransaction?select=*&order=createdAt.desc&limit=50`,
      { headers: getHeaders() }
    );
    let transactions = await transactionsRes.json();
    if (!transactions || transactions.code) transactions = [];

    // تصفية المنتجات التي هي تصنيفات فقط
    const categoryNames = CATEGORIES.map(c => c.name);
    const inventoryProducts = products.filter((p: any) => 
      categoryNames.includes(p.name)
    );

    // حساب الإحصائيات
    const stats = {
      totalProducts: inventoryProducts.length,
      totalStock: inventoryProducts.reduce((sum: number, p: any) => sum + (p.currentStock || 0), 0),
      totalValue: inventoryProducts.reduce((sum: number, p: any) => sum + ((p.currentStock || 0) * (p.price || 0)), 0),
      lowStock: inventoryProducts.filter((p: any) => (p.currentStock || 0) <= (p.minStock || 5)).length,
    };

    return NextResponse.json({
      categories: CATEGORIES.map((c, i) => ({
        id: i + 1,
        ...c,
        count: inventoryProducts.filter((p: any) => p.name === c.name).length,
        stock: inventoryProducts.find((p: any) => p.name === c.name)?.currentStock || 0,
      })),
      products: inventoryProducts.map((p: any) => ({
        ...p,
        quantity: p.currentStock, // للتوافق
        category: p.name,
      })),
      transactions: transactions.map((t: any) => ({
        ...t,
        productName: t.product?.name || t.productName,
        category: t.product?.name || t.category,
      })),
      stats,
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json({
      categories: CATEGORIES.map((c, i) => ({ id: i + 1, ...c, count: 0, stock: 0 })),
      products: [],
      transactions: [],
      stats: { totalProducts: 0, totalStock: 0, totalValue: 0, lowStock: 0 },
    });
  }
}

// POST - إضافة/تحديث
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    // إضافة كمية لتصنيف
    if (action === 'add-product') {
      const { category, quantity } = data;
      
      // البحث عن منتج موجود بنفس الاسم (التصنيف)
      const checkRes = await fetch(
        `${SUPABASE_URL}/rest/v1/Product?name=eq.${encodeURIComponent(category)}`,
        { headers: getHeaders() }
      );
      const existing = await checkRes.json();

      if (existing && existing.length > 0) {
        // تحديث الكمية
        const product = existing[0];
        const newQty = (product.currentStock || 0) + (quantity || 0);
        
        await fetch(`${SUPABASE_URL}/rest/v1/Product?id=eq.${product.id}`, {
          method: 'PATCH',
          headers: getHeaders(),
          body: JSON.stringify({ 
            currentStock: newQty,
            updatedAt: new Date().toISOString(),
          }),
        });

        // إضافة حركة
        await fetch(`${SUPABASE_URL}/rest/v1/InventoryTransaction`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({
            productId: product.id,
            type: 'دخل',
            quantity: quantity,
            reason: 'إضافة للمخزون',
          }),
        });

        return NextResponse.json({ success: true });
      }

      // إنشاء منتج جديد - الاسم = التصنيف
      const catRes = await fetch(
        `${SUPABASE_URL}/rest/v1/ProductCategory?select=id&limit=1`,
        { headers: getHeaders() }
      );
      const catData = await catRes.json();
      const categoryId = catData?.[0]?.id || 2;

      const createRes = await fetch(`${SUPABASE_URL}/rest/v1/Product`, {
        method: 'POST',
        headers: { ...getHeaders(), 'Prefer': 'return=representation' },
        body: JSON.stringify({
          name: category,
          categoryId: categoryId,
          currentStock: quantity || 0,
          unit: 'قطعة',
          minStock: 0,
          price: 0,
          updatedAt: new Date().toISOString(),
        }),
      });

      const newProduct = await createRes.json();
      if (!createRes.ok) {
        return NextResponse.json({ error: 'خطأ في الإضافة', details: newProduct }, { status: 400 });
      }

      // إضافة حركة
      if (newProduct?.[0]?.id) {
        await fetch(`${SUPABASE_URL}/rest/v1/InventoryTransaction`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({
            productId: newProduct[0].id,
            type: 'دخل',
            quantity: quantity,
            reason: 'إضافة جديدة',
          }),
        });
      }

      return NextResponse.json({ success: true });
    }

    // تحديث كمية (دخل/خرج)
    if (action === 'update-stock') {
      const { id, quantity, type, reason, recipient } = data;

      // جلب المنتج
      const productRes = await fetch(
        `${SUPABASE_URL}/rest/v1/Product?id=eq.${id}&select=*`,
        { headers: getHeaders() }
      );
      const products = await productRes.json();
      if (!products || products.length === 0) {
        return NextResponse.json({ error: 'المنتج غير موجود' }, { status: 404 });
      }

      const product = products[0];
      const newQty = type === 'in' 
        ? product.currentStock + quantity 
        : Math.max(0, product.currentStock - quantity);

      // تحديث الكمية
      await fetch(`${SUPABASE_URL}/rest/v1/Product?id=eq.${id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ 
          currentStock: newQty,
          updatedAt: new Date().toISOString(),
        }),
      });

      // إضافة حركة
      await fetch(`${SUPABASE_URL}/rest/v1/InventoryTransaction`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          productId: id,
          type: type === 'in' ? 'دخل' : 'خرج',
          quantity: quantity,
          reason: reason || null,
          recipient: recipient || null,
        }),
      });

      return NextResponse.json({ success: true, newQuantity: newQty });
    }

    // حذف منتج
    if (action === 'delete-product') {
      await fetch(`${SUPABASE_URL}/rest/v1/Product?id=eq.${data.id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 });
  } catch (error) {
    console.error('Error in inventory action:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = 'https://pypomilurmkzlceecukr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_R30YtCj6dqhLwjTQsrR1Uw_tcItK0JV';

const getHeaders = () => ({
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
});

// التصنيفات الافتراضية - كل تصنيف هو منتج بحد ذاته
const DEFAULT_CATEGORIES = [
  { id: 1, name: 'راوتر', nameEn: 'Router', icon: '📡' },
  { id: 2, name: 'سويتش', nameEn: 'Switch', icon: '🔀' },
  { id: 3, name: 'بقية العدة', nameEn: 'Equipment', icon: '🔧' },
  { id: 4, name: 'أخرى', nameEn: 'Other', icon: '📦' },
];

// GET - جلب المخزون
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    // جلب المنتجات
    let url = `${SUPABASE_URL}/rest/v1/Inventory?select=*&order=category,name`;
    if (category) {
      url += `&category=eq.${category}`;
    }

    const res = await fetch(url, { headers: getHeaders() });
    let products = await res.json();

    // إذا الجدول فارغ أو غير موجود، نرجع البيانات الافتراضية
    if (!products || products.length === 0 || products.code) {
      products = [];
    }

    // جلب حركات المخزون
    const transactionsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/InventoryTransaction?select=*&order=date.desc&limit=50`,
      { headers: getHeaders() }
    );
    let transactions = await transactionsRes.json();
    if (!transactions || transactions.code) {
      transactions = [];
    }

    // إحصائيات
    const stats = {
      totalProducts: products.length,
      totalStock: products.reduce((sum: number, p: any) => sum + (p.quantity || 0), 0),
      totalValue: products.reduce((sum: number, p: any) => sum + ((p.quantity || 0) * (p.price || 0)), 0),
      lowStock: products.filter((p: any) => (p.quantity || 0) <= (p.minStock || 5)).length,
      byCategory: DEFAULT_CATEGORIES.map(cat => ({
        ...cat,
        count: products.filter((p: any) => p.category === cat.name).length,
        stock: products.filter((p: any) => p.category === cat.name)
          .reduce((sum: number, p: any) => sum + (p.quantity || 0), 0),
      })),
    };

    return NextResponse.json({
      categories: DEFAULT_CATEGORIES,
      products,
      transactions,
      stats,
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json({
      categories: DEFAULT_CATEGORIES,
      products: [],
      transactions: [],
      stats: { totalProducts: 0, totalStock: 0, totalValue: 0, lowStock: 0, byCategory: DEFAULT_CATEGORIES },
    });
  }
}

// POST - إضافة/تحديث منتج
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    // إضافة كمية لتصنيف (بدون اسم منتج)
    if (action === 'add-product') {
      // اسم المنتج = اسم التصنيف
      const productName = data.category;
      
      // التحقق من وجود المنتج مسبقاً
      const checkRes = await fetch(
        `${SUPABASE_URL}/rest/v1/Inventory?category=eq.${encodeURIComponent(data.category)}`,
        { headers: getHeaders() }
      );
      const existingProducts = await checkRes.json();
      
      if (existingProducts && existingProducts.length > 0) {
        // تحديث الكمية الموجودة
        const existing = existingProducts[0];
        const newQuantity = (existing.quantity || 0) + (data.quantity || 0);
        
        await fetch(`${SUPABASE_URL}/rest/v1/Inventory?id=eq.${existing.id}`, {
          method: 'PATCH',
          headers: getHeaders(),
          body: JSON.stringify({
            quantity: newQuantity,
            updatedAt: new Date().toISOString(),
          }),
        });
        
        // إضافة حركة مخزون
        if (data.quantity > 0) {
          await fetch(`${SUPABASE_URL}/rest/v1/InventoryTransaction`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({
              productName,
              category: data.category,
              type: 'دخل',
              quantity: data.quantity,
              reason: 'إضافة للمخزون',
              date: new Date().toISOString(),
            }),
          });
        }
        
        return NextResponse.json({ success: true, product: { ...existing, quantity: newQuantity } });
      }
      
      // إنشاء منتج جديد
      const res = await fetch(`${SUPABASE_URL}/rest/v1/Inventory`, {
        method: 'POST',
        headers: { ...getHeaders(), 'Prefer': 'return=representation' },
        body: JSON.stringify({
          name: productName,
          category: data.category,
          quantity: data.quantity || 0,
          minStock: data.minStock || 0,
          price: data.price || 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        return NextResponse.json({ error: 'خطأ في إضافة المنتج', details: result }, { status: 400 });
      }

      // إضافة حركة مخزون
      if (data.quantity > 0) {
        await fetch(`${SUPABASE_URL}/rest/v1/InventoryTransaction`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({
            productName,
            category: data.category,
            type: 'دخل',
            quantity: data.quantity,
            reason: 'إضافة جديدة',
            date: new Date().toISOString(),
          }),
        });
      }

      return NextResponse.json({ success: true, product: result[0] });
    }

    // تحديث كمية
    if (action === 'update-stock') {
      const { id, quantity, type, reason, recipient } = data;

      // جلب المنتج الحالي
      const productRes = await fetch(
        `${SUPABASE_URL}/rest/v1/Inventory?id=eq.${id}&select=*`,
        { headers: getHeaders() }
      );
      const products = await productRes.json();
      if (!products || products.length === 0) {
        return NextResponse.json({ error: 'المنتج غير موجود' }, { status: 404 });
      }

      const product = products[0];
      const newQuantity = type === 'in' 
        ? product.quantity + quantity 
        : Math.max(0, product.quantity - quantity);

      // تحديث الكمية
      await fetch(`${SUPABASE_URL}/rest/v1/Inventory?id=eq.${id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ 
          quantity: newQuantity,
          updatedAt: new Date().toISOString() 
        }),
      });

      // إضافة حركة (دخل/خرج)
      const moveType = type === 'in' ? 'دخل' : 'خرج';
      await fetch(`${SUPABASE_URL}/rest/v1/InventoryTransaction`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          productName: product.name,
          category: product.category,
          type: moveType,
          quantity,
          reason: reason || null,
          recipient: recipient || null,
          date: new Date().toISOString(),
        }),
      });

      return NextResponse.json({ success: true, newQuantity });
    }

    // حذف منتج
    if (action === 'delete-product') {
      const { id } = data;
      await fetch(`${SUPABASE_URL}/rest/v1/Inventory?id=eq.${id}`, {
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

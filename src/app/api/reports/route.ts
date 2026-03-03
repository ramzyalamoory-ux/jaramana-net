import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = 'https://pypomilurmkzlceecukr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_R30YtCj6dqhLwjTQsrR1Uw_tcItK0JV';

const getHeaders = () => ({
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
});

// GET - التقارير والإحصائيات
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const reportType = searchParams.get('type') || 'overview';
  const month = searchParams.get('month') || new Date().toISOString().slice(0, 7); // YYYY-MM

  try {
    // جلب جميع المشتركين
    const subsRes = await fetch(`${SUPABASE_URL}/rest/v1/Subscriber?select=*`, {
      headers: getHeaders(),
    });
    const subscribers = await subsRes.json();

    // جلب الدفعات
    const paymentsRes = await fetch(`${SUPABASE_URL}/rest/v1/Payment?select=*&order=createdAt.desc`, {
      headers: getHeaders(),
    });
    const payments = await paymentsRes.json();

    // جلب الديون
    const debtsRes = await fetch(`${SUPABASE_URL}/rest/v1/Debts?select=*`, {
      headers: getHeaders(),
    });
    const debts = await debtsRes.json();

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // بداية ونهاية الشهر
    const monthStart = new Date(currentYear, currentMonth, 1);
    const monthEnd = new Date(currentYear, currentMonth + 1, 0);

    // ===== تقرير نظرة عامة =====
    if (reportType === 'overview') {
      const activeSubscribers = subscribers.filter((s: any) => s.status === 'active');
      const suspendedSubscribers = subscribers.filter((s: any) => s.status === 'suspended');
      const graceSubscribers = subscribers.filter((s: any) => s.status === 'grace');

      // الإيرادات الشهرية
      const monthlyRevenue = activeSubscribers.reduce((sum: number, s: any) => sum + (s.monthlyFee || 0), 0);
      
      // المستحقات
      const totalBalance = subscribers.reduce((sum: number, s: any) => sum + (s.balance || 0), 0);
      
      // الديون
      const totalDebts = debts.reduce((sum: number, d: any) => sum + (d.amount || 0), 0);

      // دفعات الشهر الحالي
      const monthlyPayments = payments.filter((p: any) => {
        const pDate = new Date(p.createdAt);
        return pDate >= monthStart && pDate <= monthEnd;
      });
      const monthlyPaymentsTotal = monthlyPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

      // المشتركين الجدد هذا الشهر
      const newSubscribersThisMonth = subscribers.filter((s: any) => {
        const created = new Date(s.createdAt);
        return created >= monthStart && created <= monthEnd;
      });

      // المشتركين المنتهين
      const expiredSubscribers = subscribers.filter((s: any) => {
        if (!s.expiryDate) return false;
        return new Date(s.expiryDate) < now;
      });

      return NextResponse.json({
        overview: {
          totalSubscribers: subscribers.length,
          activeSubscribers: activeSubscribers.length,
          suspendedSubscribers: suspendedSubscribers.length,
          graceSubscribers: graceSubscribers.length,
          expiredSubscribers: expiredSubscribers.length,
          monthlyRevenue,
          monthlyPaymentsTotal,
          totalBalance,
          totalDebts,
          newSubscribersThisMonth: newSubscribersThisMonth.length,
        },
        monthlyPayments,
        newSubscribers: newSubscribersThisMonth,
        expiredList: expiredSubscribers,
      });
    }

    // ===== تقرير الإيرادات الشهرية =====
    if (reportType === 'revenue') {
      // حساب الإيرادات لآخر 12 شهر
      const monthlyData = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date(currentYear, currentMonth - i, 1);
        const monthStr = date.toISOString().slice(0, 7);
        const monthName = date.toLocaleDateString('ar', { month: 'long', year: 'numeric' });

        // دفعات الشهر
        const monthPayments = payments.filter((p: any) => {
          const pDate = new Date(p.createdAt);
          return pDate.getMonth() === date.getMonth() && pDate.getFullYear() === date.getFullYear();
        });

        const totalPayments = monthPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
        const paymentCount = monthPayments.length;

        monthlyData.push({
          month: monthStr,
          monthName,
          totalPayments,
          paymentCount,
        });
      }

      return NextResponse.json({
        monthlyRevenue: monthlyData,
        payments,
      });
    }

    // ===== تقرير المشتركين الجدد =====
    if (reportType === 'new-subscribers') {
      const newSubscribers = subscribers.filter((s: any) => {
        const created = new Date(s.createdAt);
        return created >= monthStart && created <= monthEnd;
      });

      return NextResponse.json({
        month,
        newSubscribers,
        count: newSubscribers.length,
      });
    }

    // ===== تقرير المشتركين المنتهين =====
    if (reportType === 'expired') {
      const expiredSubscribers = subscribers.filter((s: any) => {
        if (!s.expiryDate) return false;
        return new Date(s.expiryDate) < now;
      }).map((s: any) => ({
        ...s,
        daysOverdue: Math.ceil((now.getTime() - new Date(s.expiryDate).getTime()) / (1000 * 60 * 60 * 24)),
      }));

      return NextResponse.json({
        expiredSubscribers,
        count: expiredSubscribers.length,
      });
    }

    // ===== تقرير الديون =====
    if (reportType === 'debts') {
      const debtsByPerson = debts.reduce((acc: any, d: any) => {
        const key = d.phone || d.name;
        if (!acc[key]) {
          acc[key] = {
            name: d.name,
            phone: d.phone,
            address: d.address,
            totalAmount: 0,
            debts: [],
          };
        }
        acc[key].totalAmount += d.amount || 0;
        acc[key].debts.push(d);
        return acc;
      }, {});

      return NextResponse.json({
        debts,
        debtsByPerson: Object.values(debtsByPerson),
        totalDebts: debts.reduce((sum: number, d: any) => sum + (d.amount || 0), 0),
      });
    }

    // ===== مقارنة الأشهر =====
    if (reportType === 'comparison') {
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date(currentYear, currentMonth - i, 1);
        const monthStr = date.toISOString().slice(0, 7);
        const monthName = date.toLocaleDateString('ar', { month: 'long' });

        // مشتركين في بداية الشهر
        const subscribersAtStart = subscribers.filter((s: any) => {
          const created = new Date(s.createdAt);
          return created < date;
        }).length;

        // مشتركين جدد
        const newThisMonth = subscribers.filter((s: any) => {
          const created = new Date(s.createdAt);
          return created.getMonth() === date.getMonth() && created.getFullYear() === date.getFullYear();
        }).length;

        // دفعات
        const monthPayments = payments.filter((p: any) => {
          const pDate = new Date(p.createdAt);
          return pDate.getMonth() === date.getMonth() && pDate.getFullYear() === date.getFullYear();
        });
        const totalPayments = monthPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

        months.push({
          month: monthStr,
          monthName,
          subscribers: subscribersAtStart,
          newSubscribers: newThisMonth,
          payments: totalPayments,
          paymentCount: monthPayments.length,
        });
      }

      return NextResponse.json({ months });
    }

    return NextResponse.json({ error: 'نوع تقرير غير معروف' }, { status: 400 });

  } catch (error) {
    console.error('Reports error:', error);
    return NextResponse.json({
      error: 'فشل في جلب التقارير',
      details: error instanceof Error ? error.message : 'خطأ غير معروف',
    }, { status: 500 });
  }
}

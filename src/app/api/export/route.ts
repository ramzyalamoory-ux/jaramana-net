import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - تصدير البيانات
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'subscribers';

    let csvContent = '';
    let filename = '';

    if (type === 'subscribers') {
      const subscribers = await db.subscriber.findMany({
        include: {
          invoices: {
            where: { isPaid: false },
          },
        },
        orderBy: { name: 'asc' },
      });

      // CSV Header
      csvContent = 'الاسم,رقم الهاتف,العنوان,الرسوم الشهرية,الحالة,المبلغ المستحق\n';
      
      // CSV Data
      subscribers.forEach(sub => {
        const totalDue = sub.invoices.reduce((sum, inv) => sum + inv.amount, 0);
        csvContent += `"${sub.name}","${sub.phone}","${sub.address || ''}","${sub.monthlyFee}","${sub.isActive ? 'نشط' : 'متوقف'}","${totalDue}"\n`;
      });
      
      filename = 'subscribers.csv';
    } 
    else if (type === 'invoices') {
      const invoices = await db.invoice.findMany({
        include: { subscriber: true },
        orderBy: { month: 'desc' },
      });

      csvContent = 'المشترك,الشهر,المبلغ,الحالة,تاريخ الاستحقاق,ملاحظات\n';
      
      invoices.forEach(inv => {
        csvContent += `"${inv.subscriber?.name || ''}","${inv.month}","${inv.amount}","${inv.isPaid ? 'مدفوعة' : 'غير مدفوعة'}","${inv.dueDate.toLocaleDateString('ar-EG')}","${inv.notes || ''}"\n`;
      });
      
      filename = 'invoices.csv';
    }

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

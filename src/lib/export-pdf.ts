import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { formatCurrency } from '@/lib/utils';

interface ChartElement {
  id: string;
  title: string;
}

interface DashboardData {
  range: string;
  stats: {
    orders: number;
    revenue: number;
    products: number;
    users: number;
  };
  revenueSeries: Array<{ date: string; revenue: number; label: string }>;
  ordersSeries: Array<{ date: string; pending: number; preparing: number; ready: number; delivered: number; cancelled: number; label: string }>;
  topProducts: Array<{ name: string; total_sold: number; total_revenue: number }>;
  statusBreakdown: Array<{ status: string; count: number }>;
  recentOrders: Array<{ id: string; customer_name: string | null; customer_email: string | null; status: string; total: number; created_at: string }>;
}

export async function generateDashboardPDF(data: DashboardData, chartElements: ChartElement[]): Promise<Blob> {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = margin;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(24);
  pdf.setTextColor(180, 83, 9);
  pdf.text('Foodrink Dashboard Report', margin, yPos);
  yPos += 8;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);
  pdf.setTextColor(100, 100, 100);
  pdf.text(`Periode: ${data.range} | Dibuat: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, margin, yPos);
  yPos += 12;

  pdf.setDrawColor(200, 200, 200);
  pdf.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(40, 40, 40);
  pdf.text('Ringkasan Performa', margin, yPos);
  yPos += 8;

  const statRows = [
    ['Total Pesanan', data.stats.orders.toLocaleString('id-ID')],
    ['Pendapatan', formatCurrency(data.stats.revenue)],
    ['Produk Aktif', data.stats.products.toLocaleString('id-ID')],
    ['Pelanggan', data.stats.users.toLocaleString('id-ID')],
  ];

  autoTable(pdf, {
    startY: yPos,
    head: [['Metrik', 'Nilai']],
    body: statRows,
    theme: 'striped',
    headStyles: { fillColor: [180, 83, 9], textColor: 255 },
    margin: { left: margin, right: margin },
    styles: { fontSize: 10, cellPadding: 3 },
  });

  yPos = (pdf as any).lastAutoTable.finalY + 10;

  for (const chartEl of chartElements) {
    if (yPos > pageHeight - 60) {
      pdf.addPage();
      yPos = margin;
    }

    const element = document.getElementById(chartEl.id);
    if (element) {
      try {
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
        });

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pageWidth - 2 * margin;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        if (yPos + imgHeight > pageHeight - margin) {
          pdf.addPage();
          yPos = margin;
        }

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(12);
        pdf.setTextColor(40, 40, 40);
        pdf.text(chartEl.title, margin, yPos);
        yPos += 6;

        pdf.addImage(imgData, 'PNG', margin, yPos, imgWidth, imgHeight);
        yPos += imgHeight + 8;
      } catch (err) {
        console.warn(`Failed to capture chart ${chartEl.id}:`, err);
      }
    }
  }

  if (yPos > pageHeight - 80) {
    pdf.addPage();
    yPos = margin;
  }

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(40, 40, 40);
  pdf.text('Produk Terlaris', margin, yPos);
  yPos += 8;

  const productRows = data.topProducts.map((p, i) => [
    (i + 1).toString(),
    p.name,
    p.total_sold.toLocaleString('id-ID'),
    formatCurrency(p.total_revenue),
  ]);

  autoTable(pdf, {
    startY: yPos,
    head: [['No', 'Produk', 'Terjual', 'Pendapatan']],
    body: productRows,
    theme: 'striped',
    headStyles: { fillColor: [180, 83, 9], textColor: 255 },
    margin: { left: margin, right: margin },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: { 0: { cellWidth: 15 }, 1: { cellWidth: 'auto' }, 2: { cellWidth: 25 }, 3: { cellWidth: 40 } },
  });

  yPos = (pdf as any).lastAutoTable.finalY + 10;

  if (yPos > pageHeight - 80) {
    pdf.addPage();
    yPos = margin;
  }

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(40, 40, 40);
  pdf.text('Status Pesanan', margin, yPos);
  yPos += 8;

  const statusRows = data.statusBreakdown.map((s) => [
    s.status.charAt(0).toUpperCase() + s.status.slice(1),
    s.count.toLocaleString('id-ID'),
  ]);

  autoTable(pdf, {
    startY: yPos,
    head: [['Status', 'Jumlah']],
    body: statusRows,
    theme: 'striped',
    headStyles: { fillColor: [180, 83, 9], textColor: 255 },
    margin: { left: margin, right: margin },
    styles: { fontSize: 10, cellPadding: 3 },
  });

  yPos = (pdf as any).lastAutoTable.finalY + 10;

  if (yPos > pageHeight - 80) {
    pdf.addPage();
    yPos = margin;
  }

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(40, 40, 40);
  pdf.text('Pesanan Terbaru', margin, yPos);
  yPos += 8;

  const orderRows = data.recentOrders.map((o) => [
    o.id.slice(0, 8).toUpperCase(),
    o.customer_name || o.customer_email || 'Guest',
    o.status.charAt(0).toUpperCase() + o.status.slice(1),
    formatCurrency(o.total),
    new Date(o.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
  ]);

  autoTable(pdf, {
    startY: yPos,
    head: [['ID', 'Pelanggan', 'Status', 'Total', 'Waktu']],
    body: orderRows,
    theme: 'striped',
    headStyles: { fillColor: [180, 83, 9], textColor: 255 },
    margin: { left: margin, right: margin },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: { 0: { cellWidth: 25 }, 1: { cellWidth: 'auto' }, 2: { cellWidth: 25 }, 3: { cellWidth: 30 }, 4: { cellWidth: 40 } },
  });

  return pdf.output('blob');
}

export function downloadPDF(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
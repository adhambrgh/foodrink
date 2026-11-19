import { NextRequest, NextResponse } from 'next/server';
import { getAllUsersAdmin } from '../actions';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') as any;
    const role = searchParams.get('role') as any;
    const threshold = searchParams.get('threshold');

    let activeThreshold: number | 'all' = 7;
    if (threshold === 'all') {
      activeThreshold = 'all';
    } else if (threshold) {
      const parsed = parseInt(threshold);
      if (!isNaN(parsed)) activeThreshold = parsed;
    }

    const result = await getAllUsersAdmin({
      search,
      status,
      role,
      activeThreshold,
      page: 1,
      pageSize: 1000,
    });

    const users = result.users;

    const doc = new jsPDF('landscape');
    const primaryColor = [249, 149, 26] as [number, number, number];

    doc.setFontSize(16);
    doc.setTextColor(31, 41, 55);
    doc.text('Laporan User Foodrink', 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.text(`Dibuat: ${new Date().toLocaleString('id-ID')}`, 14, 28);

    const filterParts: string[] = [];
    if (search) filterParts.push(`Pencarian: "${search}"`);
    if (status && status !== 'all') filterParts.push(`Status: ${status}`);
    if (role && role !== 'all') filterParts.push(`Role: ${role}`);
    if (activeThreshold === 'all') filterParts.push('Threshold: Semua');
    else if (typeof activeThreshold === 'number') filterParts.push(`Threshold: ${activeThreshold} hari`);
    doc.text(`Filter: ${filterParts.join(' | ') || 'Tidak ada'}`, 14, 34);
    doc.text(`Total: ${users.length} user`, 14, 40);

    const formatStatus = (status: string) => {
      const labels: Record<string, string> = {
        active: 'Aktif',
        inactive: 'Nonaktif',
        never: 'Belum Login',
        deleted: 'Terhapus',
      };
      return labels[status] || status;
    };

    const formatRelativeTime = (dateString: string | null) => {
      if (!dateString) return 'Belum pernah';
      try {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor(diffMs / (1000 * 60));

        if (diffDays > 0) return `${diffDays} hari lalu`;
        if (diffHours > 0) return `${diffHours} jam lalu`;
        if (diffMinutes > 0) return `${diffMinutes} menit lalu`;
        return 'Baru saja';
      } catch {
        return 'Tidak valid';
      }
    };

    const formatDate = (dateString: string) => {
      try {
        return new Date(dateString).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
      } catch {
        return '-';
      }
    };

    (doc as any).autoTable({
      startY: 48,
      head: [['Email', 'Nama', 'Telepon', 'Role', 'Status', 'Terakhir Login', 'Terdaftar']],
      body: users.map((u: any) => [
        u.email,
        u.name,
        u.phone,
        u.role === 'admin' ? 'Admin' : 'Customer',
        formatStatus(u.status),
        formatRelativeTime(u.last_sign_in_at),
        formatDate(u.created_at),
      ]),
      theme: 'striped',
      headStyles: { fillColor: primaryColor, textColor: 255, fontSize: 9, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2.5, textColor: [31, 41, 55] },
      alternateRowStyles: { fillColor: [250, 248, 245] },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 40 },
        2: { cellWidth: 35 },
        3: { cellWidth: 25, halign: 'center' },
        4: { cellWidth: 30, halign: 'center' },
        5: { cellWidth: 40 },
        6: { cellWidth: 35 },
      },
      margin: { left: 14, right: 14 },
      didDrawPage: (data: any) => {
        const pageCount = doc.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(156, 163, 175);
        doc.text(
          `Halaman ${data.pageNumber} dari ${pageCount}`,
          doc.internal.pageSize.width - 14,
          doc.internal.pageSize.height - 10,
          { align: 'right' }
        );
      },
    });

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="users-report-${new Date().toISOString().split('T')[0]}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Export PDF error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
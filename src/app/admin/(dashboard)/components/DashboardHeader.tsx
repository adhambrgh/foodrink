'use client';

import { useState, useRef, useEffect } from 'react';
import { Calendar, Download, ChevronDown } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { generateDashboardPDF, downloadPDF } from '@/lib/export-pdf';

type RangePreset = 'today' | '7d' | '30d' | '90d' | 'custom';

interface DashboardHeaderProps {
  initialRange?: RangePreset;
  onRangeChange?: (range: RangePreset, customStart?: Date, customEnd?: Date) => void;
  stats?: {
    orders: number;
    revenue: number;
    products: number;
    users: number;
  };
  chartIds?: string[];
}

const PRESETS: { value: RangePreset; label: string }[] = [
  { value: 'today', label: 'Hari ini' },
  { value: '7d', label: '7 hari' },
  { value: '30d', label: '30 hari' },
  { value: '90d', label: '90 hari' },
];

function formatRangeLabel(range: RangePreset, start?: Date, end?: Date): string {
  if (range === 'custom' && start && end) {
    return `${format(start, 'dd MMM', { locale: id })} - ${format(end, 'dd MMM yyyy', { locale: id })}`;
  }
  const preset = PRESETS.find((p) => p.value === range);
  return preset?.label || '7 hari';
}

export function DashboardHeader({
  initialRange = '7d',
  onRangeChange,
  stats,
  chartIds = ['revenue-chart', 'orders-chart', 'status-donut', 'top-products-table'],
}: DashboardHeaderProps) {
  const [range, setRange] = useState<RangePreset>(initialRange);
  const [customStart, setCustomStart] = useState<Date>(subDays(new Date(), 6));
  const [customEnd, setCustomEnd] = useState<Date>(new Date());
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        setIsPopoverOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePresetSelect = (preset: RangePreset) => {
    setRange(preset);
    setIsPopoverOpen(false);
    if (preset !== 'custom') {
      onRangeChange?.(preset);
    }
  };

  const handleCustomApply = () => {
    setRange('custom');
    setIsPopoverOpen(false);
    onRangeChange?.('custom', customStart, customEnd);
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const chartElements = chartIds.map((id) => ({
        id,
        title: document.getElementById(id)?.querySelector('h3')?.textContent || id,
      }));

      const pdfData = {
        range: formatRangeLabel(range, customStart, customEnd),
        stats: stats || { orders: 0, revenue: 0, products: 0, users: 0 },
        revenueSeries: [],
        ordersSeries: [],
        topProducts: [],
        statusBreakdown: [],
        recentOrders: [],
      };

      const blob = await generateDashboardPDF(pdfData, chartElements);
      downloadPDF(blob, `dashboard-foodrink-${range}-${format(new Date(), 'yyyyMMdd')}.pdf`);
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('Gagal mengekspor PDF. Silakan coba lagi.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-xl font-bold text-text font-heading">Dashboard</h1>
        <p className="text-sm text-text-muted mt-0.5">Ringkasan performa toko · {formatRangeLabel(range, customStart, customEnd)}</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative" ref={popoverRef}>
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setIsPopoverOpen(!isPopoverOpen)}
            className="flex items-center gap-2 px-3 py-2 bg-surface-card border border-border rounded-lg text-sm font-medium text-text hover:border-primary/30 hover:shadow-sm transition-all"
            aria-expanded={isPopoverOpen}
            aria-haspopup="listbox"
          >
            <Calendar className="w-4 h-4 text-text-muted" />
            <span>{formatRangeLabel(range, customStart, customEnd)}</span>
            <ChevronDown className={`w-4 h-4 text-text-muted transition-transform ${isPopoverOpen ? 'rotate-180' : ''}`} />
          </button>

          {isPopoverOpen && (
            <div className="absolute right-0 top-full mt-2 z-50 w-56 bg-surface-card border border-border rounded-lg shadow-lg p-2 animate-fade-in">
              <div className="space-y-1">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => handlePresetSelect(preset.value)}
                    className={`w-full px-3 py-2 text-sm rounded-md transition-colors text-left ${
                      range === preset.value
                        ? 'bg-primary text-white'
                        : 'text-text hover:bg-surface-variant'
                    }`}
                    role="option"
                    aria-selected={range === preset.value}
                  >
                    {preset.label}
                  </button>
                ))}
                <hr className="my-2 border-border" />
                <div className="px-2">
                  <label className="block text-xs text-text-muted mb-1">Dari</label>
                  <input
                    type="date"
                    value={format(customStart, 'yyyy-MM-dd')}
                    onChange={(e) => setCustomStart(parseISO(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-surface-variant border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="px-2">
                  <label className="block text-xs text-text-muted mb-1">Sampai</label>
                  <input
                    type="date"
                    value={format(customEnd, 'yyyy-MM-dd')}
                    onChange={(e) => setCustomEnd(parseISO(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-surface-variant border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleCustomApply}
                  className="w-full mt-2 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-md transition-colors"
                >
                  Terapkan
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleExportPDF}
          disabled={isExporting}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium text-sm hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          {isExporting ? 'Mengekspor...' : 'Ekspor PDF'}
        </button>
      </div>
    </div>
  );
}
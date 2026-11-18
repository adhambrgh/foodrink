'use client';

export interface SparklineProps {
  data: number[];
  color: string;
  width?: number;
  height?: number;
}

export function Sparkline({ data, color, width = 60, height = 24 }: SparklineProps) {
  if (data.length === 0) return null;
  
  const maxVal = Math.max(...data, 1);
  const minVal = Math.min(...data);
  
  const path = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - minVal) / (maxVal - minVal || 1)) * height;
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="flex-shrink-0" aria-hidden="true">
      <defs>
        <linearGradient id={`spark-${color.replace(/[^a-zA-Z0-9]/g, '')}-${width}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path
        d={path}
        stroke={color}
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={`${path} L ${width} ${height} L 0 ${height} Z`}
        stroke="transparent"
        strokeWidth={2}
        fill={`url(#spark-${color.replace(/[^a-zA-Z0-9]/g, '')}-${width})`}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
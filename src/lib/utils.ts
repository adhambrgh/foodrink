export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function normalizePhone(input: string): string {
  const trimmed = input.trim().replace(/[\s-()]/g, '');
  if (trimmed.startsWith('+')) return trimmed;
  if (trimmed.startsWith('0')) return '+62' + trimmed.slice(1);
  if (trimmed.startsWith('62')) return '+' + trimmed;
  return trimmed;
}

export function cn(...inputs: (string | undefined | null | false | Record<string, boolean>)[]) {
  return inputs
    .flatMap((input) => {
      if (typeof input === 'string') return input.split(' ');
      if (input && typeof input === 'object') {
        return Object.entries(input)
          .filter(([, v]) => v)
          .map(([k]) => k);
      }
      return [];
    })
    .filter(Boolean)
    .join(' ');
}
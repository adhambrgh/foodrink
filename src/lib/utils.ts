export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
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
// UUID generator
export function generateOrderId(): string {
  return crypto.randomUUID();
}

// Remove unused function
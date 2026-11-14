import crypto from 'crypto';

export function generateOrderId(): string {
  return crypto.randomUUID();
}

export function getQrisImageUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_QRIS_IMAGE_URL?.trim();
  return url || null;
}

export function getQrisMerchantName(): string {
  return process.env.NEXT_PUBLIC_QRIS_MERCHANT_NAME?.trim() || 'FoodDrink';
}

export function getQrisMerchantId(): string {
  return process.env.NEXT_PUBLIC_QRIS_MERCHANT_ID?.trim() || '';
}

export function isQrisConfigured(): boolean {
  return !!getQrisImageUrl();
}
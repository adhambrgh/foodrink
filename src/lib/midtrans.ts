import crypto from 'crypto';

export function generateOrderId(): string {
  return crypto.randomUUID();
}

export function isMidtransProduction(): boolean {
  return process.env.MIDTRANS_IS_PRODUCTION === 'true';
}

export function getSnapUrl(token: string, orderId: string): string {
  return `https://app.${isMidtransProduction() ? 'midtrans.com' : 'sandbox.midtrans.com'}/snap/v4/redirection/${token}?order_id=${encodeURIComponent(orderId)}`;
}

export function getAppUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (!url) {
    throw new Error(
      'NEXT_PUBLIC_APP_URL is not set. Add it to .env.local (e.g. http://localhost:3000 or your public domain).'
    );
  }

  const normalized = url.replace(/\/+$/, '');
  return normalized.endsWith('/') ? normalized : `${normalized}/`;
}

export async function verifyMidtransTransaction(orderId: string) {
  const serverKey = process.env.MIDTRANS_SERVER_KEY!;
  const baseUrl = isMidtransProduction()
    ? 'https://app.midtrans.com'
    : 'https://app.sandbox.midtrans.com';
  const endpoint = `${baseUrl}/snap/v1/transactions/${orderId}/status`;
  const auth = Buffer.from(`${serverKey}:`).toString('base64');

  const response = await fetch(endpoint, {
    headers: {
      'Authorization': `Basic ${auth}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Midtrans verify failed: ${response.status}`);
  }

  const data = await response.json();
  const transaction_status = data.transaction_status;
  const fraud_status = data.fraud_status;

  const paid = transaction_status === 'settlement' || (transaction_status === 'capture' && fraud_status === 'accept');

  return { paid, transaction_status, fraud_status, data };
}

export async function createMidtransTransaction(params: {
  orderId: string;
  grossAmount: number;
  items: { id: string; price: number; quantity: number; name: string }[];
  customerDetails?: { firstName: string; email?: string; phone?: string; address?: string };
}) {
  const serverKey = process.env.MIDTRANS_SERVER_KEY!;
  const baseUrl = isMidtransProduction()
    ? 'https://app.midtrans.com/snap/v1/transactions'
    : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

  const itemDetails = params.items.map(item => ({
    id: item.id,
    price: item.price,
    quantity: item.quantity,
    name: item.name,
  }));

  const appUrl = getAppUrl();
  const finishUrl = `${appUrl}checkout/success/${params.orderId}`;
  const callbacks = {
    finish: finishUrl,
    error: `${finishUrl}?payment_failed=true`,
    pending: `${finishUrl}?payment_failed=true`,
  };

  const payload = {
    transaction_details: {
      order_id: params.orderId,
      gross_amount: params.grossAmount,
    },
    item_details: itemDetails,
    customer_details: params.customerDetails,
    callbacks,
  };

  const auth = Buffer.from(`${serverKey}:`).toString('base64');

  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Basic ${auth}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error_messages?.join(', ') || 'Failed to create Midtrans transaction');
  }

  return {
    token: data.token,
    redirectUrl: data.redirect_url,
  };
}
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { createMidtransTransaction, getAppUrl } from '../src/lib/midtrans';

describe('getAppUrl', () => {
  it('normalize trailing slash', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000/';
    expect(getAppUrl()).toBe('http://localhost:3000/');
    delete process.env.NEXT_PUBLIC_APP_URL;
  });
});

describe('createMidtransTransaction', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000/';
    (global as Record<string, unknown>).fetch = vi.fn();
  });

  it('submits payload and returns token', async () => {
    const fetchMock = vi.fn();
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        token: 'token-1',
      }),
    });
    (global as Record<string, unknown>).fetch = fetchMock;

    const result = await createMidtransTransaction({
      orderId: 'ord-1',
      grossAmount: 20000,
      items: [
        { id: 'p1', price: 10000, quantity: 2, name: 'Nasi Goreng' },
      ],
    });

    expect(result.token).toBe('token-1');
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const requestBody = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(requestBody.transaction_details.order_id).toBe('ord-1');
    expect(requestBody.transaction_details.gross_amount).toBe(20000);
    expect(requestBody.callbacks.finish).toBe('http://localhost:3000/checkout/success/ord-1');
    expect(requestBody.callbacks.error).toBe('http://localhost:3000/checkout/success/ord-1?payment_failed=true');
    expect(requestBody.callbacks.pending).toBe('http://localhost:3000/checkout/success/ord-1?payment_failed=true');
  });
});

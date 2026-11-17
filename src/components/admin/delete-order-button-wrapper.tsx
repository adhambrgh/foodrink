'use client';

import DeleteOrderButton from './delete-order-button';

interface DeleteOrderButtonWrapperProps {
  orderId: string;
  redirectTo?: string;
  variant?: 'icon' | 'button';
}

export default function DeleteOrderButtonWrapper({
  orderId,
  redirectTo = '/admin/pesanan',
  variant = 'icon',
}: DeleteOrderButtonWrapperProps) {
  return <DeleteOrderButton orderId={orderId} redirectTo={redirectTo} variant={variant} />;
}
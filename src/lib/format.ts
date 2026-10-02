export function formatCurrency(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-IN').format(n);
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/** PaymentMode: COD = 1 */
export function paymentModeLabel(mode: number): string {
  if (mode === 1) return 'Cash on Delivery';
  return `Mode ${mode}`;
}

/** OrderSource: Online = 1, Offline = 2 */
export function orderSourceLabel(source: number): string {
  if (source === 1) return 'Online';
  if (source === 2) return 'Offline';
  return `Source ${source}`;
}

export function orderStatusTone(
  status: number,
): 'success' | 'danger' | 'warning' | 'neutral' | 'brand' {
  switch (status) {
    case 1:
      return 'warning'; // Placed
    case 2:
      return 'brand'; // Accepted
    case 3:
      return 'warning'; // Preparing
    case 4:
      return 'brand'; // Out for delivery
    case 5:
      return 'success'; // Delivered
    case 6:
      return 'danger'; // Cancelled
    default:
      return 'neutral';
  }
}

export function paymentStatusTone(
  status: number,
): 'success' | 'danger' | 'warning' | 'neutral' | 'brand' {
  if (status === 2) return 'success';
  if (status === 1) return 'warning';
  return 'neutral';
}

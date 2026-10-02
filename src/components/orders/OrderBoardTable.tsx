import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatTime,
  orderStatusTone,
  paymentModeLabel,
  paymentStatusTone,
} from '@/lib/format';
import type { OrderListItemDto } from '@/types/api';

function itemsLabel(order: OrderListItemDto): string {
  const name = order.preview_product_name?.trim() || 'Items';
  if (order.item_count > 1) return `${name} +${order.item_count - 1}`;
  return name;
}

interface OrderBoardTableProps {
  orders: OrderListItemDto[];
  showEta?: boolean;
  showAccepted?: boolean;
  cancelledStyle?: boolean;
}

export function OrderBoardTable({
  orders,
  showEta = false,
  showAccepted = false,
  cancelledStyle = false,
}: OrderBoardTableProps) {
  const navigate = useNavigate();

  return (
    <div className="overflow-x-auto border-y border-ink-100">
      <table className="w-full min-w-[960px] text-left text-sm">
        <thead>
          <tr className="border-b border-ink-100 text-[11px] font-semibold tracking-wide text-ink-400 uppercase">
            <th className="py-3 pr-3 font-semibold">Customer</th>
            <th className="py-3 pr-3 font-semibold">Token</th>
            <th className="py-3 pr-3 font-semibold">Order No.</th>
            <th className="py-3 pr-3 font-semibold">Items</th>
            <th className="py-3 pr-3 font-semibold">Contact</th>
            <th className="py-3 pr-3 font-semibold">Area</th>
            <th className="py-3 pr-3 font-semibold">Time</th>
            {showAccepted && <th className="py-3 pr-3 font-semibold">Accepted</th>}
            {showEta && <th className="py-3 pr-3 font-semibold">ETA</th>}
            <th className="py-3 pr-3 font-semibold">Payment</th>
            <th className="py-3 pr-3 font-semibold">Status</th>
            <th className="py-3 font-semibold">Total</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr
              key={o.order_id}
              role="link"
              tabIndex={0}
              onClick={() => navigate(`/orders/${o.order_id}`)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(`/orders/${o.order_id}`);
                }
              }}
              className={`cursor-pointer border-b transition last:border-0 ${
                cancelledStyle
                  ? 'border-red-200 hover:bg-red-50/70'
                  : 'border-ink-50 hover:bg-brand-50/30'
              }`}
            >
              <td className="py-3.5 pr-3">
                <p className="font-semibold text-ink-900">
                  {o.receiver_name?.trim() || 'Customer'}
                </p>
              </td>
              <td className="py-3.5 pr-3">
                <p className="text-base font-bold text-ink-900 tabular-nums">
                  {o.token > 0 ? o.token : '—'}
                </p>
              </td>
              <td className="py-3.5 pr-3">
                <p className="font-mono text-xs text-ink-600">{o.order_number}</p>
              </td>
              <td className="py-3.5 pr-3">
                <p className="font-medium text-ink-800">{itemsLabel(o)}</p>
                <p className="text-xs text-ink-400">
                  {o.item_count} item{o.item_count === 1 ? '' : 's'}
                </p>
              </td>
              <td className="py-3.5 pr-3 text-ink-600">{o.receiver_contact || '—'}</td>
              <td className="py-3.5 pr-3 text-ink-600">{o.delivery_area || '—'}</td>
              <td className="py-3.5 pr-3">
                <p className="font-medium text-ink-800">{formatTime(o.created_at)}</p>
                <p className="text-xs text-ink-400">{formatDate(o.created_at)}</p>
              </td>
              {showAccepted && (
                <td className="py-3.5 pr-3 text-ink-600">
                  {o.accepted_at ? formatDateTime(o.accepted_at) : '—'}
                </td>
              )}
              {showEta && (
                <td className="py-3.5 pr-3 text-ink-600">
                  {o.estimated_delivery_minutes != null
                    ? `${o.estimated_delivery_minutes} min`
                    : '—'}
                  {o.estimated_delivery_at && (
                    <p className="text-xs text-ink-400">
                      {formatDateTime(o.estimated_delivery_at)}
                    </p>
                  )}
                </td>
              )}
              <td className="py-3.5 pr-3">
                <div className="flex flex-col gap-1">
                  <span className="text-ink-700">{paymentModeLabel(o.payment_mode)}</span>
                  <Badge tone={paymentStatusTone(o.payment_status)}>
                    {o.payment_status_text}
                  </Badge>
                </div>
              </td>
              <td className="py-3.5 pr-3">
                <Badge tone={orderStatusTone(o.status)}>{o.status_text}</Badge>
              </td>
              <td className="py-3.5 font-display text-base font-bold text-ink-900">
                {formatCurrency(o.grand_total, o.currency || 'INR')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

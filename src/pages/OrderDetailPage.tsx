import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Package } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Select, Textarea } from '@/components/ui/Input';
import { ConfirmDialog, Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/context/ToastContext';
import { cancelOrder, getOrderByOrderId, requestThermalPrint, transferOrder, updateOrderStatus } from '@/api/orders';
import type { ThermalPrintMode } from '@/api/orders';
import { ThermalPrintModal } from '@/components/orders/ThermalPrintModal';
import { getAllStores } from '@/api/stores';
import { ApiError } from '@/lib/apiClient';
import {
  formatCurrency,
  formatDateTime,
  orderSourceLabel,
  orderStatusTone,
  paymentModeLabel,
  paymentStatusTone,
} from '@/lib/format';
import { ETA_MINUTE_OPTIONS, OrderStatus } from '@/lib/orderStatus';
import type { OrderDetailsDto, StoreListItemDto } from '@/types/api';

function Meta({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold tracking-wide text-ink-400 uppercase">{label}</p>
      <p className="mt-0.5 text-sm font-medium break-words text-ink-800">{value ?? '—'}</p>
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-2.5 font-display text-sm font-bold tracking-wide text-ink-900 uppercase">
      {children}
    </h2>
  );
}

export function OrderDetailPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [order, setOrder] = useState<OrderDetailsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [etaMinutes, setEtaMinutes] = useState('15');
  const [actionLoading, setActionLoading] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [deliverOpen, setDeliverOpen] = useState(false);

  const [transferOpen, setTransferOpen] = useState(false);
  const [stores, setStores] = useState<StoreListItemDto[]>([]);
  const [storesLoading, setStoresLoading] = useState(false);
  const [toStoreId, setToStoreId] = useState('');
  const [transferReason, setTransferReason] = useState('Not Available');
  const [thermalOpen, setThermalOpen] = useState(false);
  const [thermalLoading, setThermalLoading] = useState(false);
  const [pendingNav, setPendingNav] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    setError('');
    try {
      const data = await getOrderByOrderId(orderId);
      setOrder(data);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to load order';
      setError(message);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void load();
  }, [load]);

  const changeStatus = async (
    status: number,
    estimatedDeliveryMinutes?: number,
    navigateTo?: string,
  ) => {
    if (!order) return;
    setActionLoading(true);
    try {
      const updated = await updateOrderStatus({
        orderId: order.order_id,
        status,
        estimatedDeliveryMinutes,
      });
      setOrder(updated);
      toast(`Order marked as ${updated.status_text}`);
      if (status === OrderStatus.Accepted) {
        setPendingNav(navigateTo ?? null);
        setThermalOpen(true);
        return;
      }
      if (navigateTo) navigate(navigateTo);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to update order';
      toast(message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const closeThermalModal = () => {
    setThermalOpen(false);
    const nav = pendingNav;
    setPendingNav(null);
    if (nav) navigate(nav);
  };

  const handleThermalPrint = async (mode: ThermalPrintMode) => {
    if (!order) return;
    setThermalLoading(true);
    try {
      await requestThermalPrint({ orderId: order.order_id, mode });
      toast('Print request sent to store printer');
      closeThermalModal();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to request print';
      toast(message, 'error');
    } finally {
      setThermalLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!order) return;
    setActionLoading(true);
    try {
      const reason = cancelReason.trim();
      const updated = await cancelOrder({
        orderId: order.order_id,
        cancelReason: reason || null,
      });
      setOrder(updated);
      setCancelOpen(false);
      setCancelReason('');
      toast('Order cancelled');
      window.alert('Order cancelled');
      navigate(-1);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to cancel order';
      toast(message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const openTransfer = async () => {
    setTransferOpen(true);
    setTransferReason('Not Available');
    setToStoreId('');
    setStoresLoading(true);
    try {
      const list = await getAllStores();
      setStores(list ?? []);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to load stores';
      toast(message, 'error');
      setStores([]);
    } finally {
      setStoresLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (!order) return;
    if (!toStoreId) {
      toast('Select a destination store', 'error');
      return;
    }
    if (toStoreId.toLowerCase() === (order.store_id || '').toLowerCase()) {
      toast('Destination store must be different from current store.', 'error');
      return;
    }

    setActionLoading(true);
    try {
      const reason = transferReason.trim();
      await transferOrder({
        orderId: order.order_id,
        toStoreId,
        reason: reason || null,
      });
      setTransferOpen(false);
      setToStoreId('');
      setTransferReason('Not Available');
      toast('Order transferred');
      window.alert('Order transferred');
      navigate('/live-orders');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to transfer order';
      toast(message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <EmptyState
        title="Order not found"
        description={error || 'This order could not be loaded.'}
        actionLabel="Back to Live Orders"
        onAction={() => navigate('/live-orders')}
      />
    );
  }

  const address = order.address;
  const cancelledByLabel =
    order.cancelled_by == null
      ? '—'
      : order.cancelled_by === order.user_id
        ? 'Customer'
        : 'You';
  const addressLine = address
    ? [address.line1, address.line2, address.city, address.state, address.pin_code, address.country]
        .filter(Boolean)
        .join(', ')
    : '—';

  const isPlaced = order.status === OrderStatus.Placed;
  const isAccepted = order.status === OrderStatus.Accepted;
  const isPreparing = order.status === OrderStatus.Preparing;
  const isOutForDelivery = order.status === OrderStatus.OutForDelivery;
  const canCancel =
    order.status === OrderStatus.Placed ||
    order.status === OrderStatus.Accepted ||
    order.status === OrderStatus.Preparing ||
    order.status === OrderStatus.OutForDelivery;
  const canTransfer = isPlaced || isAccepted;
  const canThermalPrint =
    order.status === OrderStatus.Accepted ||
    order.status === OrderStatus.Preparing ||
    order.status === OrderStatus.OutForDelivery ||
    order.status === OrderStatus.Delivered;

  const transferStoreOptions = (() => {
    const currentId = (order.store_id || '').toLowerCase();
    return stores
      .filter((s) => s.status && s.store_id.toLowerCase() !== currentId)
      .map((s) => ({
        value: s.store_id,
        label: s.address ? `${s.store_name} — ${s.address}` : s.store_name,
      }));
  })();

  const hasAcceptanceDetails =
    order.estimated_delivery_minutes != null ||
    order.estimated_delivery_at != null ||
    order.accepted_at != null ||
    order.accepted_by != null;

  const handleAccept = () => {
    const minutes = Number(etaMinutes);
    if (!minutes || minutes <= 0) {
      toast('Select estimated delivery time', 'error');
      return;
    }
    void changeStatus(OrderStatus.Accepted, minutes, '/running-orders');
  };

  const openCancel = (defaultReason = '') => {
    setCancelReason(defaultReason);
    setCancelOpen(true);
  };

  return (
    <div>
      <PageHeader
        title={order.token > 0 ? `Token #${order.token}` : order.order_number}
        subtitle={`${order.order_number} · ${formatDateTime(order.created_at)}${order.store_name ? ` · ${order.store_name}` : ''}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {canThermalPrint && (
              <Button onClick={() => setThermalOpen(true)} disabled={actionLoading || thermalLoading}>
                Generate Bill &amp; Token
              </Button>
            )}
            <Button variant="outline" icon={<ArrowLeft className="size-4" />} onClick={() => navigate(-1)}>
              Back
            </Button>
          </div>
        }
      />

      <section className="border-b border-ink-100 pb-4">
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          <Badge tone={orderStatusTone(order.status)}>{order.status_text}</Badge>
          <Badge tone={paymentStatusTone(order.payment_status)}>{order.payment_status_text}</Badge>
          <Badge tone="neutral">{paymentModeLabel(order.payment_mode)}</Badge>
          <Badge tone="brand">{orderSourceLabel(order.order_source)}</Badge>
        </div>

        <SectionTitle>Order</SectionTitle>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-3 lg:grid-cols-4">
          <Meta label="Token No." value={order.token > 0 ? String(order.token) : '—'} />
          <Meta label="Order No." value={order.order_number} />
          <Meta label="Order ID" value={order.order_id} />
          <Meta label="User ID" value={order.user_id || '—'} />
          <Meta label="Store" value={order.store_name || '—'} />
          <Meta label="Store ID" value={order.store_id || '—'} />
          <Meta label="Original Store ID" value={order.original_store_id || '—'} />
          <Meta label="Currency" value={order.currency} />
          <Meta label="Subtotal" value={formatCurrency(order.subtotal, order.currency)} />
          <Meta label="Discount" value={formatCurrency(order.discount_total, order.currency)} />
          <Meta label="Delivery Fee" value={formatCurrency(order.delivery_fee, order.currency)} />
          {order.bill_gst_enabled && order.bill_cgst_amount != null && (
            <Meta
              label={`CGST${order.bill_gst_percent != null ? ` (${order.bill_gst_percent / 2}%)` : ''}`}
              value={formatCurrency(order.bill_cgst_amount, order.currency)}
            />
          )}
          {order.bill_gst_enabled && order.bill_sgst_amount != null && (
            <Meta
              label={`SGST${order.bill_gst_percent != null ? ` (${order.bill_gst_percent / 2}%)` : ''}`}
              value={formatCurrency(order.bill_sgst_amount, order.currency)}
            />
          )}
          <Meta label="Grand Total" value={formatCurrency(order.grand_total, order.currency)} />
          <Meta label="Created" value={formatDateTime(order.created_at)} />
          <Meta label="Updated" value={formatDateTime(order.updated_at)} />
          <Meta label="Cancelled" value={formatDateTime(order.cancelled_at)} />
          <Meta label="Cancel Reason" value={order.cancel_reason || '—'} />
          <Meta label="Cancelled By" value={cancelledByLabel} />
          <Meta label="Notes" value={order.note || '—'} />
        </div>

        {hasAcceptanceDetails && (
          <div className="mt-4 border-t border-ink-50 pt-3">
            <SectionTitle>Acceptance</SectionTitle>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-3 lg:grid-cols-4">
              {order.estimated_delivery_minutes != null && (
                <Meta
                  label="Est. Delivery (min)"
                  value={`${order.estimated_delivery_minutes} minutes`}
                />
              )}
              {order.estimated_delivery_at != null && (
                <Meta
                  label="Est. Delivery At"
                  value={formatDateTime(order.estimated_delivery_at)}
                />
              )}
              {order.accepted_at != null && (
                <Meta label="Accepted At" value={formatDateTime(order.accepted_at)} />
              )}
              {order.accepted_by != null && (
                <Meta label="Accepted By" value={order.accepted_by} />
              )}
            </div>
          </div>
        )}
      </section>

      <section className="border-b border-ink-100 py-4">
        <SectionTitle>Items ({order.items.length})</SectionTitle>
        <ul>
          {order.items.map((item, index) => (
            <li
              key={item.order_item_id}
              className={`flex gap-3 py-3 ${index > 0 ? 'border-t border-ink-50' : ''}`}
            >
              <div className="size-14 shrink-0 overflow-hidden rounded-lg bg-ink-50 sm:size-16">
                {item.primary_image_url ? (
                  <img
                    src={item.primary_image_url}
                    alt={item.product_name}
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center text-ink-300">
                    <Package className="size-6" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-0.5">
                  <div className="min-w-0">
                    <p className="font-display text-sm font-bold text-ink-900 sm:text-base">
                      {item.product_name}
                    </p>
                    <p className="text-xs text-ink-500">
                      {[item.category_name, item.display_text, item.sku ? `SKU ${item.sku}` : null]
                        .filter(Boolean)
                        .join(' · ') || '—'}
                    </p>
                  </div>
                  <p className="shrink-0 font-display text-sm font-bold text-brand-600 sm:text-base">
                    {formatCurrency(item.line_total, item.currency)}
                  </p>
                </div>

                {item.short_description && (
                  <p className="mt-1 text-xs text-ink-500">{item.short_description}</p>
                )}

                <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 sm:grid-cols-4 lg:grid-cols-6">
                  <Meta label="Qty" value={item.quantity} />
                  <Meta label="MRP" value={formatCurrency(item.mrp, item.currency)} />
                  <Meta label="Price" value={formatCurrency(item.selling_price, item.currency)} />
                  <Meta label="Discount" value={`${item.discount_percent}%`} />
                  <Meta
                    label="Pack"
                    value={
                      [item.pack_size, item.packaging_unit].filter(Boolean).join(' ') || '—'
                    }
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-b border-ink-100 py-4">
        <SectionTitle>Delivery Address</SectionTitle>
        {!address ? (
          <p className="text-sm text-ink-500">No address on this order.</p>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-3 lg:grid-cols-4">
            <Meta label="Receiver" value={address.receiver_name || '—'} />
            <Meta label="Contact" value={address.receiver_contact || '—'} />
            <Meta label="Label" value={address.label || '—'} />
            <Meta label="Line 1" value={address.line1 || '—'} />
            <Meta label="Line 2" value={address.line2 || '—'} />
            <Meta label="City" value={address.city || '—'} />
            <Meta label="State" value={address.state || '—'} />
            <Meta label="PIN" value={address.pin_code || '—'} />
            <div className="col-span-2 sm:col-span-3 lg:col-span-4">
              <Meta label="Full Address" value={addressLine} />
            </div>
          </div>
        )}
      </section>

      {isPlaced && (
        <section className="pt-4">
          <div className="max-w-xs">
            <Select
              label="Estimated Delivery Time"
              options={ETA_MINUTE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
              value={etaMinutes}
              onChange={(e) => setEtaMinutes(e.target.value)}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={handleAccept} loading={actionLoading}>
              Accept Order
            </Button>
            <Button
              variant="outline"
              onClick={() => void openTransfer()}
              disabled={actionLoading}
            >
              Transfer Order
            </Button>
            <Button
              variant="danger"
              onClick={() => openCancel('Not Available')}
              disabled={actionLoading}
            >
              Reject (Not Available)
            </Button>
          </div>
        </section>
      )}

      {(isAccepted || isPreparing) && (
        <section className="flex flex-wrap gap-2 pt-4">
          {isAccepted && (
            <Button
              variant="outline"
              loading={actionLoading}
              onClick={() => void changeStatus(OrderStatus.Preparing)}
            >
              Mark Preparing
            </Button>
          )}
          <Button
            loading={actionLoading}
            onClick={() =>
              void changeStatus(OrderStatus.OutForDelivery, undefined, '/out-for-delivery')
            }
          >
            Out for Delivery
          </Button>
          {canTransfer && (
            <Button
              variant="outline"
              disabled={actionLoading}
              onClick={() => void openTransfer()}
            >
              Transfer Order
            </Button>
          )}
          {canCancel && (
            <Button
              variant="danger"
              disabled={actionLoading}
              onClick={() => openCancel()}
            >
              Cancel Order
            </Button>
          )}
        </section>
      )}

      {isOutForDelivery && (
        <section className="flex flex-wrap gap-2 pt-4">
          <Button loading={actionLoading} onClick={() => setDeliverOpen(true)}>
            Mark as Delivered
          </Button>
          {canCancel && (
            <Button
              variant="danger"
              disabled={actionLoading}
              onClick={() => openCancel()}
            >
              Cancel Order
            </Button>
          )}
        </section>
      )}

      <Modal
        open={cancelOpen}
        onClose={() => {
          if (actionLoading) return;
          setCancelOpen(false);
          setCancelReason('');
        }}
        title={isPlaced ? 'Reject Order?' : 'Cancel Order?'}
        description={
          isPlaced
            ? 'This will cancel the order and restore stock to inventory.'
            : 'This will cancel the order and restore item quantities to inventory.'
        }
        size="sm"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setCancelOpen(false);
                setCancelReason('');
              }}
              disabled={actionLoading}
            >
              Keep Order
            </Button>
            <Button variant="danger" loading={actionLoading} onClick={() => void handleCancel()}>
              {isPlaced ? 'Reject' : 'Cancel Order'}
            </Button>
          </>
        }
      >
        <Textarea
          label="Cancel reason (optional)"
          placeholder="e.g. Out of stock"
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
          rows={3}
        />
      </Modal>

      <Modal
        open={transferOpen}
        onClose={() => {
          if (actionLoading) return;
          setTransferOpen(false);
          setToStoreId('');
          setTransferReason('Not Available');
        }}
        title="Transfer Order"
        description="Move this order to another store. Status will reset to Placed at the destination."
        size="md"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setTransferOpen(false);
                setToStoreId('');
                setTransferReason('Not Available');
              }}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              loading={actionLoading}
              disabled={storesLoading || !toStoreId}
              onClick={() => void handleTransfer()}
            >
              Transfer
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-ink-500">
            Current store:{' '}
            <span className="font-semibold text-ink-800">{order.store_name || '—'}</span>
          </p>
          {storesLoading ? (
            <p className="text-sm text-ink-500">Loading stores...</p>
          ) : transferStoreOptions.length === 0 ? (
            <p className="text-sm text-danger">No other active stores available to transfer.</p>
          ) : (
            <Select
              label="Transfer to store"
              placeholder="Select store"
              options={transferStoreOptions}
              value={toStoreId}
              onChange={(e) => setToStoreId(e.target.value)}
            />
          )}
          <Textarea
            label="Reason (optional)"
            placeholder="e.g. Not Available"
            value={transferReason}
            onChange={(e) => setTransferReason(e.target.value)}
            rows={3}
            maxLength={300}
          />
        </div>
      </Modal>

      <ConfirmDialog
        open={deliverOpen}
        onClose={() => setDeliverOpen(false)}
        onConfirm={() => {
          setDeliverOpen(false);
          void changeStatus(OrderStatus.Delivered, undefined, '/completed-orders');
        }}
        title="Mark as Delivered?"
        message="This order will move to Completed Orders."
        confirmLabel="Mark Delivered"
        loading={actionLoading}
      />

      <ThermalPrintModal
        open={thermalOpen}
        loading={thermalLoading}
        onClose={closeThermalModal}
        onSelect={(mode) => void handleThermalPrint(mode)}
      />
    </div>
  );
}

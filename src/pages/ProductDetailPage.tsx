import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, PackagePlus, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { ConfirmDialog } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  addToInventory,
  getProductById,
  removeFromInventory,
  updateInventoryQuantity,
} from '@/api/products';
import { ApiError } from '@/lib/apiClient';
import { PERMISSION, permissionRequiredMessage } from '@/lib/permissions';
import { formatCurrency, formatDateTime } from '@/lib/format';
import type { ProductDetailsDto } from '@/types/api';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=800&h=800&fit=crop';

export function ProductDetailPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, hasPermission } = useAuth();
  const { toast } = useToast();
  const canAdd = hasPermission(PERMISSION.AddProductToStore);
  const canRemove = hasPermission(PERMISSION.RemoveProductFromStore);
  const canModifyQty = hasPermission(PERMISSION.ModifyProductInventory);

  const fromAdd = (location.state as { from?: string } | null)?.from === 'add';

  const [product, setProduct] = useState<ProductDetailsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [inInventory, setInInventory] = useState(false);
  const [quantityOnHand, setQuantityOnHand] = useState<number | null>(null);
  const [quantityInput, setQuantityInput] = useState('');
  const [adding, setAdding] = useState(false);
  const [updatingQty, setUpdatingQty] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);

  const applyInventoryState = (data: ProductDetailsDto) => {
    const qty = data.quantity_on_hand;
    const listed = qty != null;
    setInInventory(listed);
    setQuantityOnHand(listed ? qty : null);
    setQuantityInput(listed ? String(qty) : '');
  };

  const load = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const data = await getProductById(productId, profile.storeId || null);
      setProduct(data);
      applyInventoryState(data);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Failed to load product', 'error');
      setProduct(null);
    } finally {
      setLoading(false);
    }
  }, [productId, profile.storeId, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleAdd = async () => {
    if (!canAdd) {
      toast(permissionRequiredMessage(PERMISSION.AddProductToStore), 'error');
      return;
    }
    if (!product || !profile.storeId) {
      toast('No store assigned to this account', 'error');
      return;
    }
    setAdding(true);
    try {
      const result = await addToInventory({
        productId: product.product_id,
        storeId: profile.storeId,
      });
      const qty = result.quantity_on_hand ?? 0;
      setInInventory(true);
      setQuantityOnHand(qty);
      setQuantityInput(String(qty));
      setProduct((prev) => (prev ? { ...prev, quantity_on_hand: qty } : prev));
      toast(`"${product.product_name}" added to inventory`);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Failed to add to inventory', 'error');
    } finally {
      setAdding(false);
    }
  };

  const handleUpdateQuantity = async () => {
    if (!canModifyQty) {
      toast(permissionRequiredMessage(PERMISSION.ModifyProductInventory), 'error');
      return;
    }
    if (!product || !profile.storeId) {
      toast('No store assigned to this account', 'error');
      return;
    }
    const quantity = Number(quantityInput);
    if (!Number.isInteger(quantity) || quantity < 0) {
      toast('Enter a valid quantity (0 or more)', 'error');
      return;
    }
    setUpdatingQty(true);
    try {
      const result = await updateInventoryQuantity({
        productId: product.product_id,
        storeId: profile.storeId,
        quantity,
      });
      setQuantityOnHand(result.quantity_on_hand);
      setQuantityInput(String(result.quantity_on_hand));
      setProduct((prev) =>
        prev ? { ...prev, quantity_on_hand: result.quantity_on_hand } : prev,
      );
      toast('Inventory quantity updated');
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Failed to update quantity', 'error');
    } finally {
      setUpdatingQty(false);
    }
  };

  const handleRemove = async () => {
    if (!canRemove) {
      toast(permissionRequiredMessage(PERMISSION.RemoveProductFromStore), 'error');
      return;
    }
    if (!product || !profile.storeId) {
      toast('No store assigned to this account', 'error');
      return;
    }
    setRemoving(true);
    try {
      await removeFromInventory({
        productId: product.product_id,
        storeId: profile.storeId,
      });
      toast(`"${product.product_name}" removed from inventory`);
      navigate('/products');
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Failed to remove from inventory', 'error');
      setRemoving(false);
      setRemoveOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-ink-500">
        <Loader2 className="size-5 animate-spin" />
        Loading product...
      </div>
    );
  }

  if (!product) {
    return (
      <EmptyState
        title="Product not found"
        description="This product could not be loaded."
        actionLabel="Back to Products"
        onAction={() => navigate('/products')}
      />
    );
  }

  const images = product.images?.length
    ? [...product.images].sort((a, b) => a.sort_order - b.sort_order)
    : [{ url: FALLBACK_IMAGE, is_primary: true, sort_order: 0 }];
  const hero = images.find((i) => i.is_primary)?.url || images[0].url;

  return (
    <div>
      <PageHeader
        title={product.product_name}
        subtitle={product.category_name}
        actions={
          <>
            <Button
              variant="outline"
              icon={<ArrowLeft className="size-4" />}
              onClick={() => navigate(fromAdd ? '/products/add' : '/products')}
            >
              Back
            </Button>

            {!inInventory && canAdd && (
              <Button
                icon={<PackagePlus className="size-4" />}
                loading={adding}
                onClick={() => void handleAdd()}
              >
                Add to Inventory
              </Button>
            )}

            {inInventory && (
              <div className="flex flex-wrap items-end gap-2">
                {canModifyQty ? (
                  <>
                    <div className="w-28">
                      <Input
                        label="Quantity"
                        type="number"
                        min={0}
                        step={1}
                        placeholder="0"
                        value={quantityInput}
                        onChange={(e) => setQuantityInput(e.target.value)}
                        disabled={updatingQty || removing}
                      />
                    </div>
                    <Button
                      loading={updatingQty}
                      disabled={removing}
                      onClick={() => void handleUpdateQuantity()}
                    >
                      Add
                    </Button>
                  </>
                ) : (
                  <p className="mb-1 max-w-xs text-xs font-medium text-red-600">
                    {permissionRequiredMessage(PERMISSION.ModifyProductInventory)}
                  </p>
                )}
                {canRemove && (
                  <Button
                    variant="danger"
                    icon={<Trash2 className="size-4" />}
                    disabled={updatingQty || removing}
                    onClick={() => setRemoveOpen(true)}
                  >
                    Remove
                  </Button>
                )}
              </div>
            )}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-2xl border border-ink-100 bg-surface shadow-sm">
            <img
              src={hero}
              alt={product.product_name}
              className="aspect-square w-full object-cover"
            />
          </div>
          {images.length > 1 && (
            <div className="mt-3 grid grid-cols-4 gap-2">
              {images.map((img, idx) => (
                <img
                  key={`${img.url}-${idx}`}
                  src={img.url}
                  alt=""
                  className="aspect-square rounded-xl object-cover ring-1 ring-ink-100"
                />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4 lg:col-span-3">
          <div className="rounded-2xl border border-ink-100 bg-surface p-6 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge tone={product.is_available ? 'success' : 'neutral'}>
                {product.is_available ? 'Available' : 'Unavailable'}
              </Badge>
              <Badge tone={product.status ? 'brand' : 'neutral'}>
                {product.status ? 'Active' : 'Inactive'}
              </Badge>
              {product.is_veg && <Badge tone="success">Veg</Badge>}
              {product.is_organic && <Badge tone="brand">Organic</Badge>}
              {product.is_featured && <Badge tone="warning">Featured</Badge>}
              {inInventory && <Badge tone="brand">In Inventory</Badge>}
              {inInventory && quantityOnHand != null && (
                <Badge tone={quantityOnHand === 0 ? 'danger' : 'success'}>
                  {quantityOnHand === 0 ? 'Out of Stock' : `Qty: ${quantityOnHand}`}
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap items-baseline gap-3">
              <span className="font-display text-3xl font-bold text-ink-900">
                {formatCurrency(product.selling_price ?? 0)}
              </span>
              {(product.mrp ?? 0) > (product.selling_price ?? 0) && (
                <span className="text-lg text-ink-400 line-through">
                  {formatCurrency(product.mrp ?? 0)}
                </span>
              )}
              {(product.discount_percent ?? 0) > 0 && (
                <Badge tone="danger">{product.discount_percent}% OFF</Badge>
              )}
            </div>

            {product.short_description && (
              <p className="mt-4 text-sm text-ink-600">{product.short_description}</p>
            )}
            {product.description && (
              <p className="mt-2 text-sm leading-relaxed text-ink-500">{product.description}</p>
            )}

            {!inInventory && canAdd && (
              <div className="mt-5">
                <Button
                  icon={<PackagePlus className="size-4" />}
                  loading={adding}
                  onClick={() => void handleAdd()}
                >
                  Add to Inventory
                </Button>
              </div>
            )}
            {!inInventory && !canAdd && (
              <p className="mt-5 text-sm font-medium text-red-600">
                {permissionRequiredMessage(PERMISSION.AddProductToStore)}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <InfoCard title="Identity">
              <Row label="SKU" value={product.sku} />
              <Row label="Slug" value={product.slug} />
              <Row label="Category" value={product.category_name} />
              <Row label="Created" value={formatDateTime(product.created_at)} />
            </InfoCard>

            <InfoCard title="Packaging & Pricing">
              <Row label="Pack" value={product.packaging_display_text || '—'} />
              <Row
                label="Size"
                value={
                  product.pack_size != null
                    ? `${product.pack_size} ${product.packaging_unit || ''}`
                    : '—'
                }
              />
              <Row label="GST" value={`${product.gst_percent ?? 0}%`} />
              <Row label="Currency" value={product.currency || 'INR'} />
            </InfoCard>

            <InfoCard title="Storage">
              <Row
                label="Shelf Life"
                value={
                  product.shelf_life_days != null ? `${product.shelf_life_days} days` : '—'
                }
              />
              <Row label="Storage" value={product.storage_type || '—'} />
              {inInventory && (
                <Row
                  label="On Hand"
                  value={
                    quantityOnHand == null
                      ? '—'
                      : quantityOnHand === 0
                        ? 'Out of Stock'
                        : String(quantityOnHand)
                  }
                />
              )}
            </InfoCard>

            <InfoCard title={`Nutrition (${product.nutrition_per || '—'})`}>
              <Row label="Calories" value={fmtNum(product.calories)} />
              <Row label="Protein" value={fmtNum(product.protein_grams, 'g')} />
              <Row label="Fat" value={fmtNum(product.fat_grams, 'g')} />
              <Row label="Carbs" value={fmtNum(product.carbs_grams, 'g')} />
            </InfoCard>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={removeOpen}
        onClose={() => setRemoveOpen(false)}
        onConfirm={() => void handleRemove()}
        title="Remove from Inventory?"
        message={`Remove "${product.product_name}" from this store inventory? This cannot be undone.`}
        confirmLabel="Remove"
        danger
        loading={removing}
      />
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-ink-100 bg-surface p-5 shadow-sm">
      <h3 className="mb-3 font-display text-sm font-bold text-ink-900">{title}</h3>
      <dl className="space-y-2">{children}</dl>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <dt className="text-ink-400">{label}</dt>
      <dd className="text-right font-medium text-ink-800">{value}</dd>
    </div>
  );
}

function fmtNum(n: number | null | undefined, suffix = '') {
  if (n == null) return '—';
  return `${n}${suffix}`;
}

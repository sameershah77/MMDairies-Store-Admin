import { PackagePlus } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/format';
import type { ProductListItemDto } from '@/types/api';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&h=400&fit=crop';

export function primaryProductImage(product: ProductListItemDto) {
  const primary = product.images?.find((i) => i.is_primary);
  return primary?.url || product.images?.[0]?.url || FALLBACK_IMAGE;
}

interface ProductCardGridProps {
  products: ProductListItemDto[];
  onProductClick: (product: ProductListItemDto) => void;
  /** When set, shows Add to Inventory on cards not already in inventory */
  inventoryIds?: Set<string>;
  onAddToInventory?: (product: ProductListItemDto) => void;
  addingId?: string | null;
  /** Show quantity_on_hand badge (store inventory list) */
  showQuantity?: boolean;
}

export function ProductCardGrid({
  products,
  onProductClick,
  inventoryIds,
  onAddToInventory,
  addingId,
  showQuantity = false,
}: ProductCardGridProps) {
  const showAdd = Boolean(onAddToInventory && inventoryIds);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => {
        const inInventory = inventoryIds?.has(product.product_id.toLowerCase()) ?? false;
        return (
          <article
            key={product.product_id}
            className="cursor-pointer overflow-hidden rounded-2xl border border-ink-100 bg-surface shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
            onClick={() => onProductClick(product)}
          >
            <div className="relative aspect-square overflow-hidden bg-ink-100">
              <img
                src={primaryProductImage(product)}
                alt={product.product_name}
                className="size-full object-cover transition duration-300 hover:scale-105"
                loading="lazy"
              />
              {!product.is_available && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <Badge tone="danger">Unavailable</Badge>
                </div>
              )}
              {product.discount_percent > 0 && (
                <span className="absolute top-3 left-3 rounded-lg bg-accent px-2 py-0.5 text-xs font-bold text-white">
                  {product.discount_percent}% OFF
                </span>
              )}
              {showQuantity && product.quantity_on_hand != null && (
                <span
                  className={`absolute top-3 right-3 rounded-lg px-2 py-0.5 text-xs font-bold text-white ${
                    product.quantity_on_hand === 0 ? 'bg-danger' : 'bg-ink-900/80'
                  }`}
                >
                  {product.quantity_on_hand === 0
                    ? 'Out of Stock'
                    : `Qty ${product.quantity_on_hand}`}
                </span>
              )}
            </div>
            <div className="p-4">
              <p className="text-xs font-medium tracking-wide text-brand-500 uppercase">
                {product.category_name}
              </p>
              <h3 className="mt-1 font-display text-base font-bold text-ink-900">
                {product.product_name}
              </h3>
              {product.display_text && (
                <p className="mt-0.5 text-xs text-ink-400">{product.display_text}</p>
              )}
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-display text-lg font-bold text-ink-900">
                  {formatCurrency(product.selling_price)}
                </span>
                {product.mrp > product.selling_price && (
                  <span className="text-sm text-ink-400 line-through">
                    {formatCurrency(product.mrp)}
                  </span>
                )}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {showQuantity && product.quantity_on_hand != null ? (
                  <Badge tone={product.quantity_on_hand === 0 ? 'danger' : 'success'}>
                    {product.quantity_on_hand === 0
                      ? 'Out of Stock'
                      : `Qty: ${product.quantity_on_hand}`}
                  </Badge>
                ) : (
                  <Badge tone={product.is_available ? 'success' : 'neutral'}>
                    {product.is_available ? 'Available' : 'Out of Stock'}
                  </Badge>
                )}
                {showAdd && inInventory && <Badge tone="brand">In Inventory</Badge>}
              </div>
              {showAdd && !inInventory && (
                <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                  <Button
                    size="sm"
                    className="w-full"
                    icon={<PackagePlus className="size-3.5" />}
                    loading={addingId === product.product_id}
                    onClick={() => onAddToInventory?.(product)}
                  >
                    Add to Inventory
                  </Button>
                </div>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}

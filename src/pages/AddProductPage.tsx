import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { ProductCardGrid } from '@/components/products/ProductCardGrid';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  addToInventory,
  getAllProducts,
  getProductInventoryByStoreId,
} from '@/api/products';
import { ApiError } from '@/lib/apiClient';
import { PermissionPage } from '@/components/permissions/PermissionPage';
import { PERMISSION } from '@/lib/permissions';
import type { ProductListItemDto } from '@/types/api';

const PAGE_SIZE = 8;

export function AddProductPage() {
  return (
    <PermissionPage
      title="Add Product"
      subtitle="Browse catalog and add products to your store inventory"
      permissionId={PERMISSION.AddProductToStore}
    >
      <AddProductBoard />
    </PermissionPage>
  );
}

function AddProductBoard() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [products, setProducts] = useState<ProductListItemDto[]>([]);
  const [inventoryIds, setInventoryIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const catalog = await getAllProducts();
      setProducts(catalog ?? []);

      if (profile.storeId) {
        const inventory = await getProductInventoryByStoreId(profile.storeId, false);
        setInventoryIds(
          new Set((inventory ?? []).map((p) => p.product_id.toLowerCase())),
        );
      } else {
        setInventoryIds(new Set());
      }
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Failed to load products', 'error');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [profile.storeId, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(
    () =>
      products.filter(
        (p) =>
          p.product_name.toLowerCase().includes(search.toLowerCase()) ||
          p.category_name.toLowerCase().includes(search.toLowerCase()) ||
          (p.display_text?.toLowerCase().includes(search.toLowerCase()) ?? false),
      ),
    [products, search],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleAdd = async (product: ProductListItemDto) => {
    if (!profile.storeId) {
      toast('No store assigned to this account', 'error');
      return;
    }
    setAddingId(product.product_id);
    try {
      await addToInventory({
        productId: product.product_id,
        storeId: profile.storeId,
      });
      setInventoryIds((prev) => {
        const next = new Set(prev);
        next.add(product.product_id.toLowerCase());
        return next;
      });
      toast(`"${product.product_name}" added to inventory`);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Failed to add to inventory', 'error');
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Add Product"
        subtitle="Browse catalog and add products to your store inventory"
        actions={
          <Button
            variant="outline"
            icon={<ArrowLeft className="size-4" />}
            onClick={() => navigate('/products')}
          >
            Back to Inventory
          </Button>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <SearchInput
          placeholder="Search products..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          containerClassName="max-w-md flex-1"
        />
        <span className="text-sm text-ink-500">
          {loading ? '…' : `${filtered.length} product${filtered.length === 1 ? '' : 's'}`}
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-ink-500">
          <Loader2 className="size-5 animate-spin" />
          Loading catalog...
        </div>
      ) : pageItems.length === 0 ? (
        <EmptyState
          title="No products found"
          description={search ? 'Try a different search term.' : 'The product catalog is empty.'}
        />
      ) : (
        <>
          <ProductCardGrid
            products={pageItems}
            inventoryIds={inventoryIds}
            addingId={addingId}
            onAddToInventory={(p) => void handleAdd(p)}
            onProductClick={(p) =>
              navigate(`/products/${p.product_id}`, { state: { from: 'add' } })
            }
          />
          <Pagination
            page={page}
            totalPages={totalPages}
            onChange={setPage}
            totalItems={filtered.length}
          />
        </>
      )}
    </div>
  );
}

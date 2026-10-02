import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Plus, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { ProductCardGrid } from '@/components/products/ProductCardGrid';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { getProductInventoryByStoreId } from '@/api/products';
import { ApiError } from '@/lib/apiClient';
import { PERMISSION } from '@/lib/permissions';
import type { ProductListItemDto } from '@/types/api';

const PAGE_SIZE = 8;

export function ProductsPage() {
  const { profile, hasPermission } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const canAdd = hasPermission(PERMISSION.AddProductToStore);

  const [products, setProducts] = useState<ProductListItemDto[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!profile.storeId) {
      setProducts([]);
      setLoading(false);
      toast('No store assigned to this account', 'error');
      return;
    }
    setLoading(true);
    try {
      const list = await getProductInventoryByStoreId(profile.storeId, false);
      setProducts(list ?? []);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Failed to load inventory', 'error');
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

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle="Products listed in your store inventory"
        actions={
          <>
            <Button
              variant="outline"
              icon={<RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />}
              onClick={() => void load()}
              disabled={loading}
            >
              Refresh
            </Button>
            {canAdd && (
              <Button icon={<Plus className="size-4" />} onClick={() => navigate('/products/add')}>
                Add Product
              </Button>
            )}
          </>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <SearchInput
          placeholder="Search inventory..."
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
          Loading inventory...
        </div>
      ) : !profile.storeId ? (
        <EmptyState
          title="No store assigned"
          description="Ask a Super Admin to assign a store to this account."
        />
      ) : pageItems.length === 0 ? (
        <EmptyState
          title={search ? 'No products found' : 'Inventory is empty'}
          description={
            search
              ? 'Try a different search term.'
              : 'Add products from the catalog to start selling.'
          }
          actionLabel={search || !canAdd ? undefined : 'Add Product'}
          onAction={search || !canAdd ? undefined : () => navigate('/products/add')}
        />
      ) : (
        <>
          <ProductCardGrid
            products={pageItems}
            showQuantity
            onProductClick={(p) => navigate(`/products/${p.product_id}`)}
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

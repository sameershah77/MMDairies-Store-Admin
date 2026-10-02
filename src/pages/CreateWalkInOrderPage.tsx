import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Minus, Plus, RefreshCw, ShoppingCart, Trash2, X } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { primaryProductImage } from '@/components/products/ProductCardGrid';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { getProductInventoryByStoreId } from '@/api/products';
import { placeWalkInOrder, requestThermalPrint, type ThermalPrintMode } from '@/api/orders';
import { ApiError } from '@/lib/apiClient';
import { PermissionPage } from '@/components/permissions/PermissionPage';
import { PERMISSION } from '@/lib/permissions';
import type { PlaceWalkInOrderResponse, ProductListItemDto } from '@/types/api';

type CartLine = {
  productId: string;
  productName: string;
  displayText: string | null;
  sellingPrice: number;
  stock: number;
  qty: number;
  imageUrl: string;
};

type WalkInCart = {
  id: string;
  lines: Record<string, CartLine>;
  note: string;
  receiverName: string;
  receiverContact: string;
};

function newCartId() {
  return `cart-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createEmptyCart(): WalkInCart {
  return {
    id: newCartId(),
    lines: {},
    note: '',
    receiverName: '',
    receiverContact: '',
  };
}

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function money(amount: number) {
  const n = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function toCartLine(product: ProductListItemDto, qty: number): CartLine {
  return {
    productId: product.product_id,
    productName: product.product_name || 'Product',
    displayText: product.display_text ?? null,
    sellingPrice: round2(Number(product.selling_price) || 0),
    stock: Math.max(0, Number(product.quantity_on_hand) || 0),
    qty,
    imageUrl: primaryProductImage(product),
  };
}

function cartItemCount(cart: WalkInCart) {
  return Object.values(cart.lines).reduce((s, l) => s + l.qty, 0);
}

function cartGrandTotal(cart: WalkInCart) {
  return round2(Object.values(cart.lines).reduce((s, l) => s + l.qty * l.sellingPrice, 0));
}

function qtyAcrossCarts(carts: WalkInCart[], productId: string, excludeCartId?: string) {
  return carts.reduce((sum, cart) => {
    if (excludeCartId && cart.id === excludeCartId) return sum;
    return sum + (cart.lines[productId]?.qty ?? 0);
  }, 0);
}

const RECEIVER_NAME_MAX = 15;
const RECEIVER_PHONE_LEN = 10;

function sanitizeReceiverName(value: string) {
  return value.slice(0, RECEIVER_NAME_MAX);
}

function sanitizeReceiverPhone(value: string) {
  return value.replace(/\D/g, '').slice(0, RECEIVER_PHONE_LEN);
}

function receiverNameError(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return null;
  if (trimmed.length > RECEIVER_NAME_MAX) {
    return `Name must be at most ${RECEIVER_NAME_MAX} characters`;
  }
  return null;
}

function receiverPhoneError(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.length !== RECEIVER_PHONE_LEN) {
    return `Enter a valid ${RECEIVER_PHONE_LEN}-digit phone number`;
  }
  return null;
}

export function CreateWalkInOrderPage() {
  return (
    <PermissionPage
      title="Create Walk-in Order"
      subtitle="Counter sale — products from store stock. Optional receiver name & contact per cart."
      permissionId={PERMISSION.CreateWalkInOrder}
    >
      <CreateWalkInOrderBoard />
    </PermissionPage>
  );
}

function CreateWalkInOrderBoard() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [products, setProducts] = useState<ProductListItemDto[]>([]);
  const [search, setSearch] = useState('');
  const [{ carts, activeCartId }, setCartState] = useState(() => {
    const first = createEmptyCart();
    return { carts: [first], activeCartId: first.id };
  });
  const [loading, setLoading] = useState(true);
  const [placingCartId, setPlacingCartId] = useState<string | null>(null);
  const [success, setSuccess] = useState<PlaceWalkInOrderResponse | null>(null);
  const [thermalLoading, setThermalLoading] = useState(false);

  const setCarts = (next: WalkInCart[] | ((prev: WalkInCart[]) => WalkInCart[])) => {
    setCartState((prev) => {
      const cartsNext = typeof next === 'function' ? next(prev.carts) : next;
      const activeStillExists = cartsNext.some((c) => c.id === prev.activeCartId);
      return {
        carts: cartsNext,
        activeCartId: activeStillExists ? prev.activeCartId : (cartsNext[0]?.id ?? ''),
      };
    });
  };

  const setActiveCartId = (id: string) => {
    setCartState((prev) => ({ ...prev, activeCartId: id }));
  };

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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => {
      const name = (p.product_name ?? '').toLowerCase();
      const cat = (p.category_name ?? '').toLowerCase();
      const display = (p.display_text ?? '').toLowerCase();
      return name.includes(q) || cat.includes(q) || display.includes(q);
    });
  }, [products, search]);

  const activeCart = useMemo(
    () => carts.find((c) => c.id === activeCartId) ?? carts[0],
    [carts, activeCartId],
  );

  const updateCart = (cartId: string, updater: (cart: WalkInCart) => WalkInCart) => {
    setCarts((prev) => prev.map((c) => (c.id === cartId ? updater(c) : c)));
  };

  const setQty = (product: ProductListItemDto, qty: number, cartId?: string) => {
    const stock = Math.max(0, Number(product.quantity_on_hand) || 0);
    const id = product.product_id;

    setCartState((prev) => {
      const targetId = cartId || prev.activeCartId || prev.carts[0]?.id;
      if (!targetId) return prev;

      const reservedElsewhere = qtyAcrossCarts(prev.carts, id, targetId);
      const available = Math.max(0, stock - reservedElsewhere);

      if (qty <= 0) {
        return {
          ...prev,
          carts: prev.carts.map((cart) => {
            if (cart.id !== targetId) return cart;
            const nextLines = { ...cart.lines };
            delete nextLines[id];
            return { ...cart, lines: nextLines };
          }),
        };
      }

      let nextQty = qty;
      if (nextQty > available) {
        toast(`Only ${available} available for ${product.product_name} (across carts)`, 'error');
        nextQty = available;
      }
      if (nextQty <= 0) return prev;

      return {
        ...prev,
        carts: prev.carts.map((cart) =>
          cart.id === targetId
            ? {
                ...cart,
                lines: {
                  ...cart.lines,
                  [id]: toCartLine(product, nextQty),
                },
              }
            : cart,
        ),
      };
    });
  };

  const bumpCartLine = (cartId: string, productId: string, delta: number) => {
    setCartState((prev) => {
      const cart = prev.carts.find((c) => c.id === cartId);
      if (!cart) return prev;
      const line = cart.lines[productId];
      if (!line) return prev;

      const nextQty = line.qty + delta;
      if (nextQty <= 0) {
        return {
          ...prev,
          carts: prev.carts.map((c) => {
            if (c.id !== cartId) return c;
            const nextLines = { ...c.lines };
            delete nextLines[productId];
            return { ...c, lines: nextLines };
          }),
        };
      }

      const reservedElsewhere = qtyAcrossCarts(prev.carts, productId, cartId);
      const available = Math.max(0, line.stock - reservedElsewhere);
      if (nextQty > available) {
        toast(`Only ${available} available for ${line.productName} (across carts)`, 'error');
        return prev;
      }

      return {
        ...prev,
        carts: prev.carts.map((c) =>
          c.id === cartId
            ? { ...c, lines: { ...c.lines, [productId]: { ...line, qty: nextQty } } }
            : c,
        ),
      };
    });
  };

  const removeCartLine = (cartId: string, productId: string) => {
    updateCart(cartId, (cart) => {
      const nextLines = { ...cart.lines };
      delete nextLines[productId];
      return { ...cart, lines: nextLines };
    });
  };

  const addOne = (product: ProductListItemDto) => {
    if (!activeCart) return;
    const stock = Math.max(0, Number(product.quantity_on_hand) || 0);
    if (!product.is_available || stock <= 0) {
      toast('Product is out of stock', 'error');
      return;
    }
    const current = activeCart.lines[product.product_id]?.qty ?? 0;
    setQty(product, current + 1, activeCart.id);
  };

  const clearCart = (cartId: string) => {
    updateCart(cartId, (cart) => ({
      ...cart,
      lines: {},
      note: '',
      receiverName: '',
      receiverContact: '',
    }));
  };

  const addCart = () => {
    const next = createEmptyCart();
    setCartState((prev) => ({
      carts: [...prev.carts, next],
      activeCartId: next.id,
    }));
  };

  const removeCart = (cartId: string) => {
    if (carts.length <= 1) {
      toast('At least one cart is required', 'error');
      return;
    }
    setCartState((prev) => {
      const next = prev.carts.filter((c) => c.id !== cartId);
      return {
        carts: next,
        activeCartId:
          prev.activeCartId === cartId ? (next[0]?.id ?? '') : prev.activeCartId,
      };
    });
  };

  const placeOrder = async (cartId: string) => {
    const cart = carts.find((c) => c.id === cartId);
    if (!cart) return;
    const lines = Object.values(cart.lines);
    if (lines.length === 0) {
      toast('Add at least one product to the cart', 'error');
      return;
    }

    const nameErr = receiverNameError(cart.receiverName);
    if (nameErr) {
      toast(nameErr, 'error');
      return;
    }
    const phoneErr = receiverPhoneError(cart.receiverContact);
    if (phoneErr) {
      toast(phoneErr, 'error');
      return;
    }

    const receiverName = cart.receiverName.trim() || null;
    const receiverContact = sanitizeReceiverPhone(cart.receiverContact) || null;

    setPlacingCartId(cartId);
    try {
      const result = await placeWalkInOrder({
        note: cart.note.trim() || null,
        paymentMode: 1,
        totalPrice: cartGrandTotal(cart),
        receiverName,
        receiverContact,
        items: lines.map((l) => ({
          productId: l.productId,
          productQnt: l.qty,
          productPrice: l.sellingPrice,
        })),
      });
      setSuccess(result);
      clearCart(cartId);
      void load();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Failed to place order', 'error');
    } finally {
      setPlacingCartId(null);
    }
  };

  const handleThermalPrint = async (mode: ThermalPrintMode) => {
    if (!success) return;
    setThermalLoading(true);
    try {
      await requestThermalPrint({ orderId: success.order_id, mode });
      toast('Print request sent to store printer');
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Failed to request print', 'error');
    } finally {
      setThermalLoading(false);
    }
  };

  const closeSuccess = () => {
    if (thermalLoading) return;
    setSuccess(null);
  };

  return (
    <div className="flex h-[calc(100dvh-4rem-2rem)] flex-col gap-4 sm:h-[calc(100dvh-4rem-3rem)] xl:flex-row xl:items-stretch">
      {/* Products column */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="shrink-0 [&>div]:mb-3">
          <PageHeader
            title="Create Walk-in Order"
            subtitle="Counter sale — multiple carts supported. Receiver name & contact are optional."
          />
        </div>

        <div className="mb-3 flex shrink-0 items-center gap-2">
          <SearchInput
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            containerClassName="min-w-0 flex-1"
          />
          <Button
            variant="outline"
            className="shrink-0"
            icon={<RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />}
            onClick={() => void load()}
            disabled={loading}
          >
            Refresh stock
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
          {loading ? (
            <p className="text-sm text-ink-500">Loading inventory…</p>
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No products"
              description="Add products to inventory first, then create walk-in orders."
              actionLabel="Go to Products"
              onAction={() => navigate('/products')}
            />
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 2xl:grid-cols-3">
              {filtered.map((product) => {
                const stock = Math.max(0, Number(product.quantity_on_hand) || 0);
                const price = round2(Number(product.selling_price) || 0);
                const inCart = activeCart?.lines[product.product_id]?.qty ?? 0;
                const reservedElsewhere = qtyAcrossCarts(
                  carts,
                  product.product_id,
                  activeCart?.id,
                );
                const available = Math.max(0, stock - reservedElsewhere);
                const disabled = !product.is_available || stock <= 0;
                return (
                  <article
                    key={product.product_id}
                    className="flex items-center gap-2.5 rounded-xl border border-ink-100 bg-surface p-2 shadow-sm"
                  >
                    <img
                      src={primaryProductImage(product)}
                      alt={product.product_name}
                      className="size-14 shrink-0 rounded-lg bg-ink-100 object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-[10px] font-medium tracking-wide text-brand-500 uppercase">
                            {product.category_name || 'Product'}
                          </p>
                          <h3 className="truncate font-display text-sm font-bold leading-tight text-ink-900">
                            {product.product_name}
                          </h3>
                          {product.display_text ? (
                            <p className="truncate text-[11px] leading-tight text-ink-500">
                              {product.display_text}
                            </p>
                          ) : null}
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-semibold leading-tight text-ink-900">
                            {money(price)}
                          </p>
                          <span
                            className={`text-[11px] font-semibold ${
                              stock <= 0 ? 'text-danger' : 'text-ink-500'
                            }`}
                          >
                            Stock {stock}
                          </span>
                        </div>
                      </div>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        {inCart > 0 ? (
                          <>
                            <button
                              type="button"
                              className="flex size-7 items-center justify-center rounded-md border border-ink-200 bg-ink-100 text-ink-800"
                              onClick={() => setQty(product, inCart - 1, activeCart?.id)}
                            >
                              <Minus className="size-3.5" />
                            </button>
                            <span className="w-5 text-center text-sm font-bold text-ink-900">
                              {inCart}
                            </span>
                            <button
                              type="button"
                              className="flex size-7 items-center justify-center rounded-md bg-brand-500 text-white disabled:opacity-40 dark:text-ink-50"
                              disabled={disabled || inCart >= available}
                              onClick={() => setQty(product, inCart + 1, activeCart?.id)}
                            >
                              <Plus className="size-3.5" />
                            </button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            disabled={disabled || available <= 0}
                            icon={<Plus className="size-3.5" />}
                            onClick={() => addOne(product)}
                          >
                            Add
                          </Button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Cart column — full height to top of page content (under TopNav) */}
      <aside className="flex h-[min(42dvh,22rem)] min-h-0 w-full shrink-0 flex-col overflow-hidden rounded-2xl border border-ink-100 bg-surface shadow-sm xl:h-auto xl:w-[28rem]">
        <div
          role="tablist"
          aria-label="Carts"
          className="flex shrink-0 items-end gap-1 border-b border-ink-100 bg-ink-50/80 px-2 pt-2"
        >
          <div className="flex min-w-0 flex-1 items-end gap-1 overflow-x-auto pb-0">
            <AnimatePresence initial={false} mode="popLayout">
              {carts.map((cart, index) => {
                const isActive = cart.id === activeCart?.id;
                const count = cartItemCount(cart);
                const tabLabel = cart.receiverName.trim() || `Cart ${index + 1}`;
                return (
                  <motion.div
                    key={cart.id}
                    layout
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, width: 0, margin: 0, padding: 0 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    className="min-w-0 shrink-0"
                  >
                    <div
                      role="tab"
                      aria-selected={isActive}
                      tabIndex={0}
                      onClick={() => setActiveCartId(cart.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setActiveCartId(cart.id);
                        }
                      }}
                      className={`group relative flex max-w-[9.5rem] cursor-pointer items-center gap-1 rounded-t-xl border border-b-0 px-2.5 py-2 text-left transition-colors ${
                        isActive
                          ? 'z-10 -mb-px border-ink-100 bg-surface text-ink-900'
                          : 'border-transparent bg-transparent text-ink-500 hover:bg-ink-100/80 hover:text-ink-800'
                      }`}
                      title={tabLabel}
                    >
                      <ShoppingCart
                        className={`size-3.5 shrink-0 ${isActive ? 'text-brand-500' : 'text-ink-400'}`}
                      />
                      <span className="min-w-0 flex-1 truncate text-xs font-semibold">
                        {tabLabel}
                      </span>
                      {count > 0 ? (
                        <span
                          className={`shrink-0 rounded-md px-1 text-[10px] font-bold ${
                            isActive
                              ? 'bg-brand-500/10 text-brand-600'
                              : 'bg-ink-200/80 text-ink-600'
                          }`}
                        >
                          {count}
                        </span>
                      ) : null}
                      {carts.length > 1 ? (
                        <button
                          type="button"
                          aria-label={`Close ${tabLabel}`}
                          title="Close cart"
                          className="ml-0.5 flex size-5 shrink-0 items-center justify-center rounded-md text-ink-400 opacity-70 hover:bg-ink-200 hover:text-danger hover:opacity-100 group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeCart(cart.id);
                          }}
                        >
                          <X className="size-3" />
                        </button>
                      ) : null}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
          <button
            type="button"
            onClick={addCart}
            className="mb-1.5 flex size-8 shrink-0 items-center justify-center rounded-lg text-ink-500 transition-colors hover:bg-ink-100 hover:text-brand-600"
            aria-label="Add cart"
            title="New cart"
          >
            <Plus className="size-4" />
          </button>
        </div>

        <div className="relative min-h-0 flex-1 overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            {activeCart ? (
              <CartPanel
                key={activeCart.id}
                cart={activeCart}
                cartIndex={Math.max(0, carts.findIndex((c) => c.id === activeCart.id))}
                carts={carts}
                placing={placingCartId === activeCart.id}
                placingAny={placingCartId !== null}
                onUpdateCart={updateCart}
                onBump={bumpCartLine}
                onRemoveLine={removeCartLine}
                onClear={clearCart}
                onPlace={(id) => void placeOrder(id)}
              />
            ) : null}
          </AnimatePresence>
        </div>
      </aside>

      <Modal
        open={Boolean(success)}
        onClose={closeSuccess}
        title="Order accepted"
        description="Walk-in order created as Accepted. Choose what to print on the store thermal printer."
      >
        {success ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-ink-50 p-4 text-center">
              <p className="text-xs font-semibold tracking-wide text-ink-500 uppercase">Token</p>
              <p className="font-display text-4xl font-bold text-brand-600">{success.token}</p>
              <p className="mt-2 text-sm text-ink-700">
                {success.order_number} · {money(Number(success.grand_total) || 0)}
              </p>
            </div>

            <div className="flex flex-col gap-2.5">
              <p className="text-sm font-medium text-ink-800">Generate Bill &amp; Token</p>
              <Button
                className="w-full justify-center"
                disabled={thermalLoading}
                loading={thermalLoading}
                onClick={() => void handleThermalPrint('token')}
              >
                1. Generate Token
              </Button>
              <Button
                className="w-full justify-center"
                variant="secondary"
                disabled={thermalLoading}
                loading={thermalLoading}
                onClick={() => void handleThermalPrint('bill')}
              >
                2. Generate Bill
              </Button>
              <Button
                className="w-full justify-center"
                variant="outline"
                disabled={thermalLoading}
                loading={thermalLoading}
                onClick={() => void handleThermalPrint('both')}
              >
                3. Generate Bill &amp; Token
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 border-t border-ink-100 pt-3">
              <Button variant="outline" onClick={closeSuccess} disabled={thermalLoading}>
                Skip / Close
              </Button>
              <Button
                disabled={thermalLoading}
                onClick={() => {
                  const id = success.order_id;
                  setSuccess(null);
                  navigate(`/orders/${id}`);
                }}
              >
                View order
              </Button>
              <Button
                variant="outline"
                disabled={thermalLoading}
                onClick={() => {
                  setSuccess(null);
                  navigate('/running-orders');
                }}
              >
                Running Orders
              </Button>
              <Button variant="ghost" onClick={closeSuccess} disabled={thermalLoading}>
                New order
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

function CartPanel({
  cart,
  cartIndex,
  carts,
  placing,
  placingAny,
  onUpdateCart,
  onBump,
  onRemoveLine,
  onClear,
  onPlace,
}: {
  cart: WalkInCart;
  cartIndex: number;
  carts: WalkInCart[];
  placing: boolean;
  placingAny: boolean;
  onUpdateCart: (cartId: string, updater: (cart: WalkInCart) => WalkInCart) => void;
  onBump: (cartId: string, productId: string, delta: number) => void;
  onRemoveLine: (cartId: string, productId: string) => void;
  onClear: (cartId: string) => void;
  onPlace: (cartId: string) => void;
}) {
  const lines = Object.values(cart.lines);
  const itemCount = cartItemCount(cart);
  const total = cartGrandTotal(cart);
  const nameErr = receiverNameError(cart.receiverName);
  const phoneErr = receiverPhoneError(cart.receiverContact);
  const receiverInvalid = Boolean(nameErr || phoneErr);

  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="absolute inset-0 flex flex-col"
    >
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
        <div className="mb-3 flex items-center gap-2">
          <h3 className="font-display text-base font-bold text-ink-900">
            {cart.receiverName.trim() || `Cart ${cartIndex + 1}`}
          </h3>
          <span className="text-sm text-ink-500">
            {itemCount} item{itemCount === 1 ? '' : 's'}
          </span>
        </div>

        {lines.length === 0 ? (
          <p className="mb-4 py-6 text-center text-sm text-ink-500">
            Select products from stock to build this order.
          </p>
        ) : (
          <ul className="mb-4 space-y-3">
            {lines.map((line) => {
              const reservedElsewhere = qtyAcrossCarts(carts, line.productId, cart.id);
              const available = Math.max(0, line.stock - reservedElsewhere);
              return (
                <li
                  key={line.productId}
                  className="rounded-xl border border-ink-100 bg-ink-50 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink-900">
                        {line.productName}
                      </p>
                      <p className="text-xs text-ink-500">
                        {money(line.sellingPrice)} × {line.qty}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-danger"
                      onClick={() => onRemoveLine(cart.id, line.productId)}
                      aria-label="Remove"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="flex size-7 items-center justify-center rounded-lg border border-ink-200 bg-ink-100 text-ink-800"
                        onClick={() => onBump(cart.id, line.productId, -1)}
                      >
                        <Minus className="size-3.5" />
                      </button>
                      <span className="w-5 text-center text-sm font-bold text-ink-900">
                        {line.qty}
                      </span>
                      <button
                        type="button"
                        className="flex size-7 items-center justify-center rounded-lg bg-brand-500 text-white disabled:opacity-40 dark:text-ink-50"
                        disabled={line.qty >= available}
                        onClick={() => onBump(cart.id, line.productId, 1)}
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div>
                    <p className="shrink-0 text-sm font-bold text-ink-900">
                      {money(round2(line.sellingPrice * line.qty))}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div className="space-y-3 border-t border-ink-100 pt-3">
          <label className="block">
            <span className="mb-1.5 flex items-center justify-between gap-2 text-xs font-semibold tracking-wide text-ink-500 uppercase">
              <span>Name (optional)</span>
              <span className="font-medium normal-case text-ink-400">
                {cart.receiverName.length}/{RECEIVER_NAME_MAX}
              </span>
            </span>
            <input
              type="text"
              value={cart.receiverName}
              maxLength={RECEIVER_NAME_MAX}
              onChange={(e) =>
                onUpdateCart(cart.id, (c) => ({
                  ...c,
                  receiverName: sanitizeReceiverName(e.target.value),
                }))
              }
              placeholder="Receiver name"
              aria-invalid={Boolean(nameErr)}
              className={`w-full rounded-xl border bg-surface px-3 py-2 text-sm text-ink-800 outline-none placeholder:text-ink-400 focus:ring-3 ${
                nameErr
                  ? 'border-danger focus:border-danger focus:ring-danger/15'
                  : 'border-ink-200 focus:border-brand-400 focus:ring-brand-500/15'
              }`}
            />
            {nameErr ? <p className="mt-1 text-xs text-danger">{nameErr}</p> : null}
          </label>

          <label className="block">
            <span className="mb-1.5 flex items-center justify-between gap-2 text-xs font-semibold tracking-wide text-ink-500 uppercase">
              <span>Contact No. (optional)</span>
              <span className="font-medium normal-case text-ink-400">
                {sanitizeReceiverPhone(cart.receiverContact).length}/{RECEIVER_PHONE_LEN}
              </span>
            </span>
            <input
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              value={cart.receiverContact}
              maxLength={RECEIVER_PHONE_LEN}
              onChange={(e) =>
                onUpdateCart(cart.id, (c) => ({
                  ...c,
                  receiverContact: sanitizeReceiverPhone(e.target.value),
                }))
              }
              placeholder="10-digit phone"
              aria-invalid={Boolean(phoneErr)}
              className={`w-full rounded-xl border bg-surface px-3 py-2 text-sm text-ink-800 outline-none placeholder:text-ink-400 focus:ring-3 ${
                phoneErr
                  ? 'border-danger focus:border-danger focus:ring-danger/15'
                  : 'border-ink-200 focus:border-brand-400 focus:ring-brand-500/15'
              }`}
            />
            {phoneErr ? <p className="mt-1 text-xs text-danger">{phoneErr}</p> : null}
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold tracking-wide text-ink-500 uppercase">
              Note (optional)
            </span>
            <textarea
              value={cart.note}
              onChange={(e) =>
                onUpdateCart(cart.id, (c) => ({ ...c, note: e.target.value }))
              }
              rows={2}
              placeholder="e.g. Paid at counter"
              className="w-full resize-none rounded-xl border border-ink-200 bg-surface px-3 py-2 text-sm text-ink-800 outline-none placeholder:text-ink-400 focus:border-brand-400 focus:ring-3 focus:ring-brand-500/15"
            />
          </label>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-ink-600">Total (COD)</span>
            <span className="font-display text-xl font-bold text-ink-900">{money(total)}</span>
          </div>

          <Button
            className="w-full"
            loading={placing}
            disabled={lines.length === 0 || placingAny || receiverInvalid}
            onClick={() => onPlace(cart.id)}
          >
            Place walk-in order
          </Button>
          <Button
            className="w-full"
            variant="ghost"
            disabled={
              (lines.length === 0 &&
                !cart.note &&
                !cart.receiverName &&
                !cart.receiverContact) ||
              placingAny
            }
            onClick={() => onClear(cart.id)}
          >
            Clear cart
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import * as signalR from '@microsoft/signalr';
import { useAuth } from '@/context/AuthContext';
import { getAccessToken } from '@/lib/apiClient';
import {
  playNewOrderSound,
  showBrowserNotification,
} from '@/lib/notificationSound';
import { OrderStatus, type OrderChangedEventDto } from '@/types/api';

type OrderChangedHandler = (evt: OrderChangedEventDto) => void;

interface OrderRealtimeContextValue {
  subscribe: (handler: OrderChangedHandler) => () => void;
  isConnected: boolean;
}

const OrderRealtimeContext = createContext<OrderRealtimeContextValue | null>(null);

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? '';

export function OrderRealtimeProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, profile } = useAuth();
  const handlersRef = useRef(new Set<OrderChangedHandler>());
  const [isConnected, setIsConnected] = useState(false);

  const subscribe = useCallback((handler: OrderChangedHandler) => {
    handlersRef.current.add(handler);
    return () => {
      handlersRef.current.delete(handler);
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !profile.storeId) {
      setIsConnected(false);
      return;
    }

    const storeId = profile.storeId;
    let stopped = false;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${BASE_URL}/hubs/orders`, {
        accessTokenFactory: () => getAccessToken() ?? '',
      })
      .withAutomaticReconnect()
      .build();

    connection.on('orderChanged', (evt: OrderChangedEventDto) => {
      const isNewLiveOrder = evt.new_status === OrderStatus.Placed;
      const isNewRunningOrder =
        evt.new_status === OrderStatus.Accepted ||
        evt.new_status === OrderStatus.Preparing;

      if (isNewLiveOrder || isNewRunningOrder) {
        playNewOrderSound();
        const label = isNewLiveOrder ? 'New Order' : 'Order Accepted';
        const orderNum = evt.order?.order_number ?? '';
        showBrowserNotification(label, orderNum ? `Order ${orderNum}` : 'A new order arrived');
      }

      handlersRef.current.forEach((h) => h(evt));
    });

    connection.onreconnected(() => {
      void (async () => {
        try {
          await connection.invoke('JoinStore', storeId);
          if (!stopped) setIsConnected(true);
        } catch {
          if (!stopped) setIsConnected(false);
        }
      })();
    });

    connection.onclose(() => {
      if (!stopped) setIsConnected(false);
    });

    void (async () => {
      try {
        await connection.start();
        if (stopped) return;
        await connection.invoke('JoinStore', storeId);
        if (!stopped) setIsConnected(true);
      } catch {
        if (!stopped) setIsConnected(false);
      }
    })();

    return () => {
      stopped = true;
      setIsConnected(false);
      void connection.stop();
    };
  }, [isAuthenticated, profile.storeId]);

  const value = useMemo(
    () => ({ subscribe, isConnected }),
    [subscribe, isConnected],
  );

  return (
    <OrderRealtimeContext.Provider value={value}>{children}</OrderRealtimeContext.Provider>
  );
}

export function useOrderRealtime() {
  const ctx = useContext(OrderRealtimeContext);
  if (!ctx) throw new Error('useOrderRealtime must be used within OrderRealtimeProvider');
  return ctx;
}

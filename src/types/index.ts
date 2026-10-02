export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'preparing'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export type PaymentStatus = 'paid' | 'pending' | 'cod';

export type DeliveryEta =
  | 'Reach in 10 Minutes'
  | 'Reach in 15 Minutes'
  | 'Reach in 20 Minutes'
  | 'Reach in 30 Minutes';

export interface AssignedStoreRef {
  id: string;
  name: string;
}

export interface StoreAdminProfile {
  name: string;
  firstName: string;
  lastName: string;
  username: string;
  phone: string;
  email: string;
  dairyName: string;
  zoneName: string;
  storeName: string;
  storeId: string;
  userId?: string;
  assignedStores: AssignedStoreRef[];
  contactPhones: string[];
  contactEmails: string[];
  permissionIds: number[];
}

export interface MasterProduct {
  id: string;
  name: string;
  image: string;
  category: string;
  description: string;
  suggestedPrice: number;
}

export interface StoreProduct {
  id: string;
  masterProductId: string;
  name: string;
  price: number;
  image: string;
  category: string;
  available: boolean;
  soldCount: number;
}

export interface Order {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  productCategory: string;
  price: number;
  quantity: number;
  totalAmount: number;
  time: string;
  date: string;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  customerId: string;
  customerName: string;
  customerAddress: string;
  customerLocation: string;
  customerTotalOrders: number;
  orderNotes: string;
  acceptedTime?: string;
  expectedDelivery?: DeliveryEta | string;
  deliveredTime?: string;
  deliveryStatus?: string;
}

export interface DashboardStats {
  todayRevenue: number;
  todayOrders: number;
  liveOrders: number;
  runningOrders: number;
  completedOrders: number;
}

export interface ChartPoint {
  label: string;
  value: number;
}

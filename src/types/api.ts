/** Backend API response envelope + DTOs (snake_case where API returns it). */

export interface ApiEnvelope<T = unknown> {
  message: string;
  data?: T;
}

export interface StoreAdminPermissionDto {
  permission_id: number;
  permission_name: string;
}

/** Matches backend StoreAdminPermissionType */
export const PERMISSION = {
  AddProductToStore: 1,
  RemoveProductFromStore: 2,
  ChatWithCustomer: 3,
  ViewReport: 4,
  ViewFeedbacks: 5,
  ViewLiveOrders: 6,
  ViewRunningOrders: 7,
  ViewOutForDelivery: 8,
  ViewCompletedOrders: 9,
  CreateWalkInOrder: 10,
  ModifyProductInventory: 11,
} as const;

export type StoreAdminPermissionId = (typeof PERMISSION)[keyof typeof PERMISSION];

export interface AuthAdminDto {
  user_id: string;
  first_name: string;
  last_name: string | null;
  status: boolean;
  assigned_at: string;
  assigned_by: string | null;
  is_deleted: boolean;
  username: string;
  phone_no: string;
  assigned_store: string | null;
  assigned_stores?: string[];
  role_id: number;
  permissions?: StoreAdminPermissionDto[];
}

export interface AuthTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  admin: AuthAdminDto;
}

export interface OtpSentDto {
  expires_in: number;
  resend_after?: number;
}

export interface StoreAdminMyProfileDto {
  user_id: string;
  first_name: string;
  last_name: string | null;
  phone_no: string;
  username: string;
  assigned_stores: string[];
  role_id: number;
  must_relogin: boolean;
  permissions?: StoreAdminPermissionDto[];
}

export interface MustReloginDto {
  must_relogin: boolean;
}

export interface UpdateStoreAdminNameRequest {
  firstName: string;
  lastName?: string;
}

export interface SendStoreAdminChangePhoneOtpRequest {
  currentPassword: string;
  newPhoneNo: string;
}

export interface UpdateStoreAdminPhoneRequest {
  currentPassword: string;
  newPhoneNo: string;
  otp: string;
}

export interface UpdateStoreAdminUsernameRequest {
  currentPassword: string;
  newUsername: string;
  otp: string;
}

export interface ChangeStoreAdminPasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/** Matches backend OrderStatus enum */
export const OrderStatus = {
  Placed: 1,
  Accepted: 2,
  Preparing: 3,
  OutForDelivery: 4,
  Delivered: 5,
  Cancelled: 6,
  Transferred: 7,
} as const;

export type OrderStatusCode = (typeof OrderStatus)[keyof typeof OrderStatus];

export interface PagedResultDto<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface OrderListItemDto {
  order_id: string;
  order_number: string;
  token: number;
  status: number;
  status_text: string;
  payment_status: number;
  payment_status_text: string;
  payment_mode: number;
  grand_total: number;
  currency: string;
  estimated_delivery_minutes: number | null;
  estimated_delivery_at: string | null;
  accepted_at: string | null;
  created_at: string;
  item_count: number;
  preview_image_url: string | null;
  preview_product_name: string | null;
  receiver_name: string | null;
  receiver_contact: string | null;
  delivery_area: string | null;
  store_id: string | null;
  store_name: string | null;
}

export interface OrderChangedEventDto {
  event_type: string;
  order_id: string;
  store_id: string;
  old_status: number | null;
  new_status: number;
  order: OrderListItemDto | null;
}

export interface StoreOrdersQuery {
  storeId?: string | null;
  statuses: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface UpdateOrderStatusRequest {
  orderId: string;
  status: number;
  estimatedDeliveryMinutes?: number | null;
}

export interface PlaceWalkInOrderItemRequest {
  productId: string;
  productQnt: number;
  productPrice: number;
}

export interface PlaceWalkInOrderRequest {
  note?: string | null;
  paymentMode?: number;
  totalPrice: number;
  /** Applied on backend only when order user is virtual (walk-in). */
  receiverName?: string | null;
  /** Applied on backend only when order user is virtual (walk-in). */
  receiverContact?: string | null;
  items: PlaceWalkInOrderItemRequest[];
}

export interface PlaceWalkInOrderItemResponse {
  order_item_id: string;
  product_id: string | null;
  product_name: string;
  display_text: string | null;
  quantity: number;
  selling_price: number;
  line_total: number;
}

export interface PlaceWalkInOrderResponse {
  order_id: string;
  order_number: string;
  token: number;
  user_id: string | null;
  order_source: number;
  store_id: string | null;
  original_store_id: string | null;
  status: number;
  status_text: string;
  payment_mode: number;
  payment_status: number;
  payment_status_text: string;
  note: string | null;
  subtotal: number;
  discount_total: number;
  delivery_fee: number;
  grand_total: number;
  currency: string;
  created_at: string;
  items: PlaceWalkInOrderItemResponse[];
}

export interface CancelOrderRequest {
  orderId: string;
  cancelReason?: string | null;
}

export interface TransferOrderRequest {
  orderId: string;
  toStoreId: string;
  reason?: string | null;
}

export interface AssignedAdminDto {
  user_id: string;
  name: string;
  phone_no: string | null;
}

export interface StoreListItemDto {
  store_id: string;
  store_name: string;
  status: boolean;
  address: string;
  assigned_admins?: AssignedAdminDto[];
  assigned_admin: AssignedAdminDto | null;
  contact_phones?: string[];
  contact_emails?: string[];
}

export interface OrderAddressDetailsDto {
  source_add_id: string | null;
  label: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pin_code: string;
  country: string;
  is_default: boolean;
  latitude: number | null;
  longitude: number | null;
  receiver_name: string | null;
  receiver_contact: string | null;
}

export interface OrderItemDetailsDto {
  order_item_id: string;
  product_id: string | null;
  quantity: number;
  category_id: number | null;
  category_name: string | null;
  product_name: string;
  slug: string | null;
  sku: string | null;
  short_description: string | null;
  is_veg: boolean | null;
  is_organic: boolean | null;
  packaging_unit: string | null;
  pack_size: number | null;
  display_text: string | null;
  mrp: number;
  selling_price: number;
  discount_percent: number;
  currency: string;
  gst_percent: number | null;
  primary_image_url: string | null;
  line_total: number;
}

export interface OrderDetailsDto {
  order_id: string;
  order_number: string;
  token: number;
  user_id: string | null;
  order_source: number;
  store_id: string | null;
  store_name: string | null;
  original_store_id: string | null;
  status: number;
  status_text: string;
  payment_mode: number;
  payment_status: number;
  payment_status_text: string;
  note: string | null;
  subtotal: number;
  discount_total: number;
  delivery_fee: number;
  grand_total: number;
  bill_gst_enabled?: boolean;
  bill_gst_percent?: number | null;
  bill_gst_amount?: number | null;
  bill_cgst_amount?: number | null;
  bill_sgst_amount?: number | null;
  currency: string;
  cancelled_at: string | null;
  cancel_reason: string | null;
  cancelled_by: string | null;
  estimated_delivery_minutes: number | null;
  estimated_delivery_at: string | null;
  accepted_at: string | null;
  accepted_by: string | null;
  created_at: string;
  updated_at: string | null;
  address: OrderAddressDetailsDto | null;
  items: OrderItemDetailsDto[];
}

export interface ProductImageDto {
  url: string;
  is_primary: boolean;
  sort_order: number;
}

export interface ProductListItemDto {
  product_id: string;
  product_name: string;
  category_id: number;
  category_name: string;
  mrp: number;
  selling_price: number;
  discount_percent: number;
  display_text?: string | null;
  is_available: boolean;
  /** Customer-only; store admin UI ignores this. */
  is_favorite?: boolean;
  status: boolean;
  /** Present on store inventory list; null/undefined on global catalog */
  quantity_on_hand?: number | null;
  images: ProductImageDto[];
}

export interface ProductDetailsDto {
  product_id: string;
  category_id: number;
  category_name: string;
  product_name: string;
  slug: string;
  sku: string;
  short_description: string | null;
  description: string | null;
  is_veg: boolean;
  is_organic: boolean;
  shelf_life_days: number | null;
  storage_type: string | null;
  is_available: boolean;
  /** Customer-only; store admin UI ignores this. */
  is_favorite?: boolean;
  is_featured: boolean;
  status: boolean;
  /** Set when GetProductById is called with storeId; null if not in that store inventory */
  quantity_on_hand: number | null;
  created_at: string;
  updated_at: string | null;
  images: ProductImageDto[];
  packaging_unit: string | null;
  pack_size: number | null;
  packaging_display_text: string | null;
  mrp: number | null;
  selling_price: number | null;
  discount_percent: number | null;
  currency: string | null;
  gst_percent: number | null;
  calories: number | null;
  protein_grams: number | null;
  fat_grams: number | null;
  carbs_grams: number | null;
  nutrition_per: string | null;
}

export interface AddToInventoryRequest {
  productId: string;
  storeId: string;
}

export interface RemoveFromInventoryRequest {
  productId: string;
  storeId: string;
}

export interface UpdateInventoryQuantityRequest {
  productId: string;
  storeId: string;
  quantity: number;
}

export interface RemoveFromInventoryResultDto {
  store_id: string;
  product_id: string;
}

export interface StoreInventoryItemDto {
  store_id: string;
  product_id: string;
  quantity_on_hand: number;
  is_listed: boolean;
  updated_at: string | null;
  updated_by: string | null;
}

export const ComplaintStatus = {
  Open: 1,
  InProgress: 2,
  Resolved: 3,
} as const;

export type ComplaintStatusCode = (typeof ComplaintStatus)[keyof typeof ComplaintStatus];

export interface ComplaintListQuery {
  status?: number | null;
  page?: number;
  pageSize?: number;
}

export interface ComplaintListItemDto {
  complaint_id: string;
  complaint_number: string;
  order_id: string;
  order_number: string;
  store_id: string;
  store_name: string;
  status: number;
  status_text: string;
  last_message_preview: string | null;
  last_message_at: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface ComplaintAttachmentDto {
  url: string;
  media_type: string;
  sort_order: number;
}

export interface ComplaintMessageDto {
  message_id: string;
  sender_user_id: string;
  sender_role: string;
  sender_name: string;
  body: string;
  created_at: string;
  attachments: ComplaintAttachmentDto[];
}

export interface ComplaintDetailsDto {
  complaint_id: string;
  complaint_number: string;
  order_id: string;
  order_number: string;
  store_id: string;
  store_name: string;
  user_id: string;
  customer_name: string;
  customer_phone: string;
  status: number;
  status_text: string;
  created_at: string;
  updated_at: string | null;
  resolved_at: string | null;
  resolve_note: string | null;
  can_reply: boolean;
  messages: ComplaintMessageDto[];
}

export interface ComplaintAttachmentInput {
  url: string;
  mediaType: string;
  sortOrder: number;
}

export interface ReplyComplaintRequest {
  body: string;
  attachments: ComplaintAttachmentInput[];
}

export interface ResolveComplaintRequest {
  note?: string | null;
}

export interface FeedbackListItemDto {
  feedback_id: string;
  user_id: string;
  customer_name: string;
  customer_phone: string;
  order_id: string | null;
  order_number: string | null;
  store_id: string | null;
  store_name: string | null;
  rating: number;
  body: string;
  created_at: string;
}

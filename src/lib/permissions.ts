import { PERMISSION } from '@/types/api';

export { PERMISSION };

export const PERMISSION_REQUIRED_MESSAGE: Record<number, string> = {
  [PERMISSION.AddProductToStore]: 'Add Product To Store permission is required.',
  [PERMISSION.RemoveProductFromStore]: 'Remove Product From Store permission is required.',
  [PERMISSION.ChatWithCustomer]: 'Chat with Customer permission is required.',
  [PERMISSION.ViewReport]: 'View Report permission is required.',
  [PERMISSION.ViewFeedbacks]: 'View Feedbacks permission is required.',
  [PERMISSION.ViewLiveOrders]: 'View Live Orders permission is required.',
  [PERMISSION.ViewRunningOrders]: 'View Running Orders permission is required.',
  [PERMISSION.ViewOutForDelivery]: 'View Out For Delivery permission is required.',
  [PERMISSION.ViewCompletedOrders]: 'View Completed Orders permission is required.',
  [PERMISSION.CreateWalkInOrder]: 'Create Walk-in Order permission is required.',
  [PERMISSION.ModifyProductInventory]: 'Do not have permission to update this.',
};

export function permissionRequiredMessage(permissionId: number) {
  return PERMISSION_REQUIRED_MESSAGE[permissionId] || 'Permission is required.';
}

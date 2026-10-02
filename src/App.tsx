import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { LiveOrdersPage } from '@/pages/LiveOrdersPage';
import { RunningOrdersPage } from '@/pages/RunningOrdersPage';
import { OutForDeliveryPage } from '@/pages/OutForDeliveryPage';
import { CompletedOrdersPage } from '@/pages/CompletedOrdersPage';
import { CancelledOrdersPage } from '@/pages/CancelledOrdersPage';
import { OrderDetailPage } from '@/pages/OrderDetailPage';
import { CreateWalkInOrderPage } from '@/pages/CreateWalkInOrderPage';
import { ProductsPage } from '@/pages/ProductsPage';
import { AddProductPage } from '@/pages/AddProductPage';
import { ProductDetailPage } from '@/pages/ProductDetailPage';
import { ComplaintsPage } from '@/pages/ComplaintsPage';
import { ComplaintDetailPage } from '@/pages/ComplaintDetailPage';
import { FeedbacksPage } from '@/pages/FeedbacksPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { ProfilePage } from '@/pages/ProfilePage';

function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="live-orders" element={<LiveOrdersPage />} />
          <Route path="running-orders" element={<RunningOrdersPage />} />
          <Route path="out-for-delivery" element={<OutForDeliveryPage />} />
          <Route path="completed-orders" element={<CompletedOrdersPage />} />
          <Route path="cancelled-orders" element={<CancelledOrdersPage />} />
          <Route path="orders/create" element={<CreateWalkInOrderPage />} />
          <Route path="orders/:orderId" element={<OrderDetailPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/add" element={<AddProductPage />} />
          <Route path="products/:productId" element={<ProductDetailPage />} />
          <Route path="complaints" element={<ComplaintsPage />} />
          <Route path="complaints/:complaintId" element={<ComplaintDetailPage />} />
          <Route path="feedbacks" element={<FeedbacksPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

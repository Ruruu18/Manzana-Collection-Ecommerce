import "./styles/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute";
import AdminLayout from "./layouts/AdminLayout";
import AdminLogin from "./pages/admin/Login";
import Dashboard from "./pages/admin/Dashboard";
import Products from "./pages/admin/Products";
import Categories from "./pages/admin/Categories";
import Promotions from "./pages/admin/Promotions";
import Orders from "./pages/admin/Orders";
import Customers from "./pages/admin/Customers";
import StaffManagement from "./pages/admin/StaffManagement";
import UserManagement from "./pages/admin/UserManagement";
import Reviews from "./pages/admin/Reviews";
import Reports from "./pages/admin/Reports";
import ErrorBoundary from "./components/ErrorBoundary";

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/admin/login" replace />} />
          <Route path="/admin/login" element={<AdminLogin />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="products" element={<Products />} />
              <Route path="categories" element={<Categories />} />
              <Route path="promotions" element={<Promotions />} />
              <Route path="orders" element={<Orders />} />
              <Route path="customers" element={<Customers />} />
              <Route path="staff" element={<StaffManagement />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="reviews" element={<Reviews />} />
              <Route path="reports" element={<Reports />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;

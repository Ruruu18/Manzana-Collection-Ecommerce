import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

interface DashboardStats {
  totalOrders: number;
  totalProducts: number;
  lowStockProducts: number;
  pendingOrders: number;
  ordersGrowth: number;
  productsGrowth: number;
}

interface RecentOrder {
  id: string;
  customer: string;
  amount: number;
  status: string;
  date: string;
}

interface Product {
  id: string;
  name: string;
  stock_quantity: number;
  price: number;
  sku: string;
}

export default function StaffDashboard() {
  const { isStaff, isAdmin, userProfile } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalProducts: 0,
    lowStockProducts: 0,
    pendingOrders: 0,
    ordersGrowth: 0,
    productsGrowth: 0,
  });

  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [orderStatusData, setOrderStatusData] = useState({
    completed: 0,
    pending: 0,
    shipped: 0,
    processing: 0,
    cancelled: 0,
    total: 0
  });
  const [loading, setLoading] = useState(true);

  // Redirect if not staff or admin
  useEffect(() => {
    if (!isStaff && !isAdmin) {
      navigate('/');
      return;
    }
  }, [isStaff, isAdmin, navigate]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch orders
      const ordersResult = await supabase
        .from('orders')
        .select('*, users(full_name, email)');

      // Fetch products
      const productsResult = await supabase
        .from('products')
        .select('*');

      const orders = ordersResult.data || [];
      const products = productsResult.data || [];

      // Calculate stats
      const lowStockThreshold = 10;
      const lowStock = products.filter((p: any) => (p.stock_quantity || 0) < lowStockThreshold);
      const pendingOrders = orders.filter((o: any) => o.status === 'pending');

      // Calculate growth (month-over-month)
      const now = new Date();
      const currentMonth = now.getMonth();
      const thisYear = now.getFullYear();
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastMonthYear = currentMonth === 0 ? thisYear - 1 : thisYear;

      // Current month orders
      const currentMonthOrders = orders.filter((order: any) => {
        const date = new Date(order.created_at);
        return date.getMonth() === currentMonth && date.getFullYear() === thisYear;
      });

      // Last month orders
      const lastMonthOrders = orders.filter((order: any) => {
        const date = new Date(order.created_at);
        return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
      });

      // Calculate order growth
      const ordersGrowth = lastMonthOrders.length > 0
        ? Number((((currentMonthOrders.length - lastMonthOrders.length) / lastMonthOrders.length) * 100).toFixed(1))
        : 0;

      // Recent orders (last 5)
      const sortedOrders = orders
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

      const formattedOrders: RecentOrder[] = sortedOrders.map((order: any) => ({
        id: order.id,
        customer: order.users?.full_name || order.users?.email || 'N/A',
        amount: parseFloat(order.total_amount || '0'),
        status: order.status || 'pending',
        date: new Date(order.created_at).toLocaleDateString()
      }));

      // Order status distribution
      const statusCounts = {
        completed: 0,
        pending: 0,
        shipped: 0,
        processing: 0,
        cancelled: 0,
        total: orders.length
      };

      orders.forEach((order: any) => {
        const status = order.status?.toLowerCase() || 'pending';
        if (status in statusCounts) {
          statusCounts[status as keyof typeof statusCounts]++;
        }
      });

      setStats({
        totalOrders: orders.length,
        totalProducts: products.length,
        lowStockProducts: lowStock.length,
        pendingOrders: pendingOrders.length,
        ordersGrowth,
        productsGrowth: 0,
      });

      setRecentOrders(formattedOrders);
      setLowStockProducts(lowStock.slice(0, 5));
      setOrderStatusData(statusCounts);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'shipped': return 'info';
      case 'processing': return 'primary';
      case 'cancelled': return 'danger';
      default: return 'secondary';
    }
  };

  if (!isStaff && !isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <div className="loading" style={{ padding: 'var(--spacing-2xl)', textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto var(--spacing)' }}></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* Welcome Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Staff Dashboard</h1>
          <p className="dashboard-subtitle">
            Welcome back, {userProfile?.full_name || 'Staff Member'}! Manage products, inventory, and orders.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid cols-4 gap-lg" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <div className="card metric-card">
          <div className="metric-label">Total Orders</div>
          <div className="metric-value">{stats.totalOrders}</div>
          {stats.ordersGrowth !== 0 ? (
            <div className={`metric-change ${stats.ordersGrowth > 0 ? 'positive' : 'negative'}`}>
              <span>{stats.ordersGrowth > 0 ? '📈' : '📉'}</span>
              {stats.ordersGrowth > 0 ? '+' : ''}{stats.ordersGrowth}% from last month
            </div>
          ) : (
            <div className="metric-change neutral">
              <span>📊</span>
              No comparison data
            </div>
          )}
        </div>

        <div className="card metric-card">
          <div className="metric-label">Total Products</div>
          <div className="metric-value">{stats.totalProducts}</div>
          <div className="metric-change neutral">
            <span>📦</span>
            In inventory
          </div>
        </div>

        <div className="card metric-card">
          <div className="metric-label">Low Stock Alert</div>
          <div className="metric-value" style={{ color: stats.lowStockProducts > 0 ? 'var(--warning)' : 'var(--success)' }}>
            {stats.lowStockProducts}
          </div>
          <div className="metric-change" style={{ color: stats.lowStockProducts > 0 ? 'var(--warning)' : 'var(--success)' }}>
            <span>{stats.lowStockProducts > 0 ? '⚠️' : '✅'}</span>
            {stats.lowStockProducts > 0 ? 'Products need restock' : 'Stock levels good'}
          </div>
        </div>

        <div className="card metric-card">
          <div className="metric-label">Pending Orders</div>
          <div className="metric-value" style={{ color: stats.pendingOrders > 0 ? 'var(--warning)' : 'var(--success)' }}>
            {stats.pendingOrders}
          </div>
          <div className="metric-change" style={{ color: stats.pendingOrders > 0 ? 'var(--warning)' : 'var(--success)' }}>
            <span>{stats.pendingOrders > 0 ? '⏳' : '✅'}</span>
            {stats.pendingOrders > 0 ? 'Need processing' : 'All processed'}
          </div>
        </div>
      </div>

      <div className="grid cols-2 gap-lg">
        {/* Recent Orders */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing)' }}>
            <h3>Recent Orders</h3>
            <button className="btn btn-secondary" onClick={() => navigate('/admin/orders')}>
              View All
            </button>
          </div>

          {recentOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl)', color: 'var(--muted)' }}>
              <div style={{ fontSize: '48px', marginBottom: 'var(--spacing-sm)' }}>📋</div>
              <p>No orders yet</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td>{order.customer}</td>
                      <td style={{ fontWeight: 'var(--font-weight-semibold)' }}>
                        {formatCurrency(order.amount)}
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td style={{ color: 'var(--muted)', fontSize: '14px' }}>
                        {order.date}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Order Status Overview */}
        <div className="card">
          <h3 style={{ marginBottom: 'var(--spacing)' }}>Order Status</h3>

          {orderStatusData.total === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl)', color: 'var(--muted)' }}>
              <div style={{ fontSize: '48px', marginBottom: 'var(--spacing-sm)' }}>📊</div>
              <p>No orders data yet</p>
            </div>
          ) : (
            <>
              <div className="donut-chart" style={{ textAlign: 'center', marginBottom: 'var(--spacing-lg)' }}>
                <div
                  className="donut"
                  data-label={orderStatusData.total.toString()}
                  style={{
                    background: `conic-gradient(
                      var(--primary) 0 ${(orderStatusData.completed / orderStatusData.total) * 100}%,
                      var(--warning) ${(orderStatusData.completed / orderStatusData.total) * 100}% ${((orderStatusData.completed + orderStatusData.pending) / orderStatusData.total) * 100}%,
                      var(--info) ${((orderStatusData.completed + orderStatusData.pending) / orderStatusData.total) * 100}% ${((orderStatusData.completed + orderStatusData.pending + orderStatusData.shipped) / orderStatusData.total) * 100}%,
                      var(--border-light) ${((orderStatusData.completed + orderStatusData.pending + orderStatusData.shipped) / orderStatusData.total) * 100}% 100%
                    )`
                  }}
                />
              </div>

              <div className="legend">
                <div className="legend-item">
                  <span className="legend-dot" style={{ background: 'var(--primary)' }}></span>
                  <span className="legend-label">Completed</span>
                  <span className="legend-value">
                    {orderStatusData.total > 0 ? Math.round((orderStatusData.completed / orderStatusData.total) * 100) : 0}%
                  </span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot" style={{ background: 'var(--warning)' }}></span>
                  <span className="legend-label">Pending</span>
                  <span className="legend-value">
                    {orderStatusData.total > 0 ? Math.round((orderStatusData.pending / orderStatusData.total) * 100) : 0}%
                  </span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot" style={{ background: 'var(--info)' }}></span>
                  <span className="legend-label">Shipped</span>
                  <span className="legend-value">
                    {orderStatusData.total > 0 ? Math.round((orderStatusData.shipped / orderStatusData.total) * 100) : 0}%
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Low Stock Products */}
      {lowStockProducts.length > 0 && (
        <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing)' }}>
            <h3>Low Stock Products</h3>
            <button className="btn btn-secondary" onClick={() => navigate('/admin/products')}>
              Manage Products
            </button>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Stock</th>
                  <th>Price</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {lowStockProducts.map((product) => (
                  <tr key={product.id}>
                    <td style={{ fontWeight: 'var(--font-weight-semibold)' }}>
                      {product.name}
                    </td>
                    <td style={{ color: 'var(--muted)', fontSize: '14px' }}>
                      {product.sku || 'N/A'}
                    </td>
                    <td>
                      <span className="badge danger">
                        {product.stock_quantity || 0} units
                      </span>
                    </td>
                    <td style={{ fontWeight: 'var(--font-weight-semibold)' }}>
                      {formatCurrency(product.price || 0)}
                    </td>
                    <td>
                      <button
                        className="btn btn-primary"
                        style={{ fontSize: '12px', padding: '6px 10px' }}
                        onClick={() => navigate(`/admin/products?edit=${product.id}`)}
                      >
                        Restock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
        <h3 style={{ marginBottom: 'var(--spacing)' }}>Quick Actions</h3>
        <div className="grid cols-4 gap">
          <button className="btn btn-primary" onClick={() => navigate('/admin/products')}>
            📦 Manage Products
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/admin/orders')}>
            📋 Process Orders
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/admin/categories')}>
            📂 Manage Categories
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/admin')}>
            📊 View Full Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

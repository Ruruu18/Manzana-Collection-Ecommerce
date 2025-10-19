import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import "../../styles/dashboard-enhancement.css";

interface DashboardStats {
  totalSales: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  salesGrowth: number;
  ordersGrowth: number;
  productsGrowth: number;
  customersGrowth: number;
}

interface RecentOrder {
  id: string;
  customer: string;
  amount: number;
  status: string;
  date: string;
}

interface TopProduct {
  id: string;
  name: string;
  sales: number;
  revenue: number;
}

export default function Dashboard() {
  const { userProfile, isAdmin, isStaff, userRole } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
    salesGrowth: 0,
    ordersGrowth: 0,
    productsGrowth: 0,
    customersGrowth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [staffCount, setStaffCount] = useState(0);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [monthlySales, setMonthlySales] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const [orderStatusData, setOrderStatusData] = useState({
    delivered: 0,
    pending: 0,
    confirmed: 0,
    processing: 0,
    shipped: 0,
    cancelled: 0,
    total: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadRecentOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          total_amount,
          status,
          created_at,
          users:user_id (full_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error loading recent orders:', error);
        setRecentOrders([]);
        return;
      }

      const formattedOrders: RecentOrder[] = (data || []).map((order: any) => ({
        id: order.id,
        customer: order.users?.full_name || order.users?.email || 'Unknown Customer',
        amount: parseFloat(order.total_amount) || 0,
        status: order.status || 'pending',
        date: order.created_at ? new Date(order.created_at).toISOString().split('T')[0] : ''
      }));

      setRecentOrders(formattedOrders);
    } catch (error) {
      console.error('Failed to load recent orders:', error);
      setRecentOrders([]);
    }
  };

  const loadTopProducts = async () => {
    try {
      // Get products with their order items to calculate top performers
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          price,
          order_items!inner (
            quantity,
            unit_price,
            total_price
          )
        `)
        .eq('is_active', true)
        .limit(10);

      if (error) {
        console.error('Error loading top products:', error);
        setTopProducts([]);
        return;
      }

      // Calculate sales and revenue for each product
      const productStats = (data || []).map((product: any) => {
        const sales = product.order_items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0;
        const revenue = product.order_items?.reduce((sum: number, item: any) => sum + (parseFloat(item.total_price) || 0), 0) || 0;

        return {
          id: product.id,
          name: product.name,
          sales,
          revenue
        };
      });

      // Sort by sales and take top 4
      const topPerformers = productStats
        .sort((a: any, b: any) => b.sales - a.sales)
        .slice(0, 4);

      setTopProducts(topPerformers);
    } catch (error) {
      console.error('Failed to load top products:', error);
      setTopProducts([]);
    }
  };

  const loadDashboardData = async () => {
    try {
      console.log('📊 Loading dashboard data...');

      // Load real data from Supabase with proper error handling
      const promises = [
        supabase.from('orders').select('total_amount, created_at, status', { count: 'exact' }),
        supabase.from('products').select('id, price', { count: 'exact' }).eq('is_active', true),
        supabase.from('users').select('id', { count: 'exact' }).in('user_type', ['consumer', 'reseller'])
      ];

      // Only add staff query if user is admin
      if (isAdmin) {
        promises.push(supabase.from('users').select('id', { count: 'exact' }).eq('user_type', 'staff'));
      }

      const results = await Promise.all(promises);
      const [ordersResult, productsResult, customersResult, staffResult] = results;

      console.log('📊 Dashboard data results:', {
        orders: { count: ordersResult.count, dataLength: ordersResult.data?.length },
        products: { count: productsResult.count, dataLength: productsResult.data?.length },
        customers: { count: customersResult.count },
        staff: isAdmin ? { count: staffResult?.count } : 'N/A'
      });

      // Calculate total sales from orders
      const totalSales = ordersResult.data?.reduce((sum: number, order: any) => {
        return sum + (parseFloat(order.total_amount) || 0);
      }, 0) || 0;

      // Calculate monthly sales data
      const currentYear = new Date().getFullYear();
      const salesByMonth = new Array(12).fill(0);

      ordersResult.data?.forEach((order: any) => {
        const orderDate = new Date(order.created_at);
        if (orderDate.getFullYear() === currentYear) {
          const month = orderDate.getMonth();
          salesByMonth[month] += parseFloat(order.total_amount) || 0;
        }
      });

      setMonthlySales(salesByMonth);

      // Calculate order status distribution
      const statusCounts = {
        delivered: 0,
        pending: 0,
        confirmed: 0,
        processing: 0,
        shipped: 0,
        cancelled: 0,
        total: ordersResult.data?.length || 0
      };

      ordersResult.data?.forEach((order: any) => {
        const status = order.status?.toLowerCase() || 'pending';
        if (status in statusCounts) {
          statusCounts[status as keyof typeof statusCounts]++;
        }
      });

      setOrderStatusData(statusCounts);

      // Calculate growth percentages by comparing this month vs last month
      const now = new Date();
      const currentMonth = now.getMonth();
      const thisYear = now.getFullYear();
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastMonthYear = currentMonth === 0 ? thisYear - 1 : thisYear;

      // Current month data
      const currentMonthOrders = ordersResult.data?.filter((order: any) => {
        const date = new Date(order.created_at);
        return date.getMonth() === currentMonth && date.getFullYear() === thisYear;
      }) || [];

      const currentMonthSales = currentMonthOrders.reduce((sum: number, order: any) =>
        sum + (parseFloat(order.total_amount) || 0), 0);

      // Last month data
      const lastMonthOrders = ordersResult.data?.filter((order: any) => {
        const date = new Date(order.created_at);
        return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
      }) || [];

      const lastMonthSales = lastMonthOrders.reduce((sum: number, order: any) =>
        sum + (parseFloat(order.total_amount) || 0), 0);

      // Calculate growth percentages
      const salesGrowth = lastMonthSales > 0
        ? Number((((currentMonthSales - lastMonthSales) / lastMonthSales) * 100).toFixed(1))
        : 0;

      const ordersGrowth = lastMonthOrders.length > 0
        ? Number((((currentMonthOrders.length - lastMonthOrders.length) / lastMonthOrders.length) * 100).toFixed(1))
        : 0;

      const newStats = {
        totalSales,
        totalOrders: ordersResult.count || 0,
        totalProducts: productsResult.count || 0,
        totalCustomers: customersResult.count || 0,
        salesGrowth,
        ordersGrowth,
        productsGrowth: 0, // No historical data for products
        customersGrowth: 0, // No historical data for customers
      };

      setStats(newStats);
      console.log('📊 Updated stats:', newStats);

      if (isAdmin && staffResult) {
        setStaffCount(staffResult.count || 0);
      }

      // Load recent orders
      await loadRecentOrders();
      
      // Load top products
      await loadTopProducts();

      setLoading(false);
    } catch (error) {
      console.error("📊 Failed to load dashboard data:", error);

      // Set empty stats on error - show real data only
      setStats({
        totalSales: 0,
        totalOrders: 0,
        totalProducts: 0,
        totalCustomers: 0,
        salesGrowth: 0,
        ordersGrowth: 0,
        productsGrowth: 0,
        customersGrowth: 0,
      });

      // Still try to load orders and products
      await loadRecentOrders();
      await loadTopProducts();

      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      delivered: "success",
      pending: "warning",
      confirmed: "info",
      processing: "info",
      shipped: "success",
      cancelled: "danger",
    };
    return statusMap[status as keyof typeof statusMap] || "info";
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <span>Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">
            {userRole === 'admin' ? 'Admin Dashboard' : 'Staff Dashboard'}
          </h1>
          <p className="dashboard-subtitle">
            Welcome back, {userProfile?.full_name || 'User'}! 
            {isAdmin && ' You have full administrative access.'} 
            {isStaff && ' You have staff-level permissions.'}
          </p>
        </div>
        <div className="dashboard-actions">
          {/* Quick actions moved to bottom section */}
        </div>
      </div>

      {/* Key Metrics */}
      <div
        className={`grid ${isAdmin ? 'cols-5' : 'cols-4'}`}
        style={{ marginBottom: "1.25rem" }}
      >
        <div className="metric-card success">
          <div className="metric-header">
            <h3 className="metric-title">
              <span className="metric-icon">💰</span>
              Total Sales
            </h3>
          </div>
          <div className="metric-value">{formatCurrency(stats.totalSales)}</div>
          {stats.salesGrowth !== 0 ? (
            <div
              className={`metric-change ${stats.salesGrowth > 0 ? "positive" : "negative"}`}
            >
              <span>{stats.salesGrowth > 0 ? "📈" : "📉"}</span>
              {stats.salesGrowth > 0 ? "+" : ""}
              {stats.salesGrowth}% from last month
            </div>
          ) : (
            <div className="metric-change neutral">
              <span>📊</span>
              No comparison data
            </div>
          )}
        </div>

        <div className="metric-card info">
          <div className="metric-header">
            <h3 className="metric-title">
              <span className="metric-icon">📋</span>
              Orders
            </h3>
          </div>
          <div className="metric-value">{formatNumber(stats.totalOrders)}</div>
          {stats.ordersGrowth !== 0 ? (
            <div
              className={`metric-change ${stats.ordersGrowth > 0 ? "positive" : "negative"}`}
            >
              <span>{stats.ordersGrowth > 0 ? "📈" : "📉"}</span>
              {stats.ordersGrowth > 0 ? "+" : ""}
              {stats.ordersGrowth}% from last month
            </div>
          ) : (
            <div className="metric-change neutral">
              <span>📊</span>
              No comparison data
            </div>
          )}
        </div>

        <div className="metric-card warning">
          <div className="metric-header">
            <h3 className="metric-title">
              <span className="metric-icon">📦</span>
              Products
            </h3>
          </div>
          <div className="metric-value">
            {formatNumber(stats.totalProducts)}
          </div>
          <div className="metric-change neutral">
            <span>📦</span>
            Active products
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <h3 className="metric-title">
              <span className="metric-icon">👥</span>
              Customers
            </h3>
          </div>
          <div className="metric-value">
            {formatNumber(stats.totalCustomers)}
          </div>
          <div className="metric-change neutral">
            <span>👥</span>
            Registered users
          </div>
        </div>

        {/* Staff metric - only show for admins */}
        {isAdmin && (
          <div className="metric-card admin">
            <div className="metric-header">
              <h3 className="metric-title">
                <span className="metric-icon">👨‍💼</span>
                Staff Members
              </h3>
            </div>
            <div className="metric-value">
              {formatNumber(staffCount)}
            </div>
            <div className="metric-change positive">
              <span>✅</span>
              Active staff accounts
            </div>
          </div>
        )}
      </div>

      {/* Charts and Analytics */}
      <div
        className="grid cols-3"
        style={{ marginBottom: "1.25rem" }}
      >
        <div className="card" style={{ gridColumn: "span 2" }}>
          <h3>Sales Overview (Current Year)</h3>
          <div className="chart-container">
            {monthlySales.every(val => val === 0) ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--muted)" }}>
                <div style={{ fontSize: "40px", marginBottom: "8px" }}>📊</div>
                <div>No sales data yet for this year</div>
              </div>
            ) : (
              <div style={{
                padding: '20px 16px',
                perspective: '1000px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'space-around',
                  height: '240px',
                  gap: '6px',
                  transformStyle: 'preserve-3d',
                  transform: 'rotateX(5deg)'
                }}>
                  {monthlySales.map((sales, index) => {
                    const maxSales = Math.max(...monthlySales, 1);
                    const heightPercent = (sales / maxSales) * 100;
                    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

                    // Color gradient from blue to cyan
                    const colors = [
                      '#3b82f6', '#60a5fa', '#38bdf8', '#22d3ee',
                      '#14b8a6', '#10b981', '#34d399', '#6ee7b7',
                      '#5eead4', '#2dd4bf', '#22d3ee', '#06b6d4'
                    ];

                    return (
                      <div
                        key={index}
                        style={{
                          flex: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          position: 'relative'
                        }}
                      >
                        {/* Value label on top */}
                        {sales > 0 && (
                          <div style={{
                            fontSize: '11px',
                            fontWeight: '600',
                            color: '#374151',
                            marginBottom: '8px',
                            whiteSpace: 'nowrap'
                          }}>
                            {formatNumber(Math.round(sales))}
                          </div>
                        )}

                        {/* 3D Bar */}
                        <div style={{
                          width: '100%',
                          height: `${heightPercent}%`,
                          position: 'relative',
                          transformStyle: 'preserve-3d',
                          transform: 'translateZ(0)',
                          minHeight: sales > 0 ? '30px' : '0'
                        }}>
                          {/* Front face */}
                          <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: `linear-gradient(180deg, ${colors[index]} 0%, ${colors[index]}dd 100%)`,
                            borderRadius: '4px 4px 0 0',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                          }} />

                          {/* Top face */}
                          <div style={{
                            position: 'absolute',
                            top: '-6px',
                            left: '50%',
                            transform: 'translateX(-50%) rotateX(90deg) translateZ(3px)',
                            width: '100%',
                            height: '12px',
                            background: `linear-gradient(90deg, ${colors[index]}ee 0%, ${colors[index]} 100%)`,
                            borderRadius: '4px',
                            transformOrigin: 'bottom center'
                          }} />

                          {/* Side face */}
                          <div style={{
                            position: 'absolute',
                            top: 0,
                            right: '-4px',
                            bottom: 0,
                            width: '8px',
                            background: `linear-gradient(90deg, ${colors[index]}88 0%, ${colors[index]}66 100%)`,
                            borderRadius: '0 4px 0 0',
                            transform: 'rotateY(10deg)',
                            transformOrigin: 'left center'
                          }} />
                        </div>

                        {/* Month label */}
                        <div style={{
                          fontSize: '11px',
                          color: '#6b7280',
                          marginTop: '12px',
                          fontWeight: '500'
                        }}>
                          {months[index]}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <h3>Order Status</h3>
          {orderStatusData.total === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--muted)" }}>
              <div style={{ fontSize: "40px", marginBottom: "8px" }}>📊</div>
              <div>No orders to display</div>
            </div>
          ) : (
            <>
              <div className="donut-container">
                <div
                  className="donut"
                  data-label={formatNumber(orderStatusData.total)}
                  style={{
                    background: `conic-gradient(
                      #10b981 0 ${(orderStatusData.delivered / orderStatusData.total) * 100}%,
                      #f59e0b ${(orderStatusData.delivered / orderStatusData.total) * 100}% ${((orderStatusData.delivered + orderStatusData.pending) / orderStatusData.total) * 100}%,
                      #06b6d4 ${((orderStatusData.delivered + orderStatusData.pending) / orderStatusData.total) * 100}% ${((orderStatusData.delivered + orderStatusData.pending + orderStatusData.confirmed) / orderStatusData.total) * 100}%,
                      #8b5cf6 ${((orderStatusData.delivered + orderStatusData.pending + orderStatusData.confirmed) / orderStatusData.total) * 100}% ${((orderStatusData.delivered + orderStatusData.pending + orderStatusData.confirmed + orderStatusData.processing) / orderStatusData.total) * 100}%,
                      #ec4899 ${((orderStatusData.delivered + orderStatusData.pending + orderStatusData.confirmed + orderStatusData.processing) / orderStatusData.total) * 100}% ${((orderStatusData.delivered + orderStatusData.pending + orderStatusData.confirmed + orderStatusData.processing + orderStatusData.shipped) / orderStatusData.total) * 100}%,
                      #ef4444 ${((orderStatusData.delivered + orderStatusData.pending + orderStatusData.confirmed + orderStatusData.processing + orderStatusData.shipped) / orderStatusData.total) * 100}% 100%
                    )`
                  }}
                />
              </div>
              <div style={{ marginTop: "var(--spacing)" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "var(--spacing-sm)",
                  }}
                >
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--spacing-sm)",
                    }}
                  >
                    <div
                      style={{
                        width: 12,
                        height: 12,
                        backgroundColor: "#10b981",
                        borderRadius: "2px",
                      }}
                    ></div>
                    <span style={{ fontSize: "14px" }}>Picked Up</span>
                  </span>
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: "var(--font-weight-semibold)",
                    }}
                  >
                    {orderStatusData.total > 0 ? Math.round((orderStatusData.delivered / orderStatusData.total) * 100) : 0}% ({orderStatusData.delivered})
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "var(--spacing-sm)",
                  }}
                >
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--spacing-sm)",
                    }}
                  >
                    <div
                      style={{
                        width: 12,
                        height: 12,
                        backgroundColor: "#f59e0b",
                        borderRadius: "2px",
                      }}
                    ></div>
                    <span style={{ fontSize: "14px" }}>Pending</span>
                  </span>
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: "var(--font-weight-semibold)",
                    }}
                  >
                    {orderStatusData.total > 0 ? Math.round((orderStatusData.pending / orderStatusData.total) * 100) : 0}% ({orderStatusData.pending})
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "var(--spacing-sm)",
                  }}
                >
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--spacing-sm)",
                    }}
                  >
                    <div
                      style={{
                        width: 12,
                        height: 12,
                        backgroundColor: "#06b6d4",
                        borderRadius: "2px",
                      }}
                    ></div>
                    <span style={{ fontSize: "14px" }}>Confirmed</span>
                  </span>
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: "var(--font-weight-semibold)",
                    }}
                  >
                    {orderStatusData.total > 0 ? Math.round((orderStatusData.confirmed / orderStatusData.total) * 100) : 0}% ({orderStatusData.confirmed})
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "var(--spacing-sm)",
                  }}
                >
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--spacing-sm)",
                    }}
                  >
                    <div
                      style={{
                        width: 12,
                        height: 12,
                        backgroundColor: "#8b5cf6",
                        borderRadius: "2px",
                      }}
                    ></div>
                    <span style={{ fontSize: "14px" }}>Processing</span>
                  </span>
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: "var(--font-weight-semibold)",
                    }}
                  >
                    {orderStatusData.total > 0 ? Math.round((orderStatusData.processing / orderStatusData.total) * 100) : 0}% ({orderStatusData.processing})
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "var(--spacing-sm)",
                  }}
                >
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--spacing-sm)",
                    }}
                  >
                    <div
                      style={{
                        width: 12,
                        height: 12,
                        backgroundColor: "#ec4899",
                        borderRadius: "2px",
                      }}
                    ></div>
                    <span style={{ fontSize: "14px" }}>Ready for Pickup</span>
                  </span>
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: "var(--font-weight-semibold)",
                    }}
                  >
                    {orderStatusData.total > 0 ? Math.round((orderStatusData.shipped / orderStatusData.total) * 100) : 0}% ({orderStatusData.shipped})
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "var(--spacing-sm)",
                  }}
                >
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--spacing-sm)",
                    }}
                  >
                    <div
                      style={{
                        width: 12,
                        height: 12,
                        backgroundColor: "#ef4444",
                        borderRadius: "2px",
                      }}
                    ></div>
                    <span style={{ fontSize: "14px" }}>Cancelled</span>
                  </span>
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: "var(--font-weight-semibold)",
                    }}
                  >
                    {orderStatusData.total > 0 ? Math.round((orderStatusData.cancelled / orderStatusData.total) * 100) : 0}% ({orderStatusData.cancelled})
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Data Tables */}
      <div className="grid cols-2">
        {/* Recent Orders */}
        <div className="card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "var(--spacing)",
            }}
          >
            <h3>Recent Orders</h3>
            <button
              className="btn btn-secondary"
              style={{ fontSize: "12px", padding: "6px 12px" }}
              onClick={() => navigate('/admin/orders')}
            >
              View All
            </button>
          </div>
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
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", padding: "30px", color: "var(--muted)" }}>
                      <div style={{ fontSize: "40px", marginBottom: "8px" }}>📋</div>
                      <div>No orders yet</div>
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td style={{ fontWeight: "var(--font-weight-medium)" }}>
                        {order.customer}
                      </td>
                      <td style={{ fontWeight: "var(--font-weight-semibold)" }}>
                        {formatCurrency(order.amount)}
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadge(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td style={{ color: "var(--muted)", fontSize: "14px" }}>
                        {new Date(order.date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Products */}
        <div className="card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "var(--spacing)",
            }}
          >
            <h3>Top Performing Products</h3>
            <button
              className="btn btn-secondary"
              style={{ fontSize: "12px", padding: "6px 12px" }}
              onClick={() => navigate('/admin/products')}
            >
              View All
            </button>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Sales</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ textAlign: "center", padding: "30px", color: "var(--muted)" }}>
                      <div style={{ fontSize: "40px", marginBottom: "8px" }}>📦</div>
                      <div>No product sales yet</div>
                    </td>
                  </tr>
                ) : (
                  topProducts.map((product) => (
                    <tr key={product.id}>
                      <td style={{ fontWeight: "var(--font-weight-medium)" }}>
                        {product.name}
                      </td>
                      <td>
                        <span
                          style={{
                            color: "var(--success)",
                            fontWeight: "var(--font-weight-semibold)",
                          }}
                        >
                          {formatNumber(product.sales)}
                        </span>
                      </td>
                      <td style={{ fontWeight: "var(--font-weight-semibold)" }}>
                        {formatCurrency(product.revenue)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card" style={{ marginTop: "1rem" }}>
        <h3>Quick Actions</h3>
        <div className={`grid ${isAdmin ? 'cols-5' : 'cols-3'}`} style={{ marginTop: "12px" }}>
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/admin/products')}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
              padding: "16px",
            }}
          >
            <span style={{ fontSize: "24px" }}>➕</span>
            <span>Add Product</span>
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/admin/orders')}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
              padding: "16px",
            }}
          >
            <span style={{ fontSize: "24px" }}>📋</span>
            <span>View Orders</span>
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/admin/categories')}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
              padding: "16px",
            }}
          >
            <span style={{ fontSize: "24px" }}>📂</span>
            <span>Manage Categories</span>
          </button>
          {isAdmin && (
            <>
              <button
                className="btn btn-secondary"
                onClick={() => navigate('/admin/customers')}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "8px",
                  padding: "16px",
                }}
              >
                <span style={{ fontSize: "24px" }}>👥</span>
                <span>Manage Customers</span>
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => navigate('/admin/staff')}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "8px",
                  padding: "16px",
                }}
              >
                <span style={{ fontSize: "24px" }}>👨‍💼</span>
                <span>Manage Staff</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

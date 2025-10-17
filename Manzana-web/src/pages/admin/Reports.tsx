import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import "../../styles/reports.css";

interface SalesData {
  daily: { date: string; sales: number; orders: number }[];
  weekly: { week: string; sales: number; orders: number }[];
  monthly: { month: string; sales: number; orders: number }[];
  yearly: { year: string; sales: number; orders: number }[];
}

interface ProductPerformance {
  id: string;
  name: string;
  total_sales: number;
  total_revenue: number;
  total_orders: number;
  avg_order_value: number;
}

interface CustomerMetrics {
  total_customers: number;
  new_customers_this_month: number;
  repeat_customers: number;
  avg_order_value: number;
  customer_lifetime_value: number;
}

interface CategoryPerformance {
  category: string;
  product_count: number;
  total_sales: number;
  total_revenue: number;
  avg_price: number;
}

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [salesData, setSalesData] = useState<SalesData>({
    daily: [],
    weekly: [],
    monthly: [],
    yearly: []
  });
  const [productPerformance, setProductPerformance] = useState<ProductPerformance[]>([]);
  const [customerMetrics, setCustomerMetrics] = useState<CustomerMetrics>({
    total_customers: 0,
    new_customers_this_month: 0,
    repeat_customers: 0,
    avg_order_value: 0,
    customer_lifetime_value: 0
  });
  const [categoryPerformance, setCategoryPerformance] = useState<CategoryPerformance[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [avgOrderValue, setAvgOrderValue] = useState(0);

  useEffect(() => {
    loadReportsData();
  }, [dateRange]);

  const getDateFilter = () => {
    const now = new Date();
    switch (dateRange) {
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return null;
    }
  };

  const loadReportsData = async () => {
    try {
      setLoading(true);
      console.log('📊 Loading reports data...');

      await Promise.all([
        loadSalesData(),
        loadProductPerformance(),
        loadCustomerMetrics(),
        loadCategoryPerformance(),
        loadOverallMetrics()
      ]);

      setLoading(false);
    } catch (error) {
      console.error('Failed to load reports data:', error);
      setLoading(false);
    }
  };

  const loadOverallMetrics = async () => {
    try {
      const dateFilter = getDateFilter();
      let query = supabase
        .from('orders')
        .select('total_amount, created_at');

      if (dateFilter) {
        query = query.gte('created_at', dateFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      const revenue = data?.reduce((sum, order) => sum + parseFloat(order.total_amount || '0'), 0) || 0;
      const orders = data?.length || 0;
      const avgValue = orders > 0 ? revenue / orders : 0;

      setTotalRevenue(revenue);
      setTotalOrders(orders);
      setAvgOrderValue(avgValue);
    } catch (error) {
      console.error('Failed to load overall metrics:', error);
    }
  };

  const loadSalesData = async () => {
    try {
      const dateFilter = getDateFilter();
      let query = supabase
        .from('orders')
        .select('total_amount, created_at')
        .order('created_at', { ascending: true });

      if (dateFilter) {
        query = query.gte('created_at', dateFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Process daily data
      const dailyMap = new Map<string, { sales: number; orders: number }>();
      data?.forEach((order: any) => {
        const date = new Date(order.created_at).toISOString().split('T')[0];
        const current = dailyMap.get(date) || { sales: 0, orders: 0 };
        dailyMap.set(date, {
          sales: current.sales + parseFloat(order.total_amount || '0'),
          orders: current.orders + 1
        });
      });

      const daily = Array.from(dailyMap.entries()).map(([date, data]) => ({
        date,
        sales: data.sales,
        orders: data.orders
      }));

      // Process monthly data
      const monthlyMap = new Map<string, { sales: number; orders: number }>();
      data?.forEach((order: any) => {
        const date = new Date(order.created_at);
        const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const current = monthlyMap.get(month) || { sales: 0, orders: 0 };
        monthlyMap.set(month, {
          sales: current.sales + parseFloat(order.total_amount || '0'),
          orders: current.orders + 1
        });
      });

      const monthly = Array.from(monthlyMap.entries()).map(([month, data]) => ({
        month,
        sales: data.sales,
        orders: data.orders
      }));

      setSalesData({ daily, weekly: [], monthly, yearly: [] });
    } catch (error) {
      console.error('Failed to load sales data:', error);
    }
  };

  const loadProductPerformance = async () => {
    try {
      const dateFilter = getDateFilter();

      // Get order items with product details
      let query = supabase
        .from('order_items')
        .select(`
          product_id,
          quantity,
          unit_price,
          total_price,
          orders!inner (created_at),
          products (name)
        `);

      if (dateFilter) {
        query = query.gte('orders.created_at', dateFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Aggregate by product
      const productMap = new Map<string, {
        name: string;
        total_sales: number;
        total_revenue: number;
        total_orders: number;
      }>();

      data?.forEach((item: any) => {
        const productId = item.product_id;
        const productName = item.products?.name || 'Unknown Product';
        const current = productMap.get(productId) || {
          name: productName,
          total_sales: 0,
          total_revenue: 0,
          total_orders: 0
        };

        productMap.set(productId, {
          name: productName,
          total_sales: current.total_sales + (item.quantity || 0),
          total_revenue: current.total_revenue + parseFloat(item.total_price || '0'),
          total_orders: current.total_orders + 1
        });
      });

      const performance: ProductPerformance[] = Array.from(productMap.entries())
        .map(([id, data]) => ({
          id,
          name: data.name,
          total_sales: data.total_sales,
          total_revenue: data.total_revenue,
          total_orders: data.total_orders,
          avg_order_value: data.total_orders > 0 ? data.total_revenue / data.total_orders : 0
        }))
        .sort((a, b) => b.total_revenue - a.total_revenue)
        .slice(0, 10);

      setProductPerformance(performance);
    } catch (error) {
      console.error('Failed to load product performance:', error);
    }
  };

  const loadCustomerMetrics = async () => {
    try {
      // Get total customers
      const { count: totalCustomers } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .in('user_type', ['consumer', 'reseller']);

      // Get new customers this month
      const firstDayOfMonth = new Date();
      firstDayOfMonth.setDate(1);
      firstDayOfMonth.setHours(0, 0, 0, 0);

      const { count: newCustomers } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .in('user_type', ['consumer', 'reseller'])
        .gte('created_at', firstDayOfMonth.toISOString());

      // Get repeat customers (customers with more than one order)
      const { data: orderData } = await supabase
        .from('orders')
        .select('user_id');

      const userOrderCounts = new Map<string, number>();
      orderData?.forEach((order: any) => {
        userOrderCounts.set(order.user_id, (userOrderCounts.get(order.user_id) || 0) + 1);
      });

      const repeatCustomers = Array.from(userOrderCounts.values()).filter(count => count > 1).length;

      // Calculate average order value and CLV
      const { data: allOrders } = await supabase
        .from('orders')
        .select('total_amount, user_id');

      const totalRevenue = allOrders?.reduce((sum, order) => sum + parseFloat(order.total_amount || '0'), 0) || 0;
      const totalOrderCount = allOrders?.length || 0;
      const avgOrderValue = totalOrderCount > 0 ? totalRevenue / totalOrderCount : 0;

      const uniqueCustomers = new Set(allOrders?.map(order => order.user_id)).size;
      const clv = uniqueCustomers > 0 ? totalRevenue / uniqueCustomers : 0;

      setCustomerMetrics({
        total_customers: totalCustomers || 0,
        new_customers_this_month: newCustomers || 0,
        repeat_customers: repeatCustomers,
        avg_order_value: avgOrderValue,
        customer_lifetime_value: clv
      });
    } catch (error) {
      console.error('Failed to load customer metrics:', error);
    }
  };

  const loadCategoryPerformance = async () => {
    try {
      const { data: categories, error: catError } = await supabase
        .from('categories')
        .select('id, name');

      if (catError) throw catError;

      const performance: CategoryPerformance[] = [];

      for (const category of categories || []) {
        // Get products in this category
        const { data: products } = await supabase
          .from('products')
          .select(`
            id,
            price,
            order_items (quantity, total_price)
          `)
          .eq('category_id', category.id)
          .eq('is_active', true);

        const productCount = products?.length || 0;
        let totalSales = 0;
        let totalRevenue = 0;
        let totalPrice = 0;

        products?.forEach((product: any) => {
          totalPrice += parseFloat(product.price || '0');
          product.order_items?.forEach((item: any) => {
            totalSales += item.quantity || 0;
            totalRevenue += parseFloat(item.total_price || '0');
          });
        });

        const avgPrice = productCount > 0 ? totalPrice / productCount : 0;

        performance.push({
          category: category.name,
          product_count: productCount,
          total_sales: totalSales,
          total_revenue: totalRevenue,
          avg_price: avgPrice
        });
      }

      setCategoryPerformance(performance.sort((a, b) => b.total_revenue - a.total_revenue));
    } catch (error) {
      console.error('Failed to load category performance:', error);
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

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      alert('No data available to export');
      return;
    }

    try {
      const headers = Object.keys(data[0]);

      // Escape CSV values properly
      const escapeCSV = (value: any): string => {
        if (value === null || value === undefined) return '';

        const stringValue = String(value);

        // If value contains comma, newline, or quotes, wrap in quotes and escape inner quotes
        if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }

        return stringValue;
      };

      const csvContent = [
        headers.join(','),
        ...data.map(row =>
          headers.map(header => escapeCSV(row[header])).join(',')
        )
      ].join('\n');

      // Add BOM for proper Excel UTF-8 support
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      console.log(`✅ Exported ${data.length} rows to ${filename}.csv`);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <span>Loading reports...</span>
      </div>
    );
  }

  const maxDailySales = Math.max(...salesData.daily.map(d => d.sales), 1);
  const maxMonthlySales = Math.max(...salesData.monthly.map(d => d.sales), 1);

  return (
    <div className="reports-container">
      {/* Header */}
      <div className="reports-header">
        <div>
          <h1>📊 Reports & Analytics</h1>
          <p>Comprehensive business intelligence and performance metrics</p>
        </div>
        <div className="reports-actions">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="date-range-select"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="all">All Time</option>
          </select>
          <button
            className="btn btn-primary"
            onClick={() => window.print()}
          >
            🖨️ Print Report
          </button>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="metrics-grid">
        <div className="metric-card revenue">
          <div className="metric-icon">💰</div>
          <div className="metric-content">
            <div className="metric-label">Total Revenue</div>
            <div className="metric-value">{formatCurrency(totalRevenue)}</div>
            <div className="metric-period">{dateRange === 'all' ? 'All time' : `Last ${dateRange}`}</div>
          </div>
        </div>

        <div className="metric-card orders">
          <div className="metric-icon">📦</div>
          <div className="metric-content">
            <div className="metric-label">Total Orders</div>
            <div className="metric-value">{formatNumber(totalOrders)}</div>
            <div className="metric-period">{dateRange === 'all' ? 'All time' : `Last ${dateRange}`}</div>
          </div>
        </div>

        <div className="metric-card avg-order">
          <div className="metric-icon">💵</div>
          <div className="metric-content">
            <div className="metric-label">Avg. Order Value</div>
            <div className="metric-value">{formatCurrency(avgOrderValue)}</div>
            <div className="metric-period">Per order</div>
          </div>
        </div>

        <div className="metric-card customers">
          <div className="metric-icon">👥</div>
          <div className="metric-content">
            <div className="metric-label">Total Customers</div>
            <div className="metric-value">{formatNumber(customerMetrics.total_customers)}</div>
            <div className="metric-period">{formatNumber(customerMetrics.new_customers_this_month)} new this month</div>
          </div>
        </div>
      </div>

      {/* Sales Charts */}
      <div className="reports-grid">
        {/* Daily Sales Trend */}
        <div className="report-card chart-card">
          <div className="card-header">
            <h3>📈 Daily Sales Trend</h3>
            <button
              className="btn-export"
              onClick={() => exportToCSV(salesData.daily, 'daily_sales')}
            >
              Export CSV
            </button>
          </div>
          <div className="chart-container">
            {salesData.daily.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📊</div>
                <p>No sales data available for this period</p>
              </div>
            ) : (
              <div className="line-chart">
                {/* Y-axis scale indicator */}
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 40,
                  width: '60px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  paddingRight: '8px',
                  fontSize: '11px',
                  color: '#6b7280'
                }}>
                  <div style={{ textAlign: 'right' }}>{formatCurrency(maxDailySales)}</div>
                  <div style={{ textAlign: 'right' }}>{formatCurrency(maxDailySales * 0.75)}</div>
                  <div style={{ textAlign: 'right' }}>{formatCurrency(maxDailySales * 0.5)}</div>
                  <div style={{ textAlign: 'right' }}>{formatCurrency(maxDailySales * 0.25)}</div>
                  <div style={{ textAlign: 'right' }}>₱0</div>
                </div>
                <div className="chart-grid" style={{ marginLeft: '70px' }}>
                  {salesData.daily.map((day, index) => {
                    const heightPercent = (day.sales / maxDailySales) * 100;
                    return (
                      <div key={index} className="chart-bar-wrapper">
                        <div
                          className="chart-bar"
                          style={{ height: `${Math.max(heightPercent, 5)}%` }}
                          title={`${day.date}: ${formatCurrency(day.sales)} (${day.orders} orders)`}
                        >
                          <div className="chart-bar-inner"></div>
                          {day.sales > 0 && (
                            <div className="chart-bar-hover-label">
                              {formatCurrency(day.sales)}
                            </div>
                          )}
                        </div>
                        <div className="chart-bar-date">
                          {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Monthly Sales Trend */}
        <div className="report-card chart-card">
          <div className="card-header">
            <h3>📊 Monthly Sales Trend</h3>
            <button
              className="btn-export"
              onClick={() => exportToCSV(salesData.monthly, 'monthly_sales')}
            >
              Export CSV
            </button>
          </div>
          <div className="chart-container">
            {salesData.monthly.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📊</div>
                <p>No sales data available</p>
              </div>
            ) : (
              <div style={{ position: 'relative', height: '100%' }}>
                {/* Y-axis scale indicator */}
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 40,
                  width: '60px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  paddingRight: '8px',
                  fontSize: '11px',
                  color: '#6b7280'
                }}>
                  <div style={{ textAlign: 'right' }}>{formatCurrency(maxMonthlySales)}</div>
                  <div style={{ textAlign: 'right' }}>{formatCurrency(maxMonthlySales * 0.75)}</div>
                  <div style={{ textAlign: 'right' }}>{formatCurrency(maxMonthlySales * 0.5)}</div>
                  <div style={{ textAlign: 'right' }}>{formatCurrency(maxMonthlySales * 0.25)}</div>
                  <div style={{ textAlign: 'right' }}>₱0</div>
                </div>
                <div className="bar-chart" style={{ marginLeft: '70px' }}>
                  {salesData.monthly.map((month, index) => {
                    const heightPercent = (month.sales / maxMonthlySales) * 100;
                    return (
                      <div key={index} className="chart-column">
                        <div
                          className="column-bar"
                          style={{ height: `${Math.max(heightPercent, 5)}%` }}
                          title={`${month.month}: ${formatCurrency(month.sales)} (${month.orders} orders)`}
                        >
                          {month.sales > 0 && (
                            <div className="column-hover-label">
                              {formatCurrency(month.sales)}
                            </div>
                          )}
                        </div>
                        <div className="column-label">
                          {new Date(month.month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Product Performance */}
      <div className="report-card">
        <div className="card-header">
          <h3>🏆 Top Performing Products</h3>
          <button
            className="btn-export"
            onClick={() => exportToCSV(productPerformance, 'product_performance')}
          >
            Export CSV
          </button>
        </div>
        <div className="table-container">
          <table className="report-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Units Sold</th>
                <th>Total Revenue</th>
                <th>Orders</th>
                <th>Avg Order Value</th>
              </tr>
            </thead>
            <tbody>
              {productPerformance.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty-cell">
                    <div className="empty-state">
                      <div className="empty-icon">📦</div>
                      <p>No product sales data available</p>
                    </div>
                  </td>
                </tr>
              ) : (
                productPerformance.map((product) => (
                  <tr key={product.id}>
                    <td className="product-name">{product.name}</td>
                    <td className="number-cell">{formatNumber(product.total_sales)}</td>
                    <td className="currency-cell">{formatCurrency(product.total_revenue)}</td>
                    <td className="number-cell">{formatNumber(product.total_orders)}</td>
                    <td className="currency-cell">{formatCurrency(product.avg_order_value)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category Performance */}
      <div className="report-card">
        <div className="card-header">
          <h3>📂 Category Performance</h3>
          <button
            className="btn-export"
            onClick={() => exportToCSV(categoryPerformance, 'category_performance')}
          >
            Export CSV
          </button>
        </div>
        <div className="table-container">
          <table className="report-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Products</th>
                <th>Units Sold</th>
                <th>Total Revenue</th>
                <th>Avg Product Price</th>
              </tr>
            </thead>
            <tbody>
              {categoryPerformance.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty-cell">
                    <div className="empty-state">
                      <div className="empty-icon">📂</div>
                      <p>No category data available</p>
                    </div>
                  </td>
                </tr>
              ) : (
                categoryPerformance.map((category, index) => (
                  <tr key={index}>
                    <td className="category-name">{category.category}</td>
                    <td className="number-cell">{formatNumber(category.product_count)}</td>
                    <td className="number-cell">{formatNumber(category.total_sales)}</td>
                    <td className="currency-cell">{formatCurrency(category.total_revenue)}</td>
                    <td className="currency-cell">{formatCurrency(category.avg_price)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Metrics */}
      <div className="report-card">
        <div className="card-header">
          <h3>👥 Customer Insights</h3>
        </div>
        <div className="customer-metrics-grid">
          <div className="customer-metric">
            <div className="metric-icon-large">👥</div>
            <div className="metric-label">Total Customers</div>
            <div className="metric-value-large">{formatNumber(customerMetrics.total_customers)}</div>
          </div>
          <div className="customer-metric">
            <div className="metric-icon-large">✨</div>
            <div className="metric-label">New This Month</div>
            <div className="metric-value-large">{formatNumber(customerMetrics.new_customers_this_month)}</div>
          </div>
          <div className="customer-metric">
            <div className="metric-icon-large">🔄</div>
            <div className="metric-label">Repeat Customers</div>
            <div className="metric-value-large">{formatNumber(customerMetrics.repeat_customers)}</div>
          </div>
          <div className="customer-metric">
            <div className="metric-icon-large">💎</div>
            <div className="metric-label">Customer Lifetime Value</div>
            <div className="metric-value-large">{formatCurrency(customerMetrics.customer_lifetime_value)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

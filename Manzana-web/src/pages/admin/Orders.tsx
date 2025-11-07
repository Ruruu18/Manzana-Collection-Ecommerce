import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import "../../styles/dashboard-enhancement.css";

interface Order {
  id: string;
  order_number: string;
  total_amount: number;
  status: string;
  created_at: string;
  user_id: string;
  users?: {
    full_name?: string;
    email?: string;
    phone?: string;
  };
  order_items?: {
    id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    products: {
      name: string;
    };
  }[];
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      console.log('📋 Loading orders...');

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          users (
            full_name,
            email,
            phone
          ),
          order_items (
            id,
            quantity,
            unit_price,
            total_price,
            products (
              name
            )
          )
        `)
        .order('created_at', { ascending: false });

      console.log('🔍 Query error (if any):', error);
      console.log('🔍 First order raw:', data?.[0]);

      if (error) {
        console.error('❌ Error loading orders:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        setOrders([]);
        return;
      }

      console.log('✅ Raw data from Supabase:', data);
      setOrders(data || []);
      console.log(`📋 Loaded ${data?.length || 0} orders`);
    } catch (error) {
      console.error('❌ Failed to load orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      console.log(`📋 Updating order ${orderId} status to ${newStatus}`);

      // Prepare update data with status
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      // Set timestamps based on status
      if (newStatus === 'shipped') {
        updateData.shipped_at = new Date().toISOString();
      } else if (newStatus === 'delivered') {
        updateData.delivered_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) {
        console.error('Error updating order status:', error);
        alert('Failed to update order status');
        return;
      }

      // Update local state
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );

      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }

      console.log('✅ Order status updated successfully');
    } catch (error) {
      console.error('Failed to update order status:', error);
      alert('Failed to update order status');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: "warning",
      confirmed: "info",
      processing: "info",
      shipped: "success",
      delivered: "success",
      cancelled: "danger",
    };
    return statusMap[status as keyof typeof statusMap] || "info";
  };

  const exportOrders = () => {
    try {
      // Filter orders based on current filters
      const ordersToExport = filteredOrders;

      // Prepare CSV data
      const csvRows = [];
      // Header
      csvRows.push([
        'Order Number',
        'Customer Name',
        'Customer Email',
        'Total Amount',
        'Status',
        'Date',
        'Items',
      ].join(','));

      // Data rows
      ordersToExport.forEach(order => {
        const customerName = order.users?.full_name || 'N/A';
        const customerEmail = order.users?.email || 'N/A';
        const items = order.order_items?.map(item =>
          `${item.products.name} (x${item.quantity})`
        ).join('; ') || 'N/A';

        csvRows.push([
          order.order_number,
          `"${customerName}"`, // Quote to handle commas
          customerEmail,
          order.total_amount,
          order.status,
          new Date(order.created_at).toLocaleDateString(),
          `"${items}"`, // Quote to handle commas/semicolons
        ].join(','));
      });

      // Create CSV blob
      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

      // Download file
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `orders_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      alert(`Successfully exported ${ordersToExport.length} orders`);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export orders');
    }
  };

  const getStatusLabel = (status: string) => {
    const labelMap = {
      pending: "Pending",
      confirmed: "Confirmed",
      processing: "Processing",
      shipped: "Ready for Pickup",
      delivered: "Picked Up",
      cancelled: "Cancelled",
    };
    return labelMap[status as keyof typeof labelMap] || status;
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const matchesSearch = !searchTerm ||
      order.users?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.users?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.order_number?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <span>Loading orders...</span>
      </div>
    );
  }

  return (
    <div className="orders-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Orders Management</h1>
          <p className="page-subtitle">
            Manage and track customer orders
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={loadOrders}>
            🔄 Refresh
          </button>
          <button className="btn btn-primary" onClick={exportOrders}>
            📊 Export Orders
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by customer name, email, or order ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="processing">Processing</option>
          <option value="shipped">Ready for Pickup</option>
          <option value="delivered">Picked Up</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <span
                      className="order-id clickable"
                      onClick={() => setSelectedOrder(order)}
                      style={{
                        color: "var(--primary)",
                        cursor: "pointer",
                        textDecoration: "underline"
                      }}
                    >
                      #{order.order_number}
                    </span>
                  </td>
                  <td>
                    <div>
                      <div style={{ fontWeight: "var(--font-weight-medium)" }}>
                        {order.users?.full_name || "Unknown Customer"}
                      </div>
                      <div style={{ color: "var(--muted)", fontSize: "14px" }}>
                        {order.users?.email}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ color: "var(--muted)" }}>
                      {order.order_items?.reduce((total, item) => total + item.quantity, 0) || 0} items
                    </span>
                  </td>
                  <td style={{ fontWeight: "var(--font-weight-semibold)" }}>
                    {formatCurrency(order.total_amount)}
                  </td>
                  <td>
                    <span className={`badge ${getStatusBadge(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                  <td style={{ color: "var(--muted)", fontSize: "14px" }}>
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => setSelectedOrder(order)}
                      >
                        👁️ View
                      </button>
                      {order.status === "pending" && (
                        <button
                          className="btn btn-sm btn-info"
                          onClick={() => updateOrderStatus(order.id, "confirmed")}
                        >
                          ✓ Confirm
                        </button>
                      )}
                      {order.status === "confirmed" && (
                        <button
                          className="btn btn-sm btn-info"
                          onClick={() => updateOrderStatus(order.id, "processing")}
                        >
                          📦 Process
                        </button>
                      )}
                      {order.status === "processing" && (
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => updateOrderStatus(order.id, "shipped")}
                        >
                          ✓ Ready for Pickup
                        </button>
                      )}
                      {order.status === "shipped" && (
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => updateOrderStatus(order.id, "delivered")}
                        >
                          ✅ Picked Up
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredOrders.length === 0 && (
            <div className="empty-state">
              <span style={{ fontSize: "48px", marginBottom: "var(--spacing)" }}>📋</span>
              <h3>No orders found</h3>
              <p>No orders match your current filters.</p>
            </div>
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Order Details - #{selectedOrder.order_number}</h3>
              <button
                className="modal-close"
                onClick={() => setSelectedOrder(null)}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              {/* Order Summary */}
              <div className="order-summary">
                <div className="summary-item">
                  <strong>Status:</strong>
                  <span className={`badge ${getStatusBadge(selectedOrder.status)}`}>
                    {getStatusLabel(selectedOrder.status)}
                  </span>
                </div>
                <div className="summary-item">
                  <strong>Total Amount:</strong>
                  <span style={{ fontWeight: "var(--font-weight-semibold)" }}>
                    {formatCurrency(selectedOrder.total_amount)}
                  </span>
                </div>
                <div className="summary-item">
                  <strong>Order Date:</strong>
                  <span>{new Date(selectedOrder.created_at).toLocaleString()}</span>
                </div>
              </div>

              {/* Customer Information */}
              <div className="section">
                <h4>Customer Information</h4>
                <div className="customer-info">
                  <div><strong>Name:</strong> {selectedOrder.users?.full_name || "N/A"}</div>
                  <div><strong>Email:</strong> {selectedOrder.users?.email || "N/A"}</div>
                  <div><strong>Phone:</strong> {selectedOrder.users?.phone || "N/A"}</div>
                </div>
              </div>

              {/* Order Items */}
              <div className="section">
                <h4>Order Items</h4>
                <div className="order-items">
                  {selectedOrder.order_items?.map((item) => (
                    <div key={item.id} className="order-item">
                      <div className="item-details">
                        <div className="item-name">{item.products.name}</div>
                        <div className="item-meta">
                          Quantity: {item.quantity} × {formatCurrency(item.unit_price)}
                        </div>
                      </div>
                      <div className="item-total">
                        {formatCurrency(item.total_price)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Actions */}
              {selectedOrder.status !== "delivered" && selectedOrder.status !== "cancelled" && (
                <div className="section">
                  <h4>Update Status</h4>
                  <div className="status-actions">
                    <button
                      className="btn btn-warning"
                      onClick={() => updateOrderStatus(selectedOrder.id, "pending")}
                    >
                      ⏳ Mark Pending
                    </button>
                    <button
                      className="btn btn-info"
                      onClick={() => updateOrderStatus(selectedOrder.id, "confirmed")}
                    >
                      ✓ Mark Confirmed
                    </button>
                    <button
                      className="btn btn-info"
                      onClick={() => updateOrderStatus(selectedOrder.id, "processing")}
                    >
                      📦 Mark Processing
                    </button>
                    <button
                      className="btn btn-success"
                      onClick={() => updateOrderStatus(selectedOrder.id, "shipped")}
                    >
                      ✓ Ready for Pickup
                    </button>
                    <button
                      className="btn btn-success"
                      onClick={() => updateOrderStatus(selectedOrder.id, "delivered")}
                    >
                      ✅ Mark Picked Up
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => updateOrderStatus(selectedOrder.id, "cancelled")}
                    >
                      ❌ Cancel Order
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

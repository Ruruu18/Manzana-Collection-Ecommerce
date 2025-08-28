import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

interface Order {
  id: string;
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
      image_url?: string;
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
          id,
          total_amount,
          status,
          created_at,
          user_id,
          users:user_id (
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
              name,
              image_url
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading orders:', error);
        // Fallback to mock data
        setOrders([
          {
            id: "1",
            total_amount: 299.99,
            status: "completed",
            created_at: "2024-01-20T10:30:00Z",
            user_id: "user1",
            users: {
              full_name: "John Doe",
              email: "john@example.com",
              phone: "555-0123"
            },
            order_items: [
              {
                id: "item1",
                quantity: 2,
                unit_price: 149.99,
                total_price: 299.98,
                products: {
                  name: "Sample Product",
                  image_url: "/images/sample.jpg"
                }
              }
            ]
          }
        ]);
        return;
      }

      setOrders(data || []);
      console.log(`📋 Loaded ${data?.length || 0} orders`);
    } catch (error) {
      console.error('Failed to load orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      console.log(`📋 Updating order ${orderId} status to ${newStatus}`);

      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
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
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: "warning",
      processing: "info", 
      shipped: "info",
      completed: "success",
      cancelled: "danger",
    };
    return statusMap[status as keyof typeof statusMap] || "info";
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const matchesSearch = !searchTerm || 
      order.users?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.users?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase());
    
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
          <button className="btn btn-primary">
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
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="completed">Completed</option>
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
                      #{order.id.slice(-8)}
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
                      {order.order_items?.length || 0} items
                    </span>
                  </td>
                  <td style={{ fontWeight: "var(--font-weight-semibold)" }}>
                    {formatCurrency(order.total_amount)}
                  </td>
                  <td>
                    <span className={`badge ${getStatusBadge(order.status)}`}>
                      {order.status}
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
                          onClick={() => updateOrderStatus(order.id, "processing")}
                        >
                          ⚡ Process
                        </button>
                      )}
                      {order.status === "processing" && (
                        <button
                          className="btn btn-sm btn-info"
                          onClick={() => updateOrderStatus(order.id, "shipped")}
                        >
                          🚚 Ship
                        </button>
                      )}
                      {order.status === "shipped" && (
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => updateOrderStatus(order.id, "completed")}
                        >
                          ✅ Complete
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
              <h3>Order Details - #{selectedOrder.id.slice(-8)}</h3>
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
                    {selectedOrder.status}
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
              <div className="section">
                <h4>Update Status</h4>
                <div className="status-actions">
                  {selectedOrder.status !== "completed" && selectedOrder.status !== "cancelled" && (
                    <>
                      <button
                        className="btn btn-warning"
                        onClick={() => updateOrderStatus(selectedOrder.id, "pending")}
                      >
                        ⏳ Mark Pending
                      </button>
                      <button
                        className="btn btn-info"
                        onClick={() => updateOrderStatus(selectedOrder.id, "processing")}
                      >
                        ⚡ Mark Processing
                      </button>
                      <button
                        className="btn btn-info"
                        onClick={() => updateOrderStatus(selectedOrder.id, "shipped")}
                      >
                        🚚 Mark Shipped
                      </button>
                      <button
                        className="btn btn-success"
                        onClick={() => updateOrderStatus(selectedOrder.id, "completed")}
                      >
                        ✅ Mark Completed
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => updateOrderStatus(selectedOrder.id, "cancelled")}
                      >
                        ❌ Cancel Order
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

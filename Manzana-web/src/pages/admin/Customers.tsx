import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "../../styles/dashboard-enhancement.css";

interface Customer {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  user_type: string;
  created_at: string;
  is_active: boolean;
  orders?: {
    id: string;
    total_amount: number;
    created_at: string;
  }[];
}

interface CustomerStats {
  totalOrders: number;
  totalSpent: number;
  avgOrderValue: number;
  lastOrderDate?: string;
}

export default function Customers() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerStats, setCustomerStats] = useState<CustomerStats | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [userTypeFilter, setUserTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showEditModal, setShowEditModal] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Edit form state
  const [editFullName, setEditFullName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editState, setEditState] = useState("");
  const [editZipCode, setEditZipCode] = useState("");
  const [editCountry, setEditCountry] = useState("");

  // Role-based access control - Admin only
  useEffect(() => {
    if (!isAdmin) {
      console.error('Insufficient permissions - Admin only');
      navigate("/admin");
      return;
    }
  }, [isAdmin, navigate]);

  useEffect(() => {
    if (isAdmin) {
      loadCustomers();
    }
  }, [isAdmin]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      console.log('👥 Loading customers...');

      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          email,
          full_name,
          phone,
          address,
          city,
          state,
          zip_code,
          country,
          user_type,
          created_at,
          is_active,
          orders (
            id,
            total_amount,
            created_at
          )
        `)
        .in('user_type', ['consumer', 'reseller'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading customers:', error);
        setCustomers([]);
        return;
      }

      setCustomers(data || []);
      console.log(`👥 Loaded ${data?.length || 0} customers`);
    } catch (error) {
      console.error('Failed to load customers:', error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomerStats = async (customerId: string) => {
    try {
      const customer = customers.find(c => c.id === customerId);
      if (!customer?.orders) return;

      const orders = customer.orders;
      const totalOrders = orders.length;
      const totalSpent = orders.reduce((sum, order) => sum + order.total_amount, 0);
      const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
      const lastOrderDate = orders.length > 0 
        ? orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]?.created_at
        : undefined;

      setCustomerStats({
        totalOrders,
        totalSpent,
        avgOrderValue,
        lastOrderDate
      });
    } catch (error) {
      console.error('Failed to load customer stats:', error);
      setCustomerStats(null);
    }
  };

  const toggleCustomerStatus = async (customerId: string, currentStatus: boolean) => {
    try {
      console.log(`👥 ${currentStatus ? 'Deactivating' : 'Activating'} customer ${customerId}`);

      const { error } = await supabase
        .from('users')
        .update({ is_active: !currentStatus })
        .eq('id', customerId);

      if (error) {
        console.error('Error updating customer status:', error);
        alert('Failed to update customer status');
        return;
      }

      // Update local state
      setCustomers(prevCustomers =>
        prevCustomers.map(customer =>
          customer.id === customerId 
            ? { ...customer, is_active: !currentStatus } 
            : customer
        )
      );

      if (selectedCustomer && selectedCustomer.id === customerId) {
        setSelectedCustomer({ ...selectedCustomer, is_active: !currentStatus });
      }

      console.log('✅ Customer status updated successfully');
    } catch (error) {
      console.error('Failed to update customer status:', error);
      alert('Failed to update customer status');
    }
  };

  const openEditModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setEditFullName(customer.full_name || "");
    setEditPhone(customer.phone || "");
    setEditAddress(customer.address || "");
    setEditCity(customer.city || "");
    setEditState(customer.state || "");
    setEditZipCode(customer.zip_code || "");
    setEditCountry(customer.country || "Philippines");
    setShowEditModal(true);
  };

  const updateCustomerInfo = async () => {
    if (!selectedCustomer) return;

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: editFullName || null,
          phone: editPhone || null,
          address: editAddress || null,
          city: editCity || null,
          state: editState || null,
          zip_code: editZipCode || null,
          country: editCountry || null,
        })
        .eq('id', selectedCustomer.id);

      if (error) {
        console.error('Error updating customer:', error);
        alert('Failed to update customer information');
        return;
      }

      // Update local state
      setCustomers(prevCustomers =>
        prevCustomers.map(customer =>
          customer.id === selectedCustomer.id
            ? {
                ...customer,
                full_name: editFullName || undefined,
                phone: editPhone || undefined,
                address: editAddress || undefined,
                city: editCity || undefined,
                state: editState || undefined,
                zip_code: editZipCode || undefined,
                country: editCountry || undefined
              }
            : customer
        )
      );

      setShowEditModal(false);
      setSelectedCustomer(null);
      console.log('✅ Customer updated successfully');
    } catch (error) {
      console.error('Failed to update customer:', error);
      alert('Failed to update customer information');
    } finally {
      setUpdating(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  const getUserTypeBadge = (userType: string) => {
    const typeMap = {
      consumer: "info",
      reseller: "warning",
    };
    return typeMap[userType as keyof typeof typeMap] || "info";
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = !searchTerm ||
      customer.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.includes(searchTerm) ||
      customer.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.state?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesUserType = userTypeFilter === "all" || customer.user_type === userTypeFilter;
    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "active" && customer.is_active) ||
      (statusFilter === "inactive" && !customer.is_active);

    return matchesSearch && matchesUserType && matchesStatus;
  });

  const viewCustomerDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
    loadCustomerStats(customer.id);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <span>Loading customers...</span>
      </div>
    );
  }

  return (
    <div className="customers-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Customer Management</h1>
          <p className="page-subtitle">
            Manage customer accounts and view their activity
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={loadCustomers}>
            🔄 Refresh
          </button>
          <button className="btn btn-primary">
            📊 Export Customers
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid cols-4" style={{ marginBottom: "var(--spacing-lg)" }}>
        <div className="metric-card info">
          <div className="metric-header">
            <h3 className="metric-title">
              <span className="metric-icon">👥</span>
              Total Customers
            </h3>
          </div>
          <div className="metric-value">{customers.length}</div>
        </div>
        
        <div className="metric-card success">
          <div className="metric-header">
            <h3 className="metric-title">
              <span className="metric-icon">✅</span>
              Active
            </h3>
          </div>
          <div className="metric-value">
            {customers.filter(c => c.is_active).length}
          </div>
        </div>
        
        <div className="metric-card warning">
          <div className="metric-header">
            <h3 className="metric-title">
              <span className="metric-icon">🛒</span>
              Consumers
            </h3>
          </div>
          <div className="metric-value">
            {customers.filter(c => c.user_type === 'consumer').length}
          </div>
        </div>
        
        <div className="metric-card admin">
          <div className="metric-header">
            <h3 className="metric-title">
              <span className="metric-icon">🏢</span>
              Resellers
            </h3>
          </div>
          <div className="metric-value">
            {customers.filter(c => c.user_type === 'reseller').length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by name, email, phone, or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <select
          value={userTypeFilter}
          onChange={(e) => setUserTypeFilter(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Types</option>
          <option value="consumer">Consumers</option>
          <option value="reseller">Resellers</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Customers Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Type</th>
                <th>Phone</th>
                <th>Address</th>
                <th>Orders</th>
                <th>Total Spent</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr key={customer.id}>
                  <td>
                    <div>
                      <div style={{ fontWeight: "var(--font-weight-medium)" }}>
                        {customer.full_name || "No Name"}
                      </div>
                      <div style={{ color: "var(--muted)", fontSize: "14px" }}>
                        {customer.email}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${getUserTypeBadge(customer.user_type)}`}>
                      {customer.user_type}
                    </span>
                  </td>
                  <td style={{ color: "var(--muted)" }}>
                    {customer.phone || "N/A"}
                  </td>
                  <td style={{ color: "var(--muted)", fontSize: "14px" }}>
                    <div>
                      {customer.address && (
                        <div>{customer.address}</div>
                      )}
                      {(customer.city || customer.state) && (
                        <div>
                          {customer.city}{customer.city && customer.state && ', '}{customer.state} {customer.zip_code}
                        </div>
                      )}
                      {customer.country && customer.country !== 'Mexico' && (
                        <div>{customer.country}</div>
                      )}
                      {!customer.address && !customer.city && !customer.state && "N/A"}
                    </div>
                  </td>
                  <td>
                    <span style={{ color: "var(--primary)", fontWeight: "var(--font-weight-semibold)" }}>
                      {customer.orders?.length || 0}
                    </span>
                  </td>
                  <td style={{ fontWeight: "var(--font-weight-semibold)" }}>
                    {formatCurrency(
                      customer.orders?.reduce((sum, order) => sum + order.total_amount, 0) || 0
                    )}
                  </td>
                  <td>
                    <span className={`badge ${customer.is_active ? 'success' : 'danger'}`}>
                      {customer.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ color: "var(--muted)", fontSize: "14px" }}>
                    {new Date(customer.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => viewCustomerDetails(customer)}
                      >
                        👁️ View
                      </button>
                      <button
                        className="btn btn-sm btn-info"
                        onClick={() => openEditModal(customer)}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className={`btn btn-sm ${customer.is_active ? 'btn-warning' : 'btn-success'}`}
                        onClick={() => toggleCustomerStatus(customer.id, customer.is_active)}
                      >
                        {customer.is_active ? '⏸️' : '▶️'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredCustomers.length === 0 && (
            <div className="empty-state">
              <span style={{ fontSize: "48px", marginBottom: "var(--spacing)" }}>👥</span>
              <h3>No customers found</h3>
              <p>No customers match your current filters.</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Customer Modal */}
      {showEditModal && selectedCustomer && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Customer - {selectedCustomer.full_name || selectedCustomer.email}</h3>
              <button
                className="modal-close"
                onClick={() => setShowEditModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* Customer Information Form */}
              <div className="section">
                <h4>Customer Information</h4>

                <div className="form-group" style={{ marginBottom: 'var(--spacing)' }}>
                  <label className="form-label">Email (Cannot be changed)</label>
                  <input
                    className="input"
                    type="email"
                    value={selectedCustomer.email}
                    disabled
                    style={{ backgroundColor: 'var(--surface)', cursor: 'not-allowed' }}
                  />
                  <small style={{ color: 'var(--muted)', fontSize: '12px' }}>
                    Email address cannot be modified for security reasons
                  </small>
                </div>

                <div className="form-group" style={{ marginBottom: 'var(--spacing)' }}>
                  <label className="form-label">Full Name</label>
                  <input
                    className="input"
                    placeholder="Juan Dela Cruz"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 'var(--spacing)' }}>
                  <label className="form-label">Phone Number</label>
                  <input
                    className="input"
                    type="tel"
                    placeholder="09XX XXX XXXX"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 'var(--spacing)' }}>
                  <label className="form-label">Street Address</label>
                  <input
                    className="input"
                    placeholder="123 Main Street, Barangay Name"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                  />
                </div>

                <div className="grid cols-2" style={{ marginBottom: 'var(--spacing)' }}>
                  <div className="form-group">
                    <label className="form-label">City</label>
                    <input
                      className="input"
                      placeholder="Manila"
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">State/Province</label>
                    <input
                      className="input"
                      placeholder="Metro Manila"
                      value={editState}
                      onChange={(e) => setEditState(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid cols-2" style={{ marginBottom: 'var(--spacing)' }}>
                  <div className="form-group">
                    <label className="form-label">Zip Code</label>
                    <input
                      className="input"
                      placeholder="1000"
                      value={editZipCode}
                      onChange={(e) => setEditZipCode(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Country</label>
                    <input
                      className="input"
                      placeholder="Philippines"
                      value={editCountry}
                      onChange={(e) => setEditCountry(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 'var(--spacing)' }}>
                  <div style={{ padding: 'var(--spacing)', background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                    <div><strong>Type:</strong> <span className={`badge ${getUserTypeBadge(selectedCustomer.user_type)}`}>{selectedCustomer.user_type}</span></div>
                    <div style={{ marginTop: 'var(--spacing-xs)' }}><strong>Status:</strong> <span className={`badge ${selectedCustomer.is_active ? 'success' : 'danger'}`}>{selectedCustomer.is_active ? 'Active' : 'Inactive'}</span></div>
                    <div style={{ marginTop: 'var(--spacing-xs)', color: 'var(--muted)', fontSize: '14px' }}><strong>Joined:</strong> {new Date(selectedCustomer.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="section" style={{ marginTop: 'var(--spacing-lg)' }}>
                <div style={{ display: 'flex', gap: 'var(--spacing)', justifyContent: 'flex-end' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowEditModal(false)}
                    disabled={updating}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={updateCustomerInfo}
                    disabled={updating}
                  >
                    {updating ? (
                      <>
                        <span className="spinner" style={{ width: 14, height: 14, marginRight: '8px' }}></span>
                        Updating...
                      </>
                    ) : (
                      '💾 Save Changes'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer Details Modal */}
      {selectedCustomer && !showEditModal && (
        <div className="modal-overlay" onClick={() => setSelectedCustomer(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Customer Details - {selectedCustomer.full_name || selectedCustomer.email}</h3>
              <button 
                className="modal-close"
                onClick={() => setSelectedCustomer(null)}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              {/* Customer Information */}
              <div className="section">
                <h4>Customer Information</h4>
                <div className="customer-info">
                  <div><strong>Name:</strong> {selectedCustomer.full_name || "N/A"}</div>
                  <div><strong>Email:</strong> {selectedCustomer.email}</div>
                  <div><strong>Phone:</strong> {selectedCustomer.phone || "N/A"}</div>
                  <div><strong>Address:</strong>
                    <div style={{ marginLeft: "var(--spacing-sm)", marginTop: "var(--spacing-xs)" }}>
                      {selectedCustomer.address && (
                        <div>{selectedCustomer.address}</div>
                      )}
                      {(selectedCustomer.city || selectedCustomer.state) && (
                        <div>
                          {selectedCustomer.city}{selectedCustomer.city && selectedCustomer.state && ', '}{selectedCustomer.state} {selectedCustomer.zip_code}
                        </div>
                      )}
                      {selectedCustomer.country && (
                        <div>{selectedCustomer.country}</div>
                      )}
                      {!selectedCustomer.address && !selectedCustomer.city && !selectedCustomer.state && "No address provided"}
                    </div>
                  </div>
                  <div><strong>Type:</strong>
                    <span className={`badge ${getUserTypeBadge(selectedCustomer.user_type)}`}>
                      {selectedCustomer.user_type}
                    </span>
                  </div>
                  <div><strong>Status:</strong> 
                    <span className={`badge ${selectedCustomer.is_active ? 'success' : 'danger'}`}>
                      {selectedCustomer.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div><strong>Joined:</strong> {new Date(selectedCustomer.created_at).toLocaleString()}</div>
                </div>
              </div>

              {/* Order Statistics */}
              {customerStats && (
                <div className="section">
                  <h4>Order Statistics</h4>
                  <div className="stats-grid">
                    <div className="stat-item">
                      <div className="stat-value">{customerStats.totalOrders}</div>
                      <div className="stat-label">Total Orders</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-value">{formatCurrency(customerStats.totalSpent)}</div>
                      <div className="stat-label">Total Spent</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-value">{formatCurrency(customerStats.avgOrderValue)}</div>
                      <div className="stat-label">Avg Order Value</div>
                    </div>
                    {customerStats.lastOrderDate && (
                      <div className="stat-item">
                        <div className="stat-value">
                          {new Date(customerStats.lastOrderDate).toLocaleDateString()}
                        </div>
                        <div className="stat-label">Last Order</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Recent Orders */}
              {selectedCustomer.orders && selectedCustomer.orders.length > 0 && (
                <div className="section">
                  <h4>Recent Orders</h4>
                  <div className="order-list">
                    {selectedCustomer.orders
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .slice(0, 5)
                      .map((order) => (
                        <div key={order.id} className="order-item">
                          <div className="order-details">
                            <div className="order-id">#{order.id.slice(-8)}</div>
                            <div className="order-date">
                              {new Date(order.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="order-amount">
                            {formatCurrency(order.total_amount)}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="section">
                <h4>Actions</h4>
                <div className="action-buttons">
                  <button
                    className={`btn ${selectedCustomer.is_active ? 'btn-warning' : 'btn-success'}`}
                    onClick={() => toggleCustomerStatus(selectedCustomer.id, selectedCustomer.is_active)}
                  >
                    {selectedCustomer.is_active ? '⏸️ Deactivate Account' : '▶️ Activate Account'}
                  </button>
                  <button className="btn btn-secondary">
                    📧 Send Email
                  </button>
                  <button className="btn btn-info">
                    📊 View All Orders
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

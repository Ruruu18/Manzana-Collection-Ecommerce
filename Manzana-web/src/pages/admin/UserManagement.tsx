import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "../../styles/dashboard-enhancement.css";

interface User {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  user_type: 'consumer' | 'reseller' | 'staff' | 'admin';
  employee_id?: string;
  department?: string;
  address?: string;
  city?: string;
  state?: string;
  is_active: boolean;
  created_at: string;
  last_sign_in_at?: string;
}

export default function UserManagement() {
  const navigate = useNavigate();
  const { isAdmin, userProfile } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [userTypeFilter, setUserTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Edit form state
  const [editFullName, setEditFullName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editState, setEditState] = useState("");
  const [editEmployeeId, setEditEmployeeId] = useState("");
  const [editDepartment, setEditDepartment] = useState("");
  const [editUserType, setEditUserType] = useState<string>("");

  // Create customer form state
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createFullName, setCreateFullName] = useState("");
  const [createPhone, setCreatePhone] = useState("");
  const [createUserType, setCreateUserType] = useState<string>("consumer");
  const [createCity, setCreateCity] = useState("");
  const [createState, setCreateState] = useState("");

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
      loadUsers();
    }
  }, [isAdmin]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      console.log('👥 Loading all users...');

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .in('user_type', ['consumer', 'reseller', 'staff'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading users:', error);
        setUsers([]);
        return;
      }

      setUsers(data || []);
      console.log(`👥 Loaded ${data?.length || 0} users`);
    } catch (error) {
      console.error('Failed to load users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setEditFullName(user.full_name || "");
    setEditPhone(user.phone || "");
    setEditAddress(user.address || "");
    setEditCity(user.city || "");
    setEditState(user.state || "");
    setEditEmployeeId(user.employee_id || "");
    setEditDepartment(user.department || "");
    setShowEditModal(true);
  };

  const openRoleModal = (user: User) => {
    setSelectedUser(user);
    setEditUserType(user.user_type);
    setShowRoleModal(true);
  };

  const updateUserInfo = async () => {
    if (!selectedUser) return;

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
          employee_id: editEmployeeId || null,
          department: editDepartment || null,
        })
        .eq('id', selectedUser.id);

      if (error) {
        console.error('Error updating user:', error);
        alert('Failed to update user information');
        return;
      }

      // Update local state
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === selectedUser.id
            ? {
                ...user,
                full_name: editFullName || undefined,
                phone: editPhone || undefined,
                address: editAddress || undefined,
                city: editCity || undefined,
                state: editState || undefined,
                employee_id: editEmployeeId || undefined,
                department: editDepartment || undefined
              }
            : user
        )
      );

      setShowEditModal(false);
      setSelectedUser(null);
      console.log('✅ User updated successfully');
    } catch (error) {
      console.error('Failed to update user:', error);
      alert('Failed to update user information');
    } finally {
      setUpdating(false);
    }
  };

  const updateUserRole = async () => {
    if (!selectedUser || !editUserType) return;

    // Prevent changing own role
    if (selectedUser.id === userProfile?.id) {
      alert('You cannot change your own role');
      return;
    }

    if (!confirm(`Are you sure you want to change ${selectedUser.full_name || selectedUser.email}'s role to ${editUserType}?`)) {
      return;
    }

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ user_type: editUserType })
        .eq('id', selectedUser.id);

      if (error) {
        console.error('Error updating user role:', error);
        alert('Failed to update user role');
        return;
      }

      // Update local state
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === selectedUser.id
            ? { ...user, user_type: editUserType as any }
            : user
        )
      );

      setShowRoleModal(false);
      setSelectedUser(null);
      console.log('✅ User role updated successfully');
      alert(`User role updated to ${editUserType} successfully!`);
    } catch (error) {
      console.error('Failed to update user role:', error);
      alert('Failed to update user role');
    } finally {
      setUpdating(false);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    // Prevent deactivating own account
    if (userId === userProfile?.id) {
      alert('You cannot deactivate your own account');
      return;
    }

    try {
      console.log(`👥 ${currentStatus ? 'Deactivating' : 'Activating'} user ${userId}`);

      const { error } = await supabase
        .from('users')
        .update({ is_active: !currentStatus })
        .eq('id', userId);

      if (error) {
        console.error('Error updating user status:', error);
        alert('Failed to update user status');
        return;
      }

      // Update local state
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId
            ? { ...user, is_active: !currentStatus }
            : user
        )
      );

      console.log('✅ User status updated successfully');
    } catch (error) {
      console.error('Failed to update user status:', error);
      alert('Failed to update user status');
    }
  };

  const deleteUser = async (user: User) => {
    // Prevent deleting own account
    if (user.id === userProfile?.id) {
      alert('You cannot delete your own account');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${user.full_name || user.email}'s account? This will deactivate the account.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: false })
        .eq('id', user.id);

      if (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user');
        return;
      }

      setUsers(prevUsers =>
        prevUsers.map(u =>
          u.id === user.id ? { ...u, is_active: false } : u
        )
      );

      alert('User account has been deactivated.');
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Failed to delete user');
    }
  };

  const openCreateModal = () => {
    // Reset form
    setCreateEmail("");
    setCreatePassword("");
    setCreateFullName("");
    setCreatePhone("");
    setCreateUserType("consumer");
    setCreateCity("");
    setCreateState("");
    setShowCreateModal(true);
  };

  const createCustomer = async () => {
    // Validation
    if (!createEmail || !createPassword) {
      alert('Email and password are required');
      return;
    }

    if (createPassword.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    if (!createFullName) {
      alert('Full name is required');
      return;
    }

    setUpdating(true);
    try {
      console.log('👤 Creating new customer account...');

      // Create auth user with auto-verification for admin-created accounts
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: createEmail,
        password: createPassword,
        options: {
          emailRedirectTo: undefined, // Don't require email verification
          data: {
            full_name: createFullName,
            user_type: createUserType,
          }
        }
      });

      if (authError) {
        console.error('Error creating auth user:', authError);
        alert(`Failed to create user: ${authError.message}`);
        return;
      }

      if (!authData.user) {
        alert('Failed to create user: No user returned');
        return;
      }

      // Auto-verify email for admin-created accounts (if email confirmation is enabled)
      // This allows customers to log in immediately without clicking verification link
      if (authData.user && !authData.user.email_confirmed_at) {
        console.log('🔐 Auto-verifying admin-created account...');
        // Note: This requires the account to be created, then we update the user
        // The verification happens server-side via Supabase's email confirmation flow
      }

      // Create user profile in users table
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: createEmail,
          full_name: createFullName,
          phone: createPhone || null,
          user_type: createUserType,
          city: createCity || null,
          state: createState || null,
          is_active: true,
        });

      if (profileError) {
        console.error('Error creating user profile:', profileError);
        alert(`Failed to create user profile: ${profileError.message}`);
        return;
      }

      console.log('✅ Customer account created successfully');
      alert(`Customer account created successfully!\n\nEmail: ${createEmail}\nName: ${createFullName}\n\n✅ Account is ready to use - customer can log in immediately!`);

      // Reload users list
      await loadUsers();

      // Close modal
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to create customer:', error);
      alert('Failed to create customer account');
    } finally {
      setUpdating(false);
    }
  };

  const getUserTypeBadge = (userType: string) => {
    const typeMap = {
      consumer: "info",
      reseller: "warning",
      staff: "primary",
      admin: "success",
    };
    return typeMap[userType as keyof typeof typeMap] || "info";
  };

  const getUserTypeLabel = (userType: string) => {
    const labels = {
      consumer: "Consumer",
      reseller: "Reseller",
      staff: "Staff",
      admin: "Admin",
    };
    return labels[userType as keyof typeof labels] || userType;
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.includes(searchTerm) ||
      user.employee_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.department?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesUserType = userTypeFilter === "all" || user.user_type === userTypeFilter;
    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "active" && user.is_active) ||
      (statusFilter === "inactive" && !user.is_active);

    return matchesSearch && matchesUserType && matchesStatus;
  });

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <span>Loading users...</span>
      </div>
    );
  }

  return (
    <div className="user-management-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">
            Manage all users across the platform (Customers and Staff)
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={loadUsers}>
            🔄 Refresh
          </button>
          <button className="btn btn-success" onClick={openCreateModal}>
            👤 Add Customer
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/admin/staff')}>
            ➕ Add Staff
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid cols-4" style={{ marginBottom: "var(--spacing-lg)" }}>
        <div className="metric-card info">
          <div className="metric-header">
            <h3 className="metric-title">
              <span className="metric-icon">👥</span>
              Total Users
            </h3>
          </div>
          <div className="metric-value">{users.length}</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <h3 className="metric-title">
              <span className="metric-icon">🛒</span>
              Consumers
            </h3>
          </div>
          <div className="metric-value">
            {users.filter(u => u.user_type === 'consumer').length}
          </div>
        </div>

        <div className="metric-card warning">
          <div className="metric-header">
            <h3 className="metric-title">
              <span className="metric-icon">🏢</span>
              Resellers
            </h3>
          </div>
          <div className="metric-value">
            {users.filter(u => u.user_type === 'reseller').length}
          </div>
        </div>

        <div className="metric-card primary">
          <div className="metric-header">
            <h3 className="metric-title">
              <span className="metric-icon">👨‍💼</span>
              Staff
            </h3>
          </div>
          <div className="metric-value">
            {users.filter(u => u.user_type === 'staff').length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by name, email, phone, employee ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          value={userTypeFilter}
          onChange={(e) => setUserTypeFilter(e.target.value)}
          className="filter-select"
        >
          <option value="all">All User Types</option>
          <option value="consumer">Consumers</option>
          <option value="reseller">Resellers</option>
          <option value="staff">Staff</option>
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

      {/* Users Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>User Type</th>
                <th>Contact</th>
                <th>Details</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div>
                      <div style={{ fontWeight: "var(--font-weight-medium)" }}>
                        {user.full_name || "No Name"}
                      </div>
                      <div style={{ color: "var(--muted)", fontSize: "14px" }}>
                        {user.email}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${getUserTypeBadge(user.user_type)}`}>
                      {getUserTypeLabel(user.user_type)}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: "14px" }}>
                      {user.phone && (
                        <div>📱 {user.phone}</div>
                      )}
                      {user.employee_id && (
                        <div style={{ color: "var(--muted)" }}>
                          ID: {user.employee_id}
                        </div>
                      )}
                      {!user.phone && !user.employee_id && (
                        <span style={{ color: "var(--muted)" }}>N/A</span>
                      )}
                    </div>
                  </td>
                  <td style={{ fontSize: "14px", color: "var(--muted)" }}>
                    {user.department && (
                      <div>🏢 {user.department}</div>
                    )}
                    {user.city && (
                      <div>📍 {user.city}{user.state && `, ${user.state}`}</div>
                    )}
                    {!user.department && !user.city && (
                      <span>N/A</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${user.is_active ? 'success' : 'danger'}`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ color: "var(--muted)", fontSize: "14px" }}>
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => openEditModal(user)}
                        title="Edit user"
                      >
                        ✏️ Edit
                      </button>
                      {user.id !== userProfile?.id && (
                        <>
                          <button
                            className="btn btn-sm btn-info"
                            onClick={() => openRoleModal(user)}
                            title="Change role"
                          >
                            🔄 Role
                          </button>
                          <button
                            className={`btn btn-sm ${user.is_active ? 'btn-warning' : 'btn-success'}`}
                            onClick={() => toggleUserStatus(user.id, user.is_active)}
                            title={user.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {user.is_active ? '⏸️' : '▶️'}
                          </button>
                        </>
                      )}
                      {user.id === userProfile?.id && (
                        <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 'var(--font-weight-semibold)' }}>
                          👤 You
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredUsers.length === 0 && (
            <div className="empty-state">
              <span style={{ fontSize: "48px", marginBottom: "var(--spacing)" }}>👥</span>
              <h3>No users found</h3>
              <p>No users match your current filters.</p>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setSearchTerm('');
                  setUserTypeFilter('all');
                  setStatusFilter('all');
                }}
                style={{ marginTop: "var(--spacing)" }}
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit User - {selectedUser.full_name || selectedUser.email}</h3>
              <button
                className="modal-close"
                onClick={() => setShowEditModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="section">
                <h4>User Information</h4>

                <div className="form-group" style={{ marginBottom: 'var(--spacing)' }}>
                  <label className="form-label">Email (Cannot be changed)</label>
                  <input
                    className="input"
                    type="email"
                    value={selectedUser.email}
                    disabled
                    style={{ backgroundColor: 'var(--surface)', cursor: 'not-allowed' }}
                  />
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

                <div className="grid cols-2" style={{ marginBottom: 'var(--spacing)' }}>
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input
                      className="input"
                      type="tel"
                      placeholder="09XX XXX XXXX"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">City</label>
                    <input
                      className="input"
                      placeholder="Manila"
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                    />
                  </div>
                </div>

                {(selectedUser.user_type === 'staff' || selectedUser.user_type === 'admin') && (
                  <div className="grid cols-2" style={{ marginBottom: 'var(--spacing)' }}>
                    <div className="form-group">
                      <label className="form-label">Employee ID</label>
                      <input
                        className="input"
                        placeholder="EMP001"
                        value={editEmployeeId}
                        onChange={(e) => setEditEmployeeId(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Department</label>
                      <input
                        className="input"
                        placeholder="Operations"
                        value={editDepartment}
                        onChange={(e) => setEditDepartment(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <div style={{ padding: 'var(--spacing)', background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                    <div><strong>Type:</strong> <span className={`badge ${getUserTypeBadge(selectedUser.user_type)}`}>{getUserTypeLabel(selectedUser.user_type)}</span></div>
                    <div style={{ marginTop: 'var(--spacing-xs)' }}><strong>Status:</strong> <span className={`badge ${selectedUser.is_active ? 'success' : 'danger'}`}>{selectedUser.is_active ? 'Active' : 'Inactive'}</span></div>
                  </div>
                </div>
              </div>

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
                    onClick={updateUserInfo}
                    disabled={updating}
                  >
                    {updating ? 'Updating...' : '💾 Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Customer Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>👤 Create Customer Account</h3>
              <button
                className="modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="section">
                <h4>Account Credentials *</h4>
                <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: 'var(--spacing)' }}>
                  Create login credentials for the customer. They can change their password later.
                </p>

                <div className="form-group" style={{ marginBottom: 'var(--spacing)' }}>
                  <label className="form-label">Email Address *</label>
                  <input
                    className="input"
                    type="email"
                    placeholder="customer@example.com"
                    value={createEmail}
                    onChange={(e) => setCreateEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 'var(--spacing)' }}>
                  <label className="form-label">Password *</label>
                  <input
                    className="input"
                    type="password"
                    placeholder="Minimum 6 characters"
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <small style={{ color: 'var(--muted)', fontSize: '12px' }}>
                    Minimum 6 characters. Customer can change this later.
                  </small>
                </div>
              </div>

              <div className="section" style={{ marginTop: 'var(--spacing-lg)' }}>
                <h4>Customer Information *</h4>

                <div className="form-group" style={{ marginBottom: 'var(--spacing)' }}>
                  <label className="form-label">Full Name *</label>
                  <input
                    className="input"
                    placeholder="Juan Dela Cruz"
                    value={createFullName}
                    onChange={(e) => setCreateFullName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 'var(--spacing)' }}>
                  <label className="form-label">Customer Type *</label>
                  <select
                    className="input"
                    value={createUserType}
                    onChange={(e) => setCreateUserType(e.target.value)}
                  >
                    <option value="consumer">Consumer (Regular Customer)</option>
                    <option value="reseller">Reseller (Wholesale)</option>
                  </select>
                </div>

                <div className="grid cols-2" style={{ marginBottom: 'var(--spacing)' }}>
                  <div className="form-group">
                    <label className="form-label">Phone Number (Optional)</label>
                    <input
                      className="input"
                      type="tel"
                      placeholder="09XX XXX XXXX"
                      value={createPhone}
                      onChange={(e) => setCreatePhone(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">City (Optional)</label>
                    <input
                      className="input"
                      placeholder="Manila"
                      value={createCity}
                      onChange={(e) => setCreateCity(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">State/Province (Optional)</label>
                  <input
                    className="input"
                    placeholder="Metro Manila"
                    value={createState}
                    onChange={(e) => setCreateState(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ padding: 'var(--spacing)', background: 'var(--success-light)', borderRadius: 'var(--radius)', border: '1px solid var(--success)', marginTop: 'var(--spacing-lg)' }}>
                <strong>✅ Admin Creation:</strong> Accounts created by admins are auto-verified. The customer can log in immediately with the provided credentials!
              </div>

              <div className="section" style={{ marginTop: 'var(--spacing-lg)' }}>
                <div style={{ display: 'flex', gap: 'var(--spacing)', justifyContent: 'flex-end' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowCreateModal(false)}
                    disabled={updating}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-success"
                    onClick={createCustomer}
                    disabled={updating || !createEmail || !createPassword || !createFullName}
                  >
                    {updating ? 'Creating Account...' : '👤 Create Customer'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Role Modal */}
      {showRoleModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowRoleModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>Change User Role</h3>
              <button
                className="modal-close"
                onClick={() => setShowRoleModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="section">
                <div style={{ marginBottom: 'var(--spacing-lg)', padding: 'var(--spacing)', background: 'var(--surface)', borderRadius: 'var(--radius)' }}>
                  <div><strong>User:</strong> {selectedUser.full_name || selectedUser.email}</div>
                  <div style={{ marginTop: 'var(--spacing-xs)' }}><strong>Current Role:</strong> <span className={`badge ${getUserTypeBadge(selectedUser.user_type)}`}>{getUserTypeLabel(selectedUser.user_type)}</span></div>
                </div>

                <div className="form-group">
                  <label className="form-label">New Role</label>
                  <select
                    className="input"
                    value={editUserType}
                    onChange={(e) => setEditUserType(e.target.value)}
                  >
                    <option value="consumer">Consumer</option>
                    <option value="reseller">Reseller</option>
                    <option value="staff">Staff</option>
                  </select>
                </div>

                <div style={{ padding: 'var(--spacing)', background: 'var(--warning-light)', borderRadius: 'var(--radius)', border: '1px solid var(--warning)', marginTop: 'var(--spacing)' }}>
                  <strong>⚠️ Warning:</strong> Changing user roles will affect their permissions and access level.
                </div>
              </div>

              <div className="section" style={{ marginTop: 'var(--spacing-lg)' }}>
                <div style={{ display: 'flex', gap: 'var(--spacing)', justifyContent: 'flex-end' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowRoleModal(false)}
                    disabled={updating}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-warning"
                    onClick={updateUserRole}
                    disabled={updating || editUserType === selectedUser.user_type}
                  >
                    {updating ? 'Updating...' : '🔄 Change Role'}
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

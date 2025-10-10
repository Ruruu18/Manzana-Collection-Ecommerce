import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import '../../styles/dashboard-enhancement.css';

interface StaffMember {
  id: string;
  email: string;
  full_name: string;
  user_type: 'staff' | 'admin';
  employee_id?: string;
  department?: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
  last_sign_in_at?: string;
}

export default function StaffManagement() {
  const navigate = useNavigate();
  const { isAdmin, userProfile } = useAuth();
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Form state for adding staff
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [newStaffEmployeeId, setNewStaffEmployeeId] = useState('');
  const [newStaffDepartment, setNewStaffDepartment] = useState('');
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [creating, setCreating] = useState(false);

  // Form state for editing staff
  const [editStaffName, setEditStaffName] = useState('');
  const [editStaffEmployeeId, setEditStaffEmployeeId] = useState('');
  const [editStaffDepartment, setEditStaffDepartment] = useState('');
  const [editStaffPhone, setEditStaffPhone] = useState('');
  const [updating, setUpdating] = useState(false);

  // Redirect if not admin
  useEffect(() => {
    if (!isAdmin) {
      navigate('/admin');
      return;
    }
  }, [isAdmin, navigate]);

  // Load staff members
  const loadStaffMembers = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('user_type', 'staff')
        .order('created_at', { ascending: false });

      if (error) {
        setError(`Failed to load staff: ${error.message}`);
        console.error('Load staff error:', error);
      } else {
        setStaffMembers(data || []);
      }
    } catch (err) {
      setError('Failed to load staff members');
      console.error('Load staff exception:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadStaffMembers();
    }
  }, [isAdmin]);

  // Create new staff account with Supabase Auth
  const createStaffAccount = async () => {
    if (!newStaffEmail || !newStaffName || !newStaffPassword) {
      setError('Email, name, and password are required');
      return;
    }

    if (newStaffPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setCreating(true);
    setError(null);

    try {
      // Step 1: Get current admin session to restore it later
      const { data: { session: adminSession } } = await supabase.auth.getSession();

      if (!adminSession) {
        setError('Admin session not found. Please log in again.');
        return;
      }

      // Step 2: Create auth user using Supabase Auth
      // Note: This will temporarily log in as the new user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: newStaffEmail,
        password: newStaffPassword,
        options: {
          data: {
            full_name: newStaffName,
            user_type: 'staff'
          },
          emailRedirectTo: undefined // Prevent email confirmation redirect
        }
      });

      if (signUpError) {
        setError(`Failed to create auth account: ${signUpError.message}`);
        return;
      }

      if (!authData.user) {
        setError('Failed to create user account');
        return;
      }

      const newUserId = authData.user.id;

      // Step 3: Immediately restore admin session
      const { error: restoreError } = await supabase.auth.setSession({
        access_token: adminSession.access_token,
        refresh_token: adminSession.refresh_token
      });

      if (restoreError) {
        console.error('Failed to restore admin session:', restoreError);
        setError('Staff created but session restore failed. Please refresh the page.');
        return;
      }

      // Step 4: Create/Update user profile in users table (now with admin session restored)
      const { error: profileError } = await supabase
        .from('users')
        .upsert([{
          id: newUserId,
          email: newStaffEmail,
          full_name: newStaffName,
          user_type: 'staff',
          employee_id: newStaffEmployeeId || null,
          department: newStaffDepartment || null,
          phone: newStaffPhone || null,
          is_active: true,
        }], {
          onConflict: 'id'
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        setError(`User created but profile update failed: ${profileError.message}`);
        // Still reload to show the new user
      }

      // Reset form
      setNewStaffEmail('');
      setNewStaffName('');
      setNewStaffPassword('');
      setNewStaffEmployeeId('');
      setNewStaffDepartment('');
      setNewStaffPhone('');
      setShowAddForm(false);

      // Reload staff list
      await loadStaffMembers();

      alert(`Staff account created successfully!\n\nEmail: ${newStaffEmail}\nPassword: ${newStaffPassword}\n\nPlease save these credentials and share them with the staff member.`);
    } catch (err) {
      setError(`Failed to create staff account: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Create staff exception:', err);
    } finally {
      setCreating(false);
    }
  };

  // Update staff status
  const updateStaffStatus = async (staffId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: isActive })
        .eq('id', staffId);

      if (error) {
        setError(`Failed to update staff status: ${error.message}`);
      } else {
        await loadStaffMembers();
      }
    } catch (err) {
      setError('Failed to update staff status');
      console.error(err);
    }
  };

  // Delete staff account
  const deleteStaffAccount = async (staff: StaffMember) => {
    if (!confirm(`Are you sure you want to delete ${staff.full_name}'s account? This action cannot be undone.`)) {
      return;
    }

    try {
      // First, deactivate the user profile
      const { error: deactivateError } = await supabase
        .from('users')
        .update({ is_active: false })
        .eq('id', staff.id);

      if (deactivateError) {
        setError(`Failed to deactivate staff: ${deactivateError.message}`);
        return;
      }

      // Note: To fully delete the auth user, you would need admin privileges
      // For now, we just deactivate the profile
      alert(`${staff.full_name}'s account has been deactivated.`);

      await loadStaffMembers();
    } catch (err) {
      setError('Failed to delete staff account');
      console.error(err);
    }
  };

  // Open edit modal with staff data
  const openEditModal = (staff: StaffMember) => {
    setSelectedStaff(staff);
    setEditStaffName(staff.full_name);
    setEditStaffEmployeeId(staff.employee_id || '');
    setEditStaffDepartment(staff.department || '');
    setEditStaffPhone(staff.phone || '');
    setShowEditModal(true);
    setError(null);
  };

  // Update staff information
  const updateStaffInfo = async () => {
    if (!selectedStaff || !editStaffName) {
      setError('Name is required');
      return;
    }

    setUpdating(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          full_name: editStaffName,
          employee_id: editStaffEmployeeId || null,
          department: editStaffDepartment || null,
          phone: editStaffPhone || null,
        })
        .eq('id', selectedStaff.id);

      if (updateError) {
        setError(`Failed to update staff: ${updateError.message}`);
        return;
      }

      // Update local state
      setStaffMembers(prev => prev.map(staff =>
        staff.id === selectedStaff.id
          ? {
              ...staff,
              full_name: editStaffName,
              employee_id: editStaffEmployeeId || undefined,
              department: editStaffDepartment || undefined,
              phone: editStaffPhone || undefined
            }
          : staff
      ));

      setShowEditModal(false);
      setSelectedStaff(null);
    } catch (err) {
      setError(`Failed to update staff: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Filter staff members
  const filteredStaffMembers = staffMembers.filter(staff => {
    const matchesSearch = !searchTerm ||
      staff.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.employee_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.department?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && staff.is_active) ||
      (statusFilter === 'inactive' && !staff.is_active);

    return matchesSearch && matchesStatus;
  });

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="staff-management-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Staff Management</h1>
          <p className="page-subtitle">
            Create and manage staff accounts. Staff members can manage products, inventory, and orders.
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={loadStaffMembers}>
            🔄 Refresh
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              setShowAddForm(!showAddForm);
              setError(null);
            }}
          >
            {showAddForm ? '✕ Cancel' : '➕ Add Staff Member'}
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid cols-3" style={{ marginBottom: "var(--spacing-lg)" }}>
        <div className="metric-card info">
          <div className="metric-header">
            <h3 className="metric-title">
              <span className="metric-icon">👥</span>
              Total Staff
            </h3>
          </div>
          <div className="metric-value">{staffMembers.length}</div>
        </div>

        <div className="metric-card success">
          <div className="metric-header">
            <h3 className="metric-title">
              <span className="metric-icon">✅</span>
              Active
            </h3>
          </div>
          <div className="metric-value">
            {staffMembers.filter(s => s.is_active).length}
          </div>
        </div>

        <div className="metric-card warning">
          <div className="metric-header">
            <h3 className="metric-title">
              <span className="metric-icon">⏸️</span>
              Inactive
            </h3>
          </div>
          <div className="metric-value">
            {staffMembers.filter(s => !s.is_active).length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by name, email, employee ID, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>


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

      {/* Add Staff Form */}
      {showAddForm && (
        <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
          <h3 style={{ marginBottom: 'var(--spacing)' }}>Add New Staff Member</h3>

          <div className="grid cols-2" style={{ marginBottom: 'var(--spacing)' }}>
            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input
                className="input"
                type="email"
                placeholder="staff@manzana.com"
                value={newStaffEmail}
                onChange={(e) => setNewStaffEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                className="input"
                placeholder="Juan Dela Cruz"
                value={newStaffName}
                onChange={(e) => setNewStaffName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid cols-2" style={{ marginBottom: 'var(--spacing)' }}>
            <div className="form-group">
              <label className="form-label">Password *</label>
              <input
                className="input"
                type="password"
                placeholder="Minimum 6 characters"
                value={newStaffPassword}
                onChange={(e) => setNewStaffPassword(e.target.value)}
                required
              />
              <small style={{ color: 'var(--muted)', fontSize: '12px' }}>
                Password will be shown once after creation
              </small>
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                className="input"
                type="tel"
                placeholder="09XX XXX XXXX"
                value={newStaffPhone}
                onChange={(e) => setNewStaffPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="grid cols-2" style={{ marginBottom: 'var(--spacing)' }}>
            <div className="form-group">
              <label className="form-label">Employee ID</label>
              <input
                className="input"
                placeholder="EMP001"
                value={newStaffEmployeeId}
                onChange={(e) => setNewStaffEmployeeId(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Department</label>
              <input
                className="input"
                placeholder="Operations, Sales, etc."
                value={newStaffDepartment}
                onChange={(e) => setNewStaffDepartment(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="error-message" style={{
              color: 'var(--danger)',
              marginBottom: 'var(--spacing)',
              padding: 'var(--spacing-sm)',
              background: 'var(--danger-light)',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--danger)'
            }}>
              ⚠️ {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 'var(--spacing)' }}>
            <button
              className="btn btn-primary"
              onClick={createStaffAccount}
              disabled={creating || !newStaffEmail || !newStaffName || !newStaffPassword}
            >
              {creating ? (
                <>
                  <span className="spinner" style={{ width: 14, height: 14, marginRight: '8px' }}></span>
                  Creating...
                </>
              ) : (
                'Create Staff Account'
              )}
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setShowAddForm(false);
                setError(null);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Staff List */}
      <div className="card">
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--spacing-lg)'
        }}>
          <h3>Staff Members ({filteredStaffMembers.length} {searchTerm || statusFilter !== 'all' ? `of ${staffMembers.length}` : ''})</h3>
          {error && !showAddForm && !showEditModal && (
            <div style={{ color: 'var(--danger)', fontSize: '14px' }}>
              ⚠️ {error}
            </div>
          )}
        </div>

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <span>Loading staff members...</span>
          </div>
        ) : filteredStaffMembers.length === 0 && staffMembers.length === 0 ? (
          <div className="empty-state">
            <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl)', color: 'var(--muted)' }}>
              <div style={{ fontSize: '48px', marginBottom: 'var(--spacing)' }}>👥</div>
              <h3 style={{ margin: '0 0 var(--spacing-sm)', color: 'var(--text)' }}>
                No staff members yet
              </h3>
              <p style={{ margin: 0 }}>
                Add your first staff member to help manage products, inventory, and orders.
              </p>
              <button
                className="btn btn-primary"
                style={{ marginTop: 'var(--spacing)' }}
                onClick={() => setShowAddForm(true)}
              >
                + Add First Staff Member
              </button>
            </div>
          </div>
        ) : filteredStaffMembers.length === 0 ? (
          <div className="empty-state">
            <span style={{ fontSize: "48px", marginBottom: "var(--spacing)" }}>🔍</span>
            <h3>No staff members found</h3>
            <p>No staff members match your current filters.</p>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
              }}
              style={{ marginTop: "var(--spacing)" }}
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Employee ID</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaffMembers.map((staff) => (
                  <tr key={staff.id}>
                    <td>
                      <div style={{ fontWeight: 'var(--font-weight-semibold)' }}>
                        {staff.full_name || 'N/A'}
                      </div>
                      {staff.phone && (
                        <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                          📱 {staff.phone}
                        </div>
                      )}
                    </td>
                    <td>{staff.email}</td>
                    <td>{staff.department || 'N/A'}</td>
                    <td>{staff.employee_id || 'N/A'}</td>
                    <td>
                      <span className={`badge ${staff.is_active ? 'success' : 'danger'}`}>
                        {staff.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--muted)', fontSize: '14px' }}>
                      {formatDate(staff.created_at)}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => openEditModal(staff)}
                          title="Edit staff member"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          className={`btn btn-sm ${staff.is_active ? 'btn-warning' : 'btn-success'}`}
                          onClick={() => updateStaffStatus(staff.id, !staff.is_active)}
                          title={staff.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {staff.is_active ? '⏸️' : '▶️'}
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => deleteStaffAccount(staff)}
                          title="Delete account"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Staff Modal */}
      {showEditModal && selectedStaff && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Staff Member - {selectedStaff.full_name}</h3>
              <button
                className="modal-close"
                onClick={() => setShowEditModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* Staff Information Form */}
              <div className="section">
                <h4>Staff Information</h4>

                <div className="form-group" style={{ marginBottom: 'var(--spacing)' }}>
                  <label className="form-label">Email (Cannot be changed)</label>
                  <input
                    className="input"
                    type="email"
                    value={selectedStaff.email}
                    disabled
                    style={{ backgroundColor: 'var(--surface)', cursor: 'not-allowed' }}
                  />
                  <small style={{ color: 'var(--muted)', fontSize: '12px' }}>
                    Email address cannot be modified for security reasons
                  </small>
                </div>

                <div className="form-group" style={{ marginBottom: 'var(--spacing)' }}>
                  <label className="form-label">Full Name *</label>
                  <input
                    className="input"
                    placeholder="Juan Dela Cruz"
                    value={editStaffName}
                    onChange={(e) => setEditStaffName(e.target.value)}
                    required
                  />
                </div>

                <div className="grid cols-2" style={{ marginBottom: 'var(--spacing)' }}>
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input
                      className="input"
                      type="tel"
                      placeholder="09XX XXX XXXX"
                      value={editStaffPhone}
                      onChange={(e) => setEditStaffPhone(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Employee ID</label>
                    <input
                      className="input"
                      placeholder="EMP001"
                      value={editStaffEmployeeId}
                      onChange={(e) => setEditStaffEmployeeId(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 'var(--spacing)' }}>
                  <label className="form-label">Department</label>
                  <input
                    className="input"
                    placeholder="Operations, Sales, etc."
                    value={editStaffDepartment}
                    onChange={(e) => setEditStaffDepartment(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 'var(--spacing)' }}>
                  <div style={{ padding: 'var(--spacing)', background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                    <div><strong>Role:</strong> <span className="badge info">Staff</span></div>
                    <div style={{ marginTop: 'var(--spacing-xs)' }}><strong>Status:</strong> <span className={`badge ${selectedStaff.is_active ? 'success' : 'danger'}`}>{selectedStaff.is_active ? 'Active' : 'Inactive'}</span></div>
                    <div style={{ marginTop: 'var(--spacing-xs)', color: 'var(--muted)', fontSize: '14px' }}><strong>Joined:</strong> {formatDate(selectedStaff.created_at)}</div>
                  </div>
                </div>

                {error && (
                  <div className="error-message" style={{
                    color: 'var(--danger)',
                    marginBottom: 'var(--spacing)',
                    padding: 'var(--spacing-sm)',
                    background: 'var(--danger-light)',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--danger)'
                  }}>
                    ⚠️ {error}
                  </div>
                )}
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
                    onClick={updateStaffInfo}
                    disabled={updating || !editStaffName}
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

      {/* Info Card */}
      <div className="card" style={{ marginTop: 'var(--spacing-lg)', background: 'var(--info-light)', borderLeft: '4px solid var(--info)' }}>
        <h4 style={{ marginBottom: 'var(--spacing-sm)' }}>Staff Permissions</h4>
        <p style={{ margin: 0, color: 'var(--muted)' }}>
          Staff members have access to:
        </p>
        <ul style={{ marginTop: 'var(--spacing-sm)', marginBottom: 0 }}>
          <li>📦 <strong>Products:</strong> Create, edit, and manage product inventory</li>
          <li>📋 <strong>Orders:</strong> View and update order status, process orders</li>
          <li>📂 <strong>Categories:</strong> Manage product categories</li>
          <li>📊 <strong>Reports:</strong> View sales reports and analytics</li>
        </ul>
        <p style={{ marginTop: 'var(--spacing-sm)', marginBottom: 0, color: 'var(--muted)' }}>
          Staff members <strong>cannot access</strong>: User Management, Promotions, or Staff Management (admin-only features)
        </p>
      </div>
    </div>
  );
}

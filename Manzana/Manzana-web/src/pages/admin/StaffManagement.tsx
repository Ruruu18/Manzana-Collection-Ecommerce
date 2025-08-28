import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

interface StaffMember {
  id: string;
  email: string;
  full_name: string;
  user_type: 'staff' | 'admin';
  employee_id?: string;
  department?: string;
  hire_date?: string;
  is_active: boolean;
  last_login_at?: string;
  created_at: string;
  created_by?: string;
}

interface StaffPermission {
  id: string;
  user_id: string;
  permission_name: string;
  permission_value: boolean;
  granted_by?: string;
  created_at: string;
}

const DEFAULT_PERMISSIONS = [
  { name: 'manage_products', label: 'Manage Products', description: 'Create, edit, and delete products' },
  { name: 'manage_categories', label: 'Manage Categories', description: 'Create, edit, and delete categories' },
  { name: 'manage_promotions', label: 'Manage Promotions', description: 'Create, edit, and delete promotions' },
  { name: 'manage_orders', label: 'Manage Orders', description: 'View and update order status' },
  { name: 'view_analytics', label: 'View Analytics', description: 'Access dashboard and reports' },
  { name: 'upload_images', label: 'Upload Images', description: 'Upload product and promotion images' },
];

export default function StaffManagement() {
  const navigate = useNavigate();
  const { isAdmin, userProfile } = useAuth();
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [permissions, setPermissions] = useState<Record<string, StaffPermission[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [showPermissions, setShowPermissions] = useState(false);

  // Form state for adding staff
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmployeeId, setNewStaffEmployeeId] = useState('');
  const [newStaffDepartment, setNewStaffDepartment] = useState('');
  const [creating, setCreating] = useState(false);

  // Redirect if not admin
  useEffect(() => {
    if (!isAdmin) {
      navigate('/admin/dashboard');
      return;
    }
  }, [isAdmin, navigate]);

  // Load staff members
  const loadStaffMembers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .in('user_type', ['staff', 'admin'])
        .order('created_at', { ascending: false });

      if (error) {
        setError(`Failed to load staff: ${error.message}`);
      } else {
        setStaffMembers(data || []);
      }
    } catch (err) {
      setError('Failed to load staff members');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Load permissions for a specific staff member
  const loadPermissions = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('staff_permissions')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('Failed to load permissions:', error);
      } else {
        setPermissions(prev => ({
          ...prev,
          [userId]: data || []
        }));
      }
    } catch (err) {
      console.error('Failed to load permissions:', err);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadStaffMembers();
    }
  }, [isAdmin]);

  // Create new staff account
  const createStaffAccount = async () => {
    if (!newStaffEmail || !newStaffName) {
      setError('Email and name are required');
      return;
    }

    setCreating(true);
    setError(null);

    try {
      // Note: In a real implementation, you would need to create the auth user first
      // This is a simplified version that creates the profile only
      const { error: createError } = await supabase
        .from('users')
        .insert([{
          email: newStaffEmail,
          full_name: newStaffName,
          user_type: 'staff',
          employee_id: newStaffEmployeeId || null,
          department: newStaffDepartment || null,
          hire_date: new Date().toISOString().split('T')[0],
          is_active: true,
          created_by: userProfile?.id
        }]);

      if (createError) {
        setError(`Failed to create staff account: ${createError.message}`);
        return;
      }

      // Reset form
      setNewStaffEmail('');
      setNewStaffName('');
      setNewStaffEmployeeId('');
      setNewStaffDepartment('');
      setShowAddForm(false);

      // Reload staff list
      await loadStaffMembers();
    } catch (err) {
      setError('Failed to create staff account');
      console.error(err);
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

  // Update permission
  const updatePermission = async (staffId: string, permissionName: string, value: boolean) => {
    try {
      const { error } = await supabase
        .from('staff_permissions')
        .upsert({
          user_id: staffId,
          permission_name: permissionName,
          permission_value: value,
          granted_by: userProfile?.id
        }, {
          onConflict: 'user_id,permission_name'
        });

      if (error) {
        setError(`Failed to update permission: ${error.message}`);
      } else {
        await loadPermissions(staffId);
      }
    } catch (err) {
      setError('Failed to update permission');
      console.error(err);
    }
  };

  // Show permissions modal
  const showPermissionsModal = async (staff: StaffMember) => {
    setSelectedStaff(staff);
    await loadPermissions(staff.id);
    setShowPermissions(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="staff-management-page">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Staff Management</h1>
          <p className="dashboard-subtitle">
            Manage staff accounts, permissions, and access control. Only admins can access this section.
          </p>
        </div>
        <div className="dashboard-actions">
          <button
            className="btn btn-primary"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? '✕ Cancel' : '👥 Add Staff Member'}
          </button>
        </div>
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
                placeholder="staff@company.com"
                value={newStaffEmail}
                onChange={(e) => setNewStaffEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                className="input"
                placeholder="John Doe"
                value={newStaffName}
                onChange={(e) => setNewStaffName(e.target.value)}
                required
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
                placeholder="Operations"
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
              disabled={creating || !newStaffEmail || !newStaffName}
            >
              {creating ? (
                <>
                  <span className="spinner" style={{ width: 14, height: 14 }}></span>
                  Creating...
                </>
              ) : (
                '👥 Create Staff Account'
              )}
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setShowAddForm(false)}
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
          <h3>Staff Members ({staffMembers.length})</h3>
        </div>

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <span>Loading staff members...</span>
          </div>
        ) : staffMembers.length === 0 ? (
          <div className="empty-state">
            <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl)', color: 'var(--muted)' }}>
              <div style={{ fontSize: '48px', marginBottom: 'var(--spacing)' }}>👥</div>
              <h3 style={{ margin: '0 0 var(--spacing-sm)', color: 'var(--text)' }}>
                No staff members yet
              </h3>
              <p style={{ margin: 0 }}>
                Add your first staff member to start managing your team.
              </p>
              <button
                className="btn btn-primary"
                style={{ marginTop: 'var(--spacing)' }}
                onClick={() => setShowAddForm(true)}
              >
                👥 Add First Staff Member
              </button>
            </div>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Hire Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {staffMembers.map((staff) => (
                  <tr key={staff.id}>
                    <td>
                      <div style={{ fontWeight: 'var(--font-weight-semibold)' }}>
                        {staff.full_name}
                      </div>
                      {staff.employee_id && (
                        <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                          ID: {staff.employee_id}
                        </div>
                      )}
                    </td>
                    <td>{staff.email}</td>
                    <td>
                      <span className={`badge ${staff.user_type === 'admin' ? 'success' : 'info'}`}>
                        {staff.user_type}
                      </span>
                    </td>
                    <td>{staff.department || 'N/A'}</td>
                    <td>
                      <span className={`badge ${staff.is_active ? 'success' : 'danger'}`}>
                        {staff.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--muted)', fontSize: '14px' }}>
                      {staff.hire_date ? formatDate(staff.hire_date) : 'N/A'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                        {staff.user_type === 'staff' && (
                          <>
                            <button
                              className="btn btn-secondary"
                              style={{ fontSize: '12px', padding: '6px 10px' }}
                              onClick={() => showPermissionsModal(staff)}
                              title="Manage permissions"
                            >
                              🔑
                            </button>
                            <button
                              className={`btn ${staff.is_active ? 'btn-warning' : 'btn-success'}`}
                              style={{ fontSize: '12px', padding: '6px 10px' }}
                              onClick={() => updateStaffStatus(staff.id, !staff.is_active)}
                              title={staff.is_active ? 'Deactivate' : 'Activate'}
                            >
                              {staff.is_active ? '⏸️' : '▶️'}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Permissions Modal */}
      {showPermissions && selectedStaff && (
        <div className="modal-overlay" onClick={() => setShowPermissions(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Manage Permissions - {selectedStaff.full_name}</h3>
              <button 
                className="btn btn-secondary"
                onClick={() => setShowPermissions(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <p style={{ marginBottom: 'var(--spacing)', color: 'var(--muted)' }}>
                Configure what this staff member can access and manage.
              </p>
              
              <div className="permissions-list">
                {DEFAULT_PERMISSIONS.map((permission) => {
                  const userPermission = permissions[selectedStaff.id]?.find(
                    p => p.permission_name === permission.name
                  );
                  const hasPermission = userPermission?.permission_value ?? false;
                  
                  return (
                    <div 
                      key={permission.name} 
                      className="permission-item"
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: 'var(--spacing)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                        marginBottom: 'var(--spacing-sm)'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 'var(--font-weight-semibold)' }}>
                          {permission.label}
                        </div>
                        <div style={{ fontSize: '14px', color: 'var(--muted)' }}>
                          {permission.description}
                        </div>
                      </div>
                      <label className="switch">
                        <input
                          type="checkbox"
                          checked={hasPermission}
                          onChange={(e) => updatePermission(
                            selectedStaff.id,
                            permission.name,
                            e.target.checked
                          )}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

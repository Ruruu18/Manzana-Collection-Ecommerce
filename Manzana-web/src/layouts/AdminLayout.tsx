import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect, useRef } from "react";
import { useAdminNotifications } from "../hooks/useAdminNotifications";
import "../styles/sidebar-enhancement.css";
import "../styles/notification-modal.css";

export default function AdminLayout() {
  const { user, signOut, isAdmin } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  // Use real notification system
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    requestNotificationPermission,
    getRelativeTime
  } = useAdminNotifications();

  // Request browser notification permission on mount
  useEffect(() => {
    requestNotificationPermission();
  }, [requestNotificationPermission]);

  const getNotificationIcon = (severity: string) => {
    switch (severity) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return 'ℹ️';
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    };

    if (showNotifications || showUserDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications, showUserDropdown]);

  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <div className="brand">
          <img
            src="/images/MANZANA-LOGO.png"
            alt="Manzana Collection"
            className="brand-logo-img"
            style={{ width: '160px', height: 'auto' }}
          />
        </div>

        <nav className="nav">
          <NavLink
            to="/admin"
            end
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <span className="nav-icon">📊</span>
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/admin/products"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <span className="nav-icon">📦</span>
            <span>Products</span>
          </NavLink>

          <NavLink
            to="/admin/categories"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <span className="nav-icon">📂</span>
            <span>Categories</span>
          </NavLink>

          <NavLink
            to="/admin/orders"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <span className="nav-icon">📋</span>
            <span>Orders</span>
          </NavLink>

          {/* Admin-only navigation items */}
          {isAdmin && (
            <>
              <NavLink
                to="/admin/promotions"
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                <span className="nav-icon">🏷️</span>
                <span>Promotions</span>
              </NavLink>

              <NavLink
                to="/admin/users"
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                <span className="nav-icon">👥</span>
                <span>User Management</span>
              </NavLink>

              <NavLink
                to="/admin/staff"
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                <span className="nav-icon">👨‍💼</span>
                <span>Staff Management</span>
              </NavLink>
            </>
          )}
        </nav>


      </aside>

      <main className="main">
        <header className="topbar">

          <div className="topbar-actions">
            <div className="notification-container" ref={notificationRef}>
              <button 
                className="notification-btn"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                🔔
                {unreadCount > 0 && (
                  <span className="notification-badge">{unreadCount}</span>
                )}
              </button>
              
              {showNotifications && (
                <div className="notification-dropdown">
                  <div className="notification-header">
                    <h4>Notifications</h4>
                    {unreadCount > 0 && (
                      <button 
                        className="mark-all-read"
                        onClick={markAllAsRead}
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  
                  <div className="notification-list">
                    {notifications.length === 0 ? (
                      <div className="no-notifications">
                        <span>🔔</span>
                        <p>No notifications</p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`notification-item ${!notification.read ? 'unread' : ''}`}
                          onClick={() => {
                            markAsRead(notification.id);
                            setSelectedNotification(notification);
                            setShowNotifications(false);
                          }}
                        >
                          <div className="notification-icon">
                            {getNotificationIcon(notification.severity)}
                          </div>
                          <div className="notification-content">
                            <div className="notification-title">
                              {notification.title}
                            </div>
                            <div className="notification-message">
                              {notification.message}
                            </div>
                            <div className="notification-time">
                              {getRelativeTime(notification.created_at)}
                            </div>
                          </div>
                          {!notification.read && (
                            <div className="unread-indicator"></div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                  
                  <div className="notification-footer">
                    <button className="view-all-notifications">
                      View all notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="user-container" ref={userDropdownRef}>
              <button 
                className="user"
                onClick={() => setShowUserDropdown(!showUserDropdown)}
              >
                <div className="avatar">
                  {user?.email?.charAt(0).toUpperCase() || "A"}
                </div>
                <div className="user-info">
                  <div className="user-name">
                    {user?.email?.split("@")[0] || "Admin"}
                  </div>
                  <div className="user-role">{isAdmin ? 'Administrator' : 'Staff Member'}</div>
                </div>
                <span className="dropdown-arrow">▼</span>
              </button>
              
              {showUserDropdown && (
                <>
                  <div className="dropdown-backdrop" onClick={() => setShowUserDropdown(false)}></div>
                  <div className="user-dropdown">
                    <div className="user-dropdown-item">
                      <span className="dropdown-icon">👤</span>
                      <span>Profile</span>
                    </div>
                    <div className="user-dropdown-divider"></div>
                    <button 
                      className="user-dropdown-item logout-item"
                      onClick={signOut}
                    >
                      <span className="dropdown-icon">🚪</span>
                      <span>Logout</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <div className="content">
          <Outlet />
        </div>
      </main>

      {/* Notification View Modal */}
      {selectedNotification && (
        <div className="notification-modal-overlay" onClick={() => setSelectedNotification(null)}>
          <div className="notification-modal" onClick={(e) => e.stopPropagation()}>
            <div className="notification-modal-header">
              <div className="notification-modal-icon">
                {getNotificationIcon(selectedNotification.severity)}
              </div>
              <h2>{selectedNotification.title}</h2>
              <button
                className="notification-modal-close"
                onClick={() => setSelectedNotification(null)}
              >
                ✕
              </button>
            </div>

            <div className="notification-modal-body">
              <div className="notification-modal-time">
                {new Date(selectedNotification.created_at).toLocaleString('en-US', {
                  dateStyle: 'long',
                  timeStyle: 'short'
                })}
              </div>

              <div className="notification-modal-message">
                {selectedNotification.message}
              </div>

              {selectedNotification.data && (
                <div className="notification-modal-data">
                  <h4>Details</h4>
                  <div className="notification-data-grid">
                    {Object.entries(selectedNotification.data).map(([key, value]) => (
                      <div key={key} className="notification-data-item">
                        <span className="data-label">{key.replace(/_/g, ' ')}:</span>
                        <span className="data-value">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="notification-modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setSelectedNotification(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

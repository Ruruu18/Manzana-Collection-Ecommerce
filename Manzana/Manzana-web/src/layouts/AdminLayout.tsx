import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect, useRef } from "react";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  time: string;
  read: boolean;
}

export default function AdminLayout() {
  const { user, signOut } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      title: "New Order Received",
      message: "Order #12345 has been placed by John Doe",
      type: "info",
      time: "2 minutes ago",
      read: false
    },
    {
      id: "2", 
      title: "Low Stock Alert",
      message: "Product 'Summer Dress' is running low on stock",
      type: "warning",
      time: "1 hour ago",
      read: false
    },
    {
      id: "3",
      title: "Payment Confirmed",
      message: "Payment for order #12344 has been confirmed",
      type: "success", 
      time: "3 hours ago",
      read: true
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
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
          <div className="logo">🛍️</div>
          <div className="brand-text">Manzana Admin</div>
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
            to="/admin/promotions"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <span className="nav-icon">🏷️</span>
            <span>Promotions</span>
          </NavLink>

          <NavLink
            to="/admin/orders"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <span className="nav-icon">📋</span>
            <span>Orders</span>
          </NavLink>

          <NavLink
            to="/admin/customers"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <span className="nav-icon">👥</span>
            <span>Customers</span>
          </NavLink>
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
                          onClick={() => markAsRead(notification.id)}
                        >
                          <div className="notification-icon">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="notification-content">
                            <div className="notification-title">
                              {notification.title}
                            </div>
                            <div className="notification-message">
                              {notification.message}
                            </div>
                            <div className="notification-time">
                              {notification.time}
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
                  <div className="user-role">Administrator</div>
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
    </div>
  );
}

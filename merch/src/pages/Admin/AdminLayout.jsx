/* src/pages/Admin/AdminLayout.jsx */
import React, { useState, useEffect } from "react";
import { Outlet, NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import "./AdminLayout.css";

export default function AdminLayout() {
  const { user, signout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('admin_theme') === 'dark';
  });

  useEffect(() => {
    if (isDarkMode) {
      localStorage.setItem('admin_theme', 'dark');
    } else {
      localStorage.setItem('admin_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const navItems = [
    { path: "/admin/dashboard", label: "Dashboard", icon: "dashboard" },
    { path: "/admin/orders", label: "Orders", icon: "shopping_bag" },
    { path: "/admin/items", label: "Manage Items", icon: "inventory_2" },
  ];

  const adminInitial = user?.email ? user.email.charAt(0).toUpperCase() : "A";

  return (
    <div className={`admin-root ${isDarkMode ? "dark" : ""}`}>
      <div className="admin-layout">
        {/* Sidebar */}
        <aside className="admin-sidebar">
          <div className="admin-sidebar__header">
            <Link to="/" className="admin-sidebar__logo">
              ALMA<span> ADMIN</span>
            </Link>
          </div>
          
          <nav className="admin-sidebar__nav">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => 
                  `admin-nav-item ${isActive ? "admin-nav-item--active" : ""}`
                }
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="admin-sidebar__footer">
            <Link to="/" className="admin-nav-item">
              <span className="material-symbols-outlined">store</span>
              <span>Back to Store</span>
            </Link>
            <button 
              onClick={signout} 
              className="admin-nav-item" 
              style={{ background: 'none', border: 'none', width: '100%', cursor: 'pointer', textAlign: 'left' }}
            >
              <span className="material-symbols-outlined">logout</span>
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="admin-main">
          <div className="admin-content-area">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

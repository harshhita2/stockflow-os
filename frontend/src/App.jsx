import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import ProductList from './components/ProductList';
import CustomerList from './components/CustomerList';
import OrderList from './components/OrderList';

// Set backend API URL dynamically based on Vite env variables
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [notification, setNotification] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  // Sync theme changes with body class for styling overrides
  useEffect(() => {
    document.body.className = theme === 'dark' ? 'dark-theme' : '';
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Core Data States
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    total_products: 0,
    total_customers: 0,
    total_orders: 0,
    low_stock_count: 0,
    low_stock_products: []
  });

  // Loading & Error States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Show automatic auto-dismiss notification helper
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    // Auto dismiss after 5 seconds
    setTimeout(() => {
      setNotification((curr) => (curr && curr.message === message ? null : curr));
    }, 5000);
  };

  // Centralized data fetcher
  const refreshAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch dashboard statistics
      const statsRes = await fetch(`${API_URL}/dashboard/stats`);
      if (!statsRes.ok) throw new Error('Failed to retrieve dashboard stats.');
      const statsData = await statsRes.json();
      setDashboardStats(statsData);

      // 2. Fetch products catalog
      const prodRes = await fetch(`${API_URL}/products`);
      if (!prodRes.ok) throw new Error('Failed to retrieve products list.');
      const prodData = await prodRes.json();
      setProducts(prodData);

      // 3. Fetch customers list
      const custRes = await fetch(`${API_URL}/customers`);
      if (!custRes.ok) throw new Error('Failed to retrieve customers list.');
      const custData = await custRes.json();
      setCustomers(custData);

      // 4. Fetch orders history
      const ordRes = await fetch(`${API_URL}/orders`);
      if (!ordRes.ok) throw new Error('Failed to retrieve orders list.');
      const ordData = await ordRes.json();
      setOrders(ordData);

    } catch (err) {
      console.error(err);
      setError(err.message || 'Unable to communicate with the backend services.');
    } finally {
      setLoading(false);
    }
  };

  // Load database content on mount
  useEffect(() => {
    refreshAllData();
  }, []);

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    // Refresh stats when switching tabs
    refreshAllData();
  };

  return (
    <div className={`app-container ${theme === 'dark' ? 'dark-theme' : ''}`}>
      {/* Dynamic Animated Mesh Glow Backgrounds */}
      <div className="bg-glow-1"></div>
      <div className="bg-glow-2"></div>
      <div className="bg-glow-3"></div>

      {/* Brand Header & Nav Navigation */}
      <header className="app-header">
        <div className="header-content">
          <div className="brand-section">
            <div className="brand-icon">📦</div>
            <div className="brand-name">StockFlow OS</div>
          </div>
          
          <nav className="nav-links" style={{ display: 'flex', alignItems: 'center' }}>
            <button 
              className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => handleTabChange('dashboard')}
            >
              📊 Dashboard
            </button>
            <button 
              className={`nav-item ${activeTab === 'products' ? 'active' : ''}`}
              onClick={() => handleTabChange('products')}
            >
              🏷️ Products
            </button>
            <button 
              className={`nav-item ${activeTab === 'customers' ? 'active' : ''}`}
              onClick={() => handleTabChange('customers')}
            >
              👥 Customers
            </button>
            <button 
              className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => handleTabChange('orders')}
            >
              🛒 Orders
            </button>
            <button 
              className="theme-toggle-btn" 
              onClick={toggleTheme}
              title="Toggle Light/Dark Theme"
              type="button"
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
          </nav>
        </div>
      </header>

      {/* Main Viewport Content */}
      <main className="main-content">
        {/* Floating feedback alert banners */}
        {notification && (
          <div className={`alert alert-${notification.type}`}>
            <span>{notification.message}</span>
            <button className="alert-close" onClick={() => setNotification(null)}>
              &times;
            </button>
          </div>
        )}

        {/* Dynamic Route Rendering */}
        {activeTab === 'dashboard' && (
          <Dashboard 
            stats={dashboardStats} 
            loading={loading} 
            error={error} 
            onNavigate={handleTabChange}
            API_URL={API_URL}
          />
        )}

        {activeTab === 'products' && (
          <ProductList 
            products={products} 
            loading={loading} 
            error={error} 
            onRefresh={refreshAllData} 
            showNotification={showNotification}
            API_URL={API_URL}
          />
        )}

        {activeTab === 'customers' && (
          <CustomerList 
            customers={customers} 
            loading={loading} 
            error={error} 
            onRefresh={refreshAllData} 
            showNotification={showNotification}
            API_URL={API_URL}
          />
        )}

        {activeTab === 'orders' && (
          <OrderList 
            orders={orders} 
            products={products}
            customers={customers}
            loading={loading} 
            error={error} 
            onRefresh={refreshAllData} 
            showNotification={showNotification}
            API_URL={API_URL}
          />
        )}
      </main>
    </div>
  );
}

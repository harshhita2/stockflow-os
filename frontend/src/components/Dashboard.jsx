import React, { useState } from 'react';

export default function Dashboard({ stats, loading, error, onNavigate, API_URL, products = [], customers = [], orders = [] }) {
  const [searchId, setSearchId] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    const query = searchId.trim().toLowerCase();
    if (!query) {
      setSearchError('Please enter a search query.');
      setSearchResults(null);
      return;
    }

    setSearchLoading(true);
    setSearchError('');
    setSearchResults(null);

    // Support numeric ID lookup by stripping leading '#' if typed (e.g. '#12' -> '12')
    const cleanIdQuery = query.replace(/^#/, '').trim();

    // 1. Products: search by SKU / Code (case-insensitive substring)
    const matchingProducts = products.filter(p => 
      p.sku.toLowerCase().includes(query)
    );

    // 2. Customers: search by Name (substring) and ID (exact)
    const matchingCustomers = customers.filter(c => 
      c.name.toLowerCase().includes(query) || 
      c.id.toString() === cleanIdQuery
    );

    // 3. Orders: search by Order ID (exact)
    const matchingOrders = orders.filter(o => 
      o.id.toString() === cleanIdQuery
    );

    if (matchingProducts.length === 0 && matchingCustomers.length === 0 && matchingOrders.length === 0) {
      setSearchError(`No matches found for "${searchId}". Try searching a different SKU, Name, or ID.`);
      setSearchResults(null);
    } else {
      setSearchResults({
        products: matchingProducts,
        customers: matchingCustomers,
        orders: matchingOrders
      });
    }
    setSearchLoading(false);
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem' }}>Loading Dashboard Stats...</div>;
  }

  if (error) {
    return (
      <div className="alert alert-error">
        <span>Failed to load dashboard data: {error}</span>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.25rem' }}>Dashboard Overview</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Real-time inventory and customer order insights.</p>
      </div>

      {/* Global ID Search Bar */}
      <div className="panel" style={{ padding: '1.5rem', marginBottom: '2rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.6 }}>🔍</span>
            <input
              type="text"
              placeholder="Search product SKU, customer name/ID, or order ID..."
              className="form-control"
              style={{ paddingLeft: '2.5rem' }}
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ minWidth: '120px' }} disabled={searchLoading}>
            {searchLoading ? 'Searching...' : 'Search'}
          </button>
          {searchResults && (
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => { setSearchResults(null); setSearchId(''); }}
            >
              Clear
            </button>
          )}
        </form>

        {searchError && (
          <div className="alert alert-error" style={{ marginTop: '1rem', marginBottom: '0', padding: '0.75rem 1rem', fontSize: '0.9rem' }}>
            <span>{searchError}</span>
          </div>
        )}

        {searchResults && (
          <div style={{ marginTop: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
              🔎 Results for "{searchId}"
            </h3>
            <div className="dashboard-grid" style={{ marginBottom: '0' }}>
              {searchResults.products.map((product) => (
                <div key={`search-prod-${product.id}`} className="card card-primary" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div className="card-title">📦 Product Match</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0.5rem 0' }}>{product.name}</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      <div>SKU: <code>{product.sku}</code></div>
                      <div>Price: ₹{product.price.toFixed(2)}</div>
                      <div>Stock: {product.quantity} units</div>
                    </div>
                  </div>
                  <button className="btn btn-secondary btn-sm" style={{ marginTop: '1.25rem', width: '100%' }} onClick={() => onNavigate('products')}>
                    Go to Catalog
                  </button>
                </div>
              ))}

              {searchResults.customers.map((customer) => (
                <div key={`search-cust-${customer.id}`} className="card card-success" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div className="card-title">👥 Customer Match</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0.5rem 0' }}>{customer.name} (ID: #{customer.id})</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      <div>Email: {customer.email}</div>
                      <div>Phone: {customer.phone || 'Not provided'}</div>
                    </div>
                  </div>
                  <button className="btn btn-secondary btn-sm" style={{ marginTop: '1.25rem', width: '100%' }} onClick={() => onNavigate('customers')}>
                    Go to Directory
                  </button>
                </div>
              ))}

              {searchResults.orders.map((order) => (
                <div key={`search-ord-${order.id}`} className="card card-info" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div className="card-title">🛒 Order Match</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0.5rem 0' }}>Order #{order.id}</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      <div>Customer: {order.customer?.name || 'Unknown'}</div>
                      <div>Total Value: ₹{order.total_amount.toFixed(2)}</div>
                      <div>Date: {new Date(order.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <button className="btn btn-secondary btn-sm" style={{ marginTop: '1.25rem', width: '100%' }} onClick={() => onNavigate('orders')}>
                    Go to Orders Register
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="dashboard-grid">
        <div className="card card-primary" style={{ cursor: 'pointer' }} onClick={() => onNavigate('products')}>
          <div className="card-title">Total Products</div>
          <div className="card-value">{stats.total_products}</div>
          <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Manage inventory and pricing
          </div>
        </div>

        <div className="card card-success" style={{ cursor: 'pointer' }} onClick={() => onNavigate('customers')}>
          <div className="card-title">Total Customers</div>
          <div className="card-value">{stats.total_customers}</div>
          <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Customer directory and details
          </div>
        </div>

        <div className="card card-info" style={{ cursor: 'pointer' }} onClick={() => onNavigate('orders')}>
          <div className="card-title">Total Orders</div>
          <div className="card-value">{stats.total_orders}</div>
          <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Track sales and fulfillment
          </div>
        </div>

        <div className={`card ${stats.low_stock_count > 0 ? 'card-danger' : 'card-success'}`}>
          <div className="card-title">Low Stock Items</div>
          <div className="card-value">{stats.low_stock_count}</div>
          <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: stats.low_stock_count > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>
            {stats.low_stock_count > 0 ? 'Needs attention!' : 'Stock levels healthy'}
          </div>
        </div>
      </div>

      {stats.low_stock_count > 0 ? (
        <div className="panel">
          <div className="panel-header" style={{ borderBottom: '1px solid rgba(239, 68, 68, 0.25)', backgroundColor: 'rgba(239, 68, 68, 0.02)' }}>
            <h2 className="panel-title" style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              ⚠️ Low Stock Warning (Threshold &lt; 5 units)
            </h2>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>SKU Code</th>
                  <th>Price</th>
                  <th>Stock Available</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {stats.low_stock_products.map((product) => (
                  <tr key={product.id}>
                    <td style={{ fontWeight: 600 }}>{product.name}</td>
                    <td><code>{product.sku}</code></td>
                    <td>₹{product.price.toFixed(2)}</td>
                    <td style={{ color: product.quantity === 0 ? 'var(--danger)' : 'var(--warning)', fontWeight: 700 }}>
                      {product.quantity} units
                    </td>
                    <td>
                      <span className={`badge ${product.quantity === 0 ? 'badge-danger' : 'badge-warning'}`}>
                        {product.quantity === 0 ? 'Out of Stock' : 'Low Stock'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('products')}>
                        Replenish
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>✅</div>
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.25rem' }}>All Stock Levels Healthy</h3>
          <p>No products are currently under the warning threshold of 5 units.</p>
        </div>
      )}
    </div>
  );
}

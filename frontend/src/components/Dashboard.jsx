import React from 'react';

export default function Dashboard({ stats, loading, error, onNavigate }) {
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

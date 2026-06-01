import React, { useState } from 'react';

export default function OrderList({ orders, products, customers, loading, error, onRefresh, showNotification, API_URL }) {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Create Order Wizard State
  const [customerId, setCustomerId] = useState('');
  const [orderItems, setOrderItems] = useState([{ product_id: '', quantity: 1 }]);
  const [wizardError, setWizardError] = useState('');

  const openWizard = () => {
    setCustomerId('');
    setOrderItems([{ product_id: '', quantity: 1 }]);
    setWizardError('');
    setIsWizardOpen(true);
  };

  const openDetails = (order) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
  };

  const handleAddRow = () => {
    setOrderItems([...orderItems, { product_id: '', quantity: 1 }]);
  };

  const handleRemoveRow = (index) => {
    const updated = orderItems.filter((_, i) => i !== index);
    setOrderItems(updated.length > 0 ? updated : [{ product_id: '', quantity: 1 }]);
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...orderItems];
    updated[index][field] = value;
    setOrderItems(updated);
  };

  // Helper: Find product details
  const getProduct = (id) => products.find((p) => p.id === parseInt(id));

  // Dynamic Total Calculation
  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => {
      const product = getProduct(item.product_id);
      if (!product) return sum;
      return sum + product.price * (parseInt(item.quantity) || 0);
    }, 0);
  };

  // Verify stock levels on client before submit
  const checkStockValid = () => {
    for (const item of orderItems) {
      if (!item.product_id) return { valid: false, reason: 'Please select a product for all rows.' };
      const product = getProduct(item.product_id);
      if (!product) return { valid: false, reason: 'Invalid product selected.' };
      
      const qty = parseInt(item.quantity) || 0;
      if (qty <= 0) return { valid: false, reason: 'Quantity must be at least 1.' };
      if (qty > product.quantity) {
        return { 
          valid: false, 
          reason: `Insufficient inventory for "${product.name}". Requested ${qty}, but only ${product.quantity} left in stock.` 
        };
      }
    }
    return { valid: true };
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setWizardError('');

    if (!customerId) {
      return setWizardError('Please select a customer.');
    }

    const stockCheck = checkStockValid();
    if (!stockCheck.valid) {
      return setWizardError(stockCheck.reason);
    }

    const payload = {
      customer_id: parseInt(customerId),
      items: orderItems.map((item) => ({
        product_id: parseInt(item.product_id),
        quantity: parseInt(item.quantity)
      }))
    };

    try {
      const response = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to place the order.');
      }

      showNotification(`Order #${data.id} placed successfully! Stock levels updated.`, 'success');
      setIsWizardOpen(false);
      onRefresh();
    } catch (err) {
      setWizardError(err.message);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm(
      `Are you sure you want to cancel Order #${orderId}? This will delete the order record and automatically restore product stock.`
    )) return;

    try {
      const response = await fetch(`${API_URL}/orders/${orderId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || 'Failed to cancel order.');
      }

      showNotification(`Order #${orderId} cancelled and stock replenished.`, 'success');
      onRefresh();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  if (loading && orders.length === 0) {
    return <div style={{ textAlign: 'center', padding: '3rem' }}>Loading Orders Register...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.25rem' }}>Orders Register</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Track sales history, order details, and process cancellations.</p>
        </div>
        <button className="btn btn-primary" onClick={openWizard}>
          🛒 Create New Order
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      )}

      <div className="panel">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Placement Date</th>
                <th>Items Ordered</th>
                <th>Total Value</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem 0' }}>
                    No orders registered yet. Click "Create New Order" to start selling.
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const dateStr = new Date(order.created_at).toLocaleString();
                  const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
                  return (
                    <tr key={order.id}>
                      <td style={{ fontWeight: 700 }}>#{order.id}</td>
                      <td style={{ fontWeight: 600 }}>{order.customer ? order.customer.name : 'Unknown'}</td>
                      <td>{dateStr}</td>
                      <td>
                        <span className="badge badge-info">{totalItems} {totalItems === 1 ? 'item' : 'items'}</span>
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        ₹{order.total_amount.toFixed(2)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => openDetails(order)}>
                            Details
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleCancelOrder(order.id)}>
                            Cancel Order
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {isDetailsOpen && selectedOrder && (
        <div className="modal-overlay" onClick={() => setIsDetailsOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '650px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Order details #{selectedOrder.id}</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  Customer: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{selectedOrder.customer.name}</span> ({selectedOrder.customer.email})
                </p>
              </div>
              <button 
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '1.5rem', cursor: 'pointer' }}
                onClick={() => setIsDetailsOpen(false)}
              >
                &times;
              </button>
            </div>
            
            <div className="modal-body" style={{ padding: '0' }}>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Unit Price</th>
                      <th>Quantity</th>
                      <th style={{ textAlign: 'right' }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items.map((item) => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 600 }}>{item.product.name}</td>
                        <td><code>{item.product.sku}</code></td>
                        <td>₹{item.product.price.toFixed(2)}</td>
                        <td>{item.quantity}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>
                          ₹{(item.product.price * item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.1)' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Placed on: {new Date(selectedOrder.created_at).toLocaleString()}
                </span>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Total: ₹{selectedOrder.total_amount.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setIsDetailsOpen(false)}>
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Order Wizard Modal */}
      {isWizardOpen && (
        <div className="modal-overlay" onClick={() => setIsWizardOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '650px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>🛒 Create Customer Order</h2>
              <button 
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '1.5rem', cursor: 'pointer' }}
                onClick={() => setIsWizardOpen(false)}
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSubmitOrder}>
              <div className="modal-body">
                {wizardError && (
                  <div className="alert alert-error" style={{ padding: '0.75rem 1rem', fontSize: '0.9rem', marginBottom: '1rem' }}>
                    <span>{wizardError}</span>
                  </div>
                )}

                {/* Customer Dropdown */}
                <div className="form-group">
                  <label className="form-label">Select Customer</label>
                  {customers.length === 0 ? (
                    <div style={{ fontSize: '0.9rem', color: 'var(--warning)', marginTop: '0.25rem' }}>
                      ⚠️ No customers in database. Please add a customer first.
                    </div>
                  ) : (
                    <select
                      className="form-control"
                      value={customerId}
                      onChange={(e) => setCustomerId(e.target.value)}
                      required
                    >
                      <option value="">-- Choose Customer --</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.email})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Items Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label className="form-label" style={{ marginBottom: '0' }}>Order Items</label>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleAddRow}
                    disabled={products.length === 0}
                  >
                    ➕ Add Product Row
                  </button>
                </div>

                {products.length === 0 ? (
                  <div style={{ padding: '1rem', textAlign: 'center', backgroundColor: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239,68,68,0.1)', borderRadius: '6px', color: 'var(--danger)', fontSize: '0.9rem' }}>
                    ⚠️ No products available in catalog. Please add a product first.
                  </div>
                ) : (
                  <div className="wizard-items-list">
                    {orderItems.map((item, index) => {
                      const product = getProduct(item.product_id);
                      return (
                        <div className="wizard-item-row" key={index}>
                          <select
                            className="form-control"
                            value={item.product_id}
                            onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
                            required
                          >
                            <option value="">-- Select Product --</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} - ₹{p.price.toFixed(2)} (Stock: {p.quantity})
                              </option>
                            ))}
                          </select>

                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <input
                              type="number"
                              min="1"
                              className="form-control"
                              placeholder="Qty"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                              required
                            />
                          </div>

                          <div style={{ textAlign: 'right', fontWeight: 600, fontSize: '0.95rem', minWidth: '70px' }}>
                            ₹{product ? (product.price * (item.quantity || 0)).toFixed(2) : '0.00'}
                          </div>

                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            style={{ padding: '0.45rem', borderRadius: '4px' }}
                            onClick={() => handleRemoveRow(index)}
                          >
                            🗑️
                          </button>

                          {/* Show real-time stock validations */}
                          {product && item.quantity > product.quantity && (
                            <div style={{ gridColumn: 'span 4', color: 'var(--danger)', fontSize: '0.8rem', marginTop: '-0.25rem', fontWeight: 600 }}>
                              ⚠️ Insufficient stock. Only {product.quantity} units available.
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Subtotal Display */}
                <div className="wizard-total">
                  <span style={{ color: 'var(--text-secondary)' }}>Calculated Total:</span>
                  <span style={{ fontSize: '1.4rem', color: 'var(--text-primary)' }}>₹{calculateTotal().toFixed(2)}</span>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsWizardOpen(false)}>
                  Close
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={customers.length === 0 || products.length === 0}
                >
                  Confirm Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

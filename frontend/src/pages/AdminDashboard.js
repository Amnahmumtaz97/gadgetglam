import React, { useEffect, useState } from 'react';
import axios from 'axios';
import SEOHead from '../components/common/SEOHead';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const CATEGORIES = ['Cases', 'Chargers', 'Cables', 'Earphones', 'Screen Guards', 'Bundles', 'Other'];
const ORDER_STATUSES = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
const PAYMENT_STATUSES = ['Unpaid', 'Paid', 'Refunded'];
const AFFY_PLATFORMS = ['AliExpress', 'Daraz', 'Amazon', 'Other'];

const BLANK_PRODUCT = {
  name: '', description: '', short_description: '', price: '', compare_price: '',
  brand: '', category: 'Cases', stock_status: 'In Stock', is_featured: false,
  thumbnail: '', images: '', affiliate_link: '', affiliate_platform: 'Daraz',
  device_compatibility: '', tags: '',
  seo_meta_title: '', seo_meta_description: '', seo_meta_keywords: '', seo_canonical_url: '', seo_og_image: '',
};

export default function AdminDashboard() {
  const [tab, setTab]             = useState('overview');
  const [stats, setStats]         = useState(null);
  const [products, setProducts]   = useState([]);
  const [orders, setOrders]       = useState([]);
  const [users, setUsers]         = useState([]);
  const [reviews, setReviews]     = useState([]);
  const [loading, setLoading]     = useState(true);

  // Product form state
  const [showProdForm, setShowProdForm] = useState(false);
  const [editProduct, setEditProduct]   = useState(null);
  const [prodForm, setProdForm]         = useState(BLANK_PRODUCT);
  const [savingProd, setSavingProd]     = useState(false);

  // Order inline-edit state
  const [editOrderId, setEditOrderId]     = useState(null);
  const [editOrderData, setEditOrderData] = useState({});

  useEffect(() => { loadAll(); }, []);

  const loadAll = () => {
    setLoading(true);
    Promise.all([
      axios.get('/api/admin/stats').catch(() => ({ data: {} })),
      axios.get('/api/admin/products?limit=50').catch(() => ({ data: { products: [] } })),
      axios.get('/api/admin/orders?limit=50').catch(() => ({ data: { orders: [] } })),
      axios.get('/api/admin/users?limit=50').catch(() => ({ data: { users: [] } })),
      axios.get('/api/admin/reviews?limit=50').catch(() => ({ data: { reviews: [] } })),
    ]).then(([s, p, o, u, r]) => {
      setStats(s.data.stats || s.data);
      setProducts(p.data.products || []);
      setOrders(o.data.orders || []);
      setUsers(u.data.users || []);
      setReviews(r.data.reviews || []);
    }).finally(() => setLoading(false));
  };

  // ── Product handlers ─────────────────────────────────────
  const openAddProduct = () => {
    setEditProduct(null);
    setProdForm(BLANK_PRODUCT);
    setShowProdForm(true);
  };

  const openEditProduct = (p) => {
    setEditProduct(p);
    setProdForm({
      name: p.name || '',
      description: p.description || '',
      short_description: p.short_description || '',
      price: p.price || '',
      compare_price: p.compare_price || '',
      brand: p.brand || '',
      category: p.category || 'Cases',
      stock_status: p.stock_status || 'In Stock',
      is_featured: p.is_featured || false,
      thumbnail: p.thumbnail || '',
      images: (p.images || []).join(', '),
      affiliate_link: p.affiliate_link || '',
      affiliate_platform: p.affiliate_platform || 'Daraz',
      device_compatibility: (p.device_compatibility || []).join(', '),
      tags: (p.tags || []).join(', '),
      seo_meta_title: p.seo?.meta_title || '',
      seo_meta_description: p.seo?.meta_description || '',
      seo_meta_keywords: (p.seo?.meta_keywords || []).join(', '),
      seo_canonical_url: p.seo?.canonical_url || '',
      seo_og_image: p.seo?.og_image || '',
    });
    setShowProdForm(true);
  };

  const saveProd = async (e) => {
    e.preventDefault();
    setSavingProd(true);
    try {
      const { seo_meta_title, seo_meta_description, seo_meta_keywords, seo_canonical_url, seo_og_image, ...rest } = prodForm;
      const payload = {
        ...rest,
        price: Number(rest.price),
        compare_price: rest.compare_price ? Number(rest.compare_price) : undefined,
        images: rest.images ? rest.images.split(',').map(s => s.trim()).filter(Boolean) : [],
        device_compatibility: rest.device_compatibility ? rest.device_compatibility.split(',').map(s => s.trim()).filter(Boolean) : [],
        tags: rest.tags ? rest.tags.split(',').map(s => s.trim()).filter(Boolean) : [],
        seo: {
          meta_title: seo_meta_title,
          meta_description: seo_meta_description,
          meta_keywords: seo_meta_keywords ? seo_meta_keywords.split(',').map(s => s.trim()).filter(Boolean) : [],
          canonical_url: seo_canonical_url,
          og_image: seo_og_image,
        }
      };
      if (editProduct) {
        const { data } = await axios.put(`/api/admin/products/${editProduct._id}`, payload);
        setProducts(ps => ps.map(p => p._id === editProduct._id ? data.product : p));
        toast.success('Product updated');
      } else {
        const { data } = await axios.post('/api/admin/products', payload);
        setProducts(ps => [data.product, ...ps]);
        toast.success('Product created');
      }
      setShowProdForm(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSavingProd(false);
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Deactivate this product?')) return;
    try {
      await axios.delete(`/api/admin/products/${id}`);
      setProducts(ps => ps.filter(p => p._id !== id));
      toast.success('Product deactivated');
    } catch { toast.error('Delete failed'); }
  };

  // ── Order handlers ────────────────────────────────────────
  const startEditOrder = (order) => {
    setEditOrderId(order._id);
    setEditOrderData({ order_status: order.order_status, payment_status: order.payment_status, tracking_number: order.tracking_number || '' });
  };

  const saveOrder = async (id) => {
    try {
      const { data } = await axios.put(`/api/admin/orders/${id}`, editOrderData);
      setOrders(os => os.map(o => o._id === id ? data.order : o));
      setEditOrderId(null);
      toast.success('Order updated');
    } catch { toast.error('Update failed'); }
  };

  const deleteOrder = async (id) => {
    if (!window.confirm('Delete this order permanently?')) return;
    try {
      await axios.delete(`/api/admin/orders/${id}`);
      setOrders(os => os.filter(o => o._id !== id));
      toast.success('Order deleted');
    } catch { toast.error('Delete failed'); }
  };

  // ── User handlers ─────────────────────────────────────────
  const toggleUserRole = async (user) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    try {
      const { data } = await axios.put(`/api/admin/users/${user._id}`, { role: newRole });
      setUsers(us => us.map(u => u._id === user._id ? data.user : u));
      toast.success(`Role changed to ${newRole}`);
    } catch { toast.error('Update failed'); }
  };

  const toggleUserActive = async (user) => {
    try {
      const { data } = await axios.put(`/api/admin/users/${user._id}`, { is_active: !user.is_active });
      setUsers(us => us.map(u => u._id === user._id ? data.user : u));
      toast.success(data.user.is_active ? 'User activated' : 'User deactivated');
    } catch { toast.error('Update failed'); }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Delete this user permanently?')) return;
    try {
      await axios.delete(`/api/admin/users/${id}`);
      setUsers(us => us.filter(u => u._id !== id));
      toast.success('User deleted');
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  // ── Review handlers ───────────────────────────────────────
  const deleteReview = async (id) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      await axios.delete(`/api/admin/reviews/${id}`);
      setReviews(rs => rs.filter(r => r._id !== id));
      toast.success('Review deleted');
    } catch { toast.error('Delete failed'); }
  };

  const tabStyle = (t) => ({
    padding: '10px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer',
    fontWeight: '700', fontSize: '14px',
    background: tab === t ? 'var(--purple)' : 'var(--gray-100)',
    color: tab === t ? '#fff' : 'var(--gray-700)',
  });

  return (
    <>
      <SEOHead title="Admin Dashboard | GadgetGlam" description="Manage your GadgetGlam store." />
      <div className="container" style={{ padding: '40px 0 80px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', marginBottom: '8px' }}>Admin Dashboard</h1>
        <p style={{ color: 'var(--gray-500)', marginBottom: '28px', fontSize: '14px' }}>Manage your store</p>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '32px', flexWrap: 'wrap' }}>
          {['overview', 'products', 'orders', 'users', 'reviews'].map(t => (
            <button key={t} style={tabStyle(t)} onClick={() => { setTab(t); setShowProdForm(false); setEditOrderId(null); }}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {loading ? <div className="spinner" /> : (
          <>
            {tab === 'overview' && <OverviewTab stats={stats} products={products} />}
            {tab === 'products' && (
              <ProductsTab
                products={products}
                showProdForm={showProdForm}
                editProduct={editProduct}
                prodForm={prodForm}
                setProdForm={setProdForm}
                savingProd={savingProd}
                onAdd={openAddProduct}
                onEdit={openEditProduct}
                onDelete={deleteProduct}
                onSave={saveProd}
                onCancel={() => setShowProdForm(false)}
              />
            )}
            {tab === 'orders' && (
              <OrdersTab
                orders={orders}
                editOrderId={editOrderId}
                editOrderData={editOrderData}
                setEditOrderData={setEditOrderData}
                onStartEdit={startEditOrder}
                onSave={saveOrder}
                onCancel={() => setEditOrderId(null)}
                onDelete={deleteOrder}
              />
            )}
            {tab === 'users' && (
              <UsersTab
                users={users}
                onToggleRole={toggleUserRole}
                onToggleActive={toggleUserActive}
                onDelete={deleteUser}
              />
            )}
            {tab === 'reviews' && (
              <ReviewsTab reviews={reviews} onDelete={deleteReview} />
            )}
          </>
        )}
      </div>
    </>
  );
}

// ── Overview tab ─────────────────────────────────────────
function OverviewTab({ stats, products }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '20px' }}>
      {[
        { label: 'Total Products', value: stats?.totalProducts ?? products.length, icon: '📦' },
        { label: 'Total Orders',   value: stats?.totalOrders   ?? '—', icon: '🧾' },
        { label: 'Total Users',    value: stats?.totalUsers    ?? '—', icon: '👥' },
        { label: 'Total Reviews',  value: stats?.totalReviews  ?? '—', icon: '⭐' },
        { label: 'Total Revenue',  value: stats?.totalRevenue  ? `PKR ${Number(stats.totalRevenue).toLocaleString()}` : '—', icon: '💰' },
      ].map(card => (
        <div key={card.label} style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1.5px solid var(--gray-200)', boxShadow: '0 2px 12px rgba(124,58,237,.06)' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>{card.icon}</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: '800', color: 'var(--purple)' }}>{card.value}</div>
          <div style={{ color: 'var(--gray-500)', fontSize: '13px', marginTop: '4px' }}>{card.label}</div>
        </div>
      ))}
    </div>
  );
}

// ── Products tab ─────────────────────────────────────────
function ProductsTab({ products, showProdForm, editProduct, prodForm, setProdForm, savingProd, onAdd, onEdit, onDelete, onSave, onCancel }) {
  const f = (field) => (e) => setProdForm(p => ({ ...p, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px' }}>Products ({products.length})</h2>
        {!showProdForm && <button onClick={onAdd} style={btnStyle('var(--purple)')}>+ Add Product</button>}
      </div>

      {showProdForm && (
        <div style={{ background: '#fff', border: '1.5px solid var(--gray-200)', borderRadius: '16px', padding: '28px', marginBottom: '28px' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', marginBottom: '20px' }}>
            {editProduct ? 'Edit Product' : 'Add New Product'}
          </h3>
          <form onSubmit={onSave}>
            <div style={gridForm}>
              <FormField label="Name *" colSpan={2}><input style={inputStyle} value={prodForm.name} onChange={f('name')} required /></FormField>
              <FormField label="Price (PKR) *"><input style={inputStyle} type="number" min="0" value={prodForm.price} onChange={f('price')} required /></FormField>
              <FormField label="Compare Price"><input style={inputStyle} type="number" min="0" value={prodForm.compare_price} onChange={f('compare_price')} /></FormField>
              <FormField label="Brand"><input style={inputStyle} value={prodForm.brand} onChange={f('brand')} /></FormField>
              <FormField label="Category *">
                <select style={inputStyle} value={prodForm.category} onChange={f('category')}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </FormField>
              <FormField label="Stock Status">
                <select style={inputStyle} value={prodForm.stock_status} onChange={f('stock_status')}>
                  {['In Stock', 'Out of Stock', 'Limited'].map(s => <option key={s}>{s}</option>)}
                </select>
              </FormField>
              <FormField label="Affiliate Platform">
                <select style={inputStyle} value={prodForm.affiliate_platform} onChange={f('affiliate_platform')}>
                  {AFFY_PLATFORMS.map(p => <option key={p}>{p}</option>)}
                </select>
              </FormField>
              <FormField label="Affiliate Link *" colSpan={2}><input style={inputStyle} value={prodForm.affiliate_link} onChange={f('affiliate_link')} required /></FormField>
              <FormField label="Thumbnail URL" colSpan={2}><input style={inputStyle} value={prodForm.thumbnail} onChange={f('thumbnail')} placeholder="https://..." /></FormField>
              <FormField label="Images (comma-separated URLs)" colSpan={2}><input style={inputStyle} value={prodForm.images} onChange={f('images')} placeholder="https://img1.jpg, https://img2.jpg" /></FormField>
              <FormField label="Device Compatibility (comma-sep)" colSpan={2}><input style={inputStyle} value={prodForm.device_compatibility} onChange={f('device_compatibility')} placeholder="iPhone 15 Pro, Samsung Galaxy S24" /></FormField>
              <FormField label="Tags (comma-sep)" colSpan={2}><input style={inputStyle} value={prodForm.tags} onChange={f('tags')} placeholder="leather, wallet, iphone" /></FormField>
              <FormField label="Short Description" colSpan={2}><textarea style={{ ...inputStyle, height: '70px', resize: 'vertical' }} value={prodForm.short_description} onChange={f('short_description')} /></FormField>
              <FormField label="Description *" colSpan={2}><textarea style={{ ...inputStyle, height: '100px', resize: 'vertical' }} value={prodForm.description} onChange={f('description')} required /></FormField>
              
              {/* SEO Fields */}
              <div style={{ gridColumn: 'span 2', borderTop: '2px solid var(--gray-200)', paddingTop: '16px', marginTop: '16px' }}>
                <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--gray-700)', marginBottom: '12px' }}>📊 SEO Settings</div>
              </div>
              <FormField label="Meta Title (70 chars)" colSpan={2}><input style={inputStyle} value={prodForm.seo_meta_title} onChange={f('seo_meta_title')} placeholder={`${prodForm.name} | GadgetGlam`} maxLength="70" /></FormField>
              <FormField label="Meta Description (160 chars)" colSpan={2}><textarea style={{ ...inputStyle, height: '60px', resize: 'vertical' }} value={prodForm.seo_meta_description} onChange={f('seo_meta_description')} placeholder="Describe the product for search engines..." maxLength="160" /></FormField>
              <FormField label="Meta Keywords (comma-sep)" colSpan={2}><input style={inputStyle} value={prodForm.seo_meta_keywords} onChange={f('seo_meta_keywords')} placeholder="keyword1, keyword2, keyword3" /></FormField>
              <FormField label="Canonical URL" colSpan={2}><input style={inputStyle} value={prodForm.seo_canonical_url} onChange={f('seo_canonical_url')} placeholder="https://gadgetglam.pk/products/..." /></FormField>
              <FormField label="OG Image URL" colSpan={2}><input style={inputStyle} value={prodForm.seo_og_image} onChange={f('seo_og_image')} placeholder="https://..." /></FormField>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', margin: '12px 0 20px', cursor: 'pointer' }}>
              <input type="checkbox" checked={prodForm.is_featured} onChange={f('is_featured')} /> Featured Product
            </label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="submit" disabled={savingProd} style={btnStyle('var(--purple)')}>{savingProd ? 'Saving…' : (editProduct ? 'Update Product' : 'Create Product')}</button>
              <button type="button" onClick={onCancel} style={btnStyle('#9ca3af')}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div style={tableWrap}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={theadRow}>
              <th style={thStyle}>Product</th>
              <th style={thStyle}>Category</th>
              <th style={thStyle}>Price</th>
              <th style={thStyle}>Stock</th>
              <th style={thStyle}>Featured</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p._id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={thumbBox}>
                      {p.thumbnail ? <img src={p.thumbnail} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} /> : '📱'}
                    </div>
                    <span style={{ fontWeight: '600', fontSize: '13px' }}>{p.name}</span>
                  </div>
                </td>
                <td style={tdStyle}><span style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{p.category}</span></td>
                <td style={tdStyle}><strong style={{ color: 'var(--purple)', fontFamily: 'var(--font-display)' }}>PKR {p.price?.toLocaleString()}</strong></td>
                <td style={tdStyle}><span style={{ fontSize: '13px' }}>{p.stock_status}</span></td>
                <td style={tdStyle}>{p.is_featured ? '✅' : '—'}</td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => onEdit(p)} style={actionBtn('var(--purple)')}>Edit</button>
                    <Link to={`/products/${p.slug}`} style={{ fontSize: '12px', color: 'var(--gray-600)', fontWeight: '600', textDecoration: 'none' }}>View</Link>
                    <button onClick={() => onDelete(p._id)} style={actionBtn('#e53e3e')}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 && <EmptyRow cols={6} message="No products found. Seed the database to add products." />}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Orders tab ───────────────────────────────────────────
function OrdersTab({ orders, editOrderId, editOrderData, setEditOrderData, onStartEdit, onSave, onCancel, onDelete }) {
  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', marginBottom: '20px' }}>Orders ({orders.length})</h2>
      <div style={{ ...tableWrap, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
          <thead>
            <tr style={theadRow}>
              <th style={thStyle}>Order ID</th>
              <th style={thStyle}>Customer</th>
              <th style={thStyle}>Amount</th>
              <th style={thStyle}>Order Status</th>
              <th style={thStyle}>Payment</th>
              <th style={thStyle}>Tracking</th>
              <th style={thStyle}>Date</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr key={o._id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                <td style={tdStyle}><code style={{ fontSize: '11px', color: 'var(--gray-500)' }}>#{o._id.slice(-8)}</code></td>
                <td style={tdStyle}>
                  <div style={{ fontSize: '13px' }}>
                    <div style={{ fontWeight: '600' }}>{o.user_id?.first_name} {o.user_id?.last_name}</div>
                    <div style={{ color: 'var(--gray-500)', fontSize: '12px' }}>{o.user_id?.email}</div>
                  </div>
                </td>
                <td style={tdStyle}><strong style={{ color: 'var(--purple)' }}>PKR {o.total_price?.toLocaleString()}</strong></td>
                <td style={tdStyle}>
                  {editOrderId === o._id
                    ? <select style={{ ...inputStyle, padding: '4px 8px', fontSize: '12px' }} value={editOrderData.order_status} onChange={e => setEditOrderData(d => ({ ...d, order_status: e.target.value }))}>
                        {ORDER_STATUSES.map(s => <option key={s}>{s}</option>)}
                      </select>
                    : <StatusBadge status={o.order_status} />}
                </td>
                <td style={tdStyle}>
                  {editOrderId === o._id
                    ? <select style={{ ...inputStyle, padding: '4px 8px', fontSize: '12px' }} value={editOrderData.payment_status} onChange={e => setEditOrderData(d => ({ ...d, payment_status: e.target.value }))}>
                        {PAYMENT_STATUSES.map(s => <option key={s}>{s}</option>)}
                      </select>
                    : <PaymentBadge status={o.payment_status} />}
                </td>
                <td style={tdStyle}>
                  {editOrderId === o._id
                    ? <input style={{ ...inputStyle, padding: '4px 8px', fontSize: '12px', width: '120px' }} value={editOrderData.tracking_number} onChange={e => setEditOrderData(d => ({ ...d, tracking_number: e.target.value }))} placeholder="Tracking #" />
                    : <span style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{o.tracking_number || '—'}</span>}
                </td>
                <td style={tdStyle}><span style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{new Date(o.createdAt).toLocaleDateString()}</span></td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {editOrderId === o._id ? (
                      <>
                        <button onClick={() => onSave(o._id)} style={actionBtn('#38a169')}>Save</button>
                        <button onClick={onCancel} style={actionBtn('#9ca3af')}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => onStartEdit(o)} style={actionBtn('var(--purple)')}>Edit</button>
                        <button onClick={() => onDelete(o._id)} style={actionBtn('#e53e3e')}>Delete</button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {orders.length === 0 && <EmptyRow cols={8} message="No orders found." />}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Users tab ────────────────────────────────────────────
function UsersTab({ users, onToggleRole, onToggleActive, onDelete }) {
  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', marginBottom: '20px' }}>Users ({users.length})</h2>
      <div style={tableWrap}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={theadRow}>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Role</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Joined</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u._id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                <td style={tdStyle}><span style={{ fontWeight: '600', fontSize: '13px' }}>{u.first_name} {u.last_name}</span></td>
                <td style={tdStyle}><span style={{ fontSize: '13px', color: 'var(--gray-600)' }}>{u.email}</span></td>
                <td style={tdStyle}>
                  <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: u.role === 'admin' ? 'rgba(124,58,237,.1)' : 'var(--gray-100)', color: u.role === 'admin' ? 'var(--purple)' : 'var(--gray-600)' }}>
                    {u.role}
                  </span>
                </td>
                <td style={tdStyle}>
                  <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: u.is_active ? 'rgba(56,161,105,.1)' : 'rgba(229,62,62,.1)', color: u.is_active ? '#38a169' : '#e53e3e' }}>
                    {u.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={tdStyle}><span style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{new Date(u.createdAt).toLocaleDateString()}</span></td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <button onClick={() => onToggleRole(u)} style={actionBtn('var(--purple)')}>{u.role === 'admin' ? 'Make User' : 'Make Admin'}</button>
                    <button onClick={() => onToggleActive(u)} style={actionBtn(u.is_active ? '#d69e2e' : '#38a169')}>{u.is_active ? 'Deactivate' : 'Activate'}</button>
                    <button onClick={() => onDelete(u._id)} style={actionBtn('#e53e3e')}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && <EmptyRow cols={6} message="No users found." />}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Reviews tab ──────────────────────────────────────────
function ReviewsTab({ reviews, onDelete }) {
  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', marginBottom: '20px' }}>Reviews ({reviews.length})</h2>
      <div style={tableWrap}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={theadRow}>
              <th style={thStyle}>Product</th>
              <th style={thStyle}>User</th>
              <th style={thStyle}>Rating</th>
              <th style={thStyle}>Review</th>
              <th style={thStyle}>Date</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map(r => (
              <tr key={r._id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                <td style={tdStyle}>
                  {r.product_id
                    ? <Link to={`/products/${r.product_id.slug}`} style={{ fontSize: '13px', color: 'var(--purple)', fontWeight: '600', textDecoration: 'none' }}>
                        {r.product_id.name?.slice(0, 30)}{r.product_id.name?.length > 30 ? '…' : ''}
                      </Link>
                    : <span style={{ color: 'var(--gray-400)', fontSize: '13px' }}>—</span>}
                </td>
                <td style={tdStyle}><span style={{ fontSize: '13px' }}>{r.user_id?.first_name} {r.user_id?.last_name}</span></td>
                <td style={tdStyle}><span style={{ fontSize: '13px', color: '#d69e2e', fontWeight: '700' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span></td>
                <td style={tdStyle}><span style={{ fontSize: '12px', color: 'var(--gray-600)' }}>{r.review_text?.slice(0, 60)}{r.review_text?.length > 60 ? '…' : ''}</span></td>
                <td style={tdStyle}><span style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{new Date(r.createdAt).toLocaleDateString()}</span></td>
                <td style={tdStyle}><button onClick={() => onDelete(r._id)} style={actionBtn('#e53e3e')}>Delete</button></td>
              </tr>
            ))}
            {reviews.length === 0 && <EmptyRow cols={6} message="No reviews found." />}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Shared helpers ───────────────────────────────────────
function FormField({ label, children, colSpan = 1 }) {
  return (
    <div style={{ gridColumn: `span ${colSpan}` }}>
      <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--gray-600)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
      {children}
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = { Pending: '#d69e2e', Processing: 'var(--purple)', Shipped: '#3182ce', Delivered: '#38a169', Cancelled: '#e53e3e' };
  return <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: `${colors[status] || '#888'}22`, color: colors[status] || '#888' }}>{status}</span>;
}

function PaymentBadge({ status }) {
  const colors = { Unpaid: '#e53e3e', Paid: '#38a169', Refunded: '#d69e2e' };
  return <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: `${colors[status] || '#888'}22`, color: colors[status] || '#888' }}>{status}</span>;
}

function EmptyRow({ cols, message }) {
  return <tr><td colSpan={cols} style={{ textAlign: 'center', padding: '40px', color: 'var(--gray-400)', fontSize: '14px' }}>{message}</td></tr>;
}

// ── Shared styles ────────────────────────────────────────
const thStyle  = { padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: 'var(--gray-600)', textTransform: 'uppercase', letterSpacing: '0.5px' };
const tdStyle  = { padding: '12px 16px', fontSize: '13px', verticalAlign: 'middle' };
const tableWrap = { background: '#fff', borderRadius: '16px', border: '1.5px solid var(--gray-200)', overflow: 'hidden' };
const theadRow  = { borderBottom: '1.5px solid var(--gray-200)', background: 'var(--gray-50)' };
const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid var(--gray-200)', fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };
const gridForm   = { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' };
const thumbBox   = { width: '40px', height: '40px', borderRadius: '8px', background: 'var(--purple-faint)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 };
const btnStyle   = (bg) => ({ background: bg, color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 20px', fontWeight: '700', fontSize: '14px', cursor: 'pointer' });
const actionBtn  = (color) => ({ fontSize: '12px', color, background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600', padding: 0 });

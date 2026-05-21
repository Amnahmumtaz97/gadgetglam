import React from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';

function Row({ label, children }) {
  return (
    <div className="flex flex-wrap justify-between gap-2 border-b border-theme py-3 text-sm last:border-0">
      <span className="font-semibold text-theme-muted">{label}</span>
      <span className="max-w-[65%] text-right font-medium text-theme">{children}</span>
    </div>
  );
}

export default function AdminDetailModal({ open, title, subtitle, onClose, children, footer }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-3xl border border-theme bg-theme-panel shadow-[var(--shadow-lg)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between border-b border-theme px-6 py-4">
          <div>
            <h3 className="text-xl font-black text-theme">{title}</h3>
            {subtitle ? <p className="mt-1 text-sm text-theme-muted">{subtitle}</p> : null}
          </div>
          <button type="button" onClick={onClose} className="nav-icon-btn grid h-10 w-10 place-items-center rounded-xl" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="max-h-[calc(90vh-140px)] overflow-y-auto px-6 py-4 scrollbar-thin">{children}</div>
        {footer ? <div className="flex flex-wrap gap-2 border-t border-theme px-6 py-4">{footer}</div> : null}
      </div>
    </div>
  );
}

export function AdminProductDetail({ product }) {
  if (!product) return <p className="text-theme-muted">Loading…</p>;
  const images = product.images || [];
  return (
    <div className="space-y-4">
      {product.thumbnail && (
        <img src={product.thumbnail} alt={product.name} className="mx-auto h-40 rounded-2xl object-cover" />
      )}
      <Row label="Name">{product.name}</Row>
      <Row label="Slug"><code className="text-xs">{product.slug}</code></Row>
      <Row label="Category">{product.category}</Row>
      <Row label="Brand">{product.brand || '—'}</Row>
      <Row label="Price">PKR {Number(product.price || 0).toLocaleString()}</Row>
      <Row label="Stock">{product.stock_status}{product.stock !== undefined ? ` — ${product.stock}` : ''}</Row>
      <Row label="Status">{product.is_draft ? 'Draft' : 'Published'}{!product.is_active ? ' (inactive)' : ''}</Row>
      <Row label="Featured">{product.is_featured ? 'Yes' : 'No'}</Row>
      {product.short_description && (
        <div className="rounded-2xl border border-theme bg-[var(--surface-2)] p-4 text-sm text-theme-secondary">{product.short_description}</div>
      )}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.slice(0, 4).map((url) => (
            <img key={url} src={url} alt="" className="h-16 w-16 rounded-xl object-cover" />
          ))}
        </div>
      )}
    </div>
  );
}

export function AdminOrderDetail({ order }) {
  if (!order) return <p className="text-theme-muted">Loading…</p>;
  return (
    <div className="space-y-4">
      <Row label="Order ID"><code>#{order._id?.slice(-8)}</code></Row>
      <Row label="Customer">{order.user_id?.first_name} {order.user_id?.last_name} ({order.user_id?.email})</Row>
      <Row label="Total">PKR {Number(order.total_price || 0).toLocaleString()}</Row>
      <Row label="Order status">{order.order_status}</Row>
      <Row label="Payment">{order.payment_status} · {order.payment_method}</Row>
      <Row label="Tracking">{order.tracking_number || '—'}</Row>
      <Row label="Placed">{order.createdAt ? new Date(order.createdAt).toLocaleString() : '—'}</Row>
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-theme-muted">Items</p>
        <ul className="space-y-2">
          {(order.products || []).map((item, i) => (
            <li key={i} className="rounded-xl border border-theme bg-[var(--surface-2)] px-3 py-2 text-sm text-theme">
              {item.name} × {item.quantity} — PKR {Number((item.price || 0) * (item.quantity || 1)).toLocaleString()}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function AdminUserDetail({ user }) {
  if (!user) return <p className="text-theme-muted">Loading…</p>;
  const addr = user.shipping_address || {};
  return (
    <div className="space-y-1">
      <Row label="Name">{user.first_name} {user.last_name}</Row>
      <Row label="Email">{user.email}</Row>
      <Row label="Role">{user.role}</Row>
      <Row label="Account">{user.is_active ? 'Active' : 'Inactive'}</Row>
      <Row label="Wishlist items">{user.wishlist?.length ?? 0}</Row>
      <Row label="Joined">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</Row>
      {(addr.street || addr.city) && (
        <Row label="Address">{[addr.street, addr.city, addr.zip].filter(Boolean).join(', ')}</Row>
      )}
    </div>
  );
}

export function AdminReviewDetail({ review }) {
  if (!review) return <p className="text-theme-muted">Loading…</p>;
  return (
    <div className="space-y-4">
      <Row label="Product">
        {review.product_id?.slug ? (
          <Link to={`/products/${review.product_id.slug}`} className="text-accent hover:underline">{review.product_id.name}</Link>
        ) : (review.product_id?.name || '—')}
      </Row>
      <Row label="User">{review.user_id?.first_name} {review.user_id?.last_name}</Row>
      <Row label="Rating">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</Row>
      <Row label="Verified">{review.is_verified ? 'Yes' : 'No'}</Row>
      {review.title && <Row label="Title">{review.title}</Row>}
      <div className="rounded-2xl border border-theme bg-[var(--surface-2)] p-4 text-sm leading-relaxed text-theme">{review.review_text}</div>
    </div>
  );
}

export function AdminModalFooterLink({ to, children }) {
  return (
    <Link to={to} className="btn-gradient rounded-xl px-4 py-2 text-sm font-semibold">
      {children}
    </Link>
  );
}

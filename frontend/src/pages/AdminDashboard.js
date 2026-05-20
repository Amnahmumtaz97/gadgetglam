import React, { useEffect, useState } from 'react';
import axios from 'axios';
import SEOHead from '../components/common/SEOHead';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BarChart3, BrainCircuit, ChevronRight, Download, FileDown, LayoutDashboard, Package, RefreshCw, ShoppingCart, Sparkles, Star, TrendingUp, Users } from 'lucide-react';
import AdminDetailModal, {
  AdminModalFooterLink,
  AdminOrderDetail,
  AdminProductDetail,
  AdminReviewDetail,
  AdminUserDetail,
} from '../components/admin/AdminDetailModal';
import SelectMenu from '../components/ui/SelectMenu';

import { PRODUCT_CATEGORIES } from '../lib/categories';

const CATEGORIES = [...PRODUCT_CATEGORIES, 'Other'];
const ORDER_STATUSES = ['Pending', 'Confirmed', 'Dispatched', 'Delivered', 'Cancelled'];
const PAYMENT_STATUSES = ['Unpaid', 'Paid', 'Refunded'];
const AFFY_PLATFORMS = ['AliExpress', 'Daraz', 'Amazon', 'Other'];
const STOCK_STATUSES = ['In Stock', 'Limited', 'Out of Stock'];
const CHART_COLORS = ['var(--accent-yellow)', 'var(--accent-gold)', '#F59E0B', 'var(--accent-yellow)', '#22C55E', '#60A5FA', '#F43F5E'];
const ADMIN_SECTIONS = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'products', label: 'Products', icon: Package },
  { key: 'orders', label: 'Orders', icon: ShoppingCart },
  { key: 'users', label: 'Users', icon: Users },
  { key: 'reviews', label: 'Reviews', icon: Star },
];
const ANALYTICS_SECTIONS = [
  { key: 'summary', label: 'Summary' },
  { key: 'revenue', label: 'Revenue' },
  { key: 'products', label: 'Products' },
  { key: 'stock', label: 'Stock' },
  { key: 'customers', label: 'Customers' },
  { key: 'trends', label: 'Trends' },
];

const formatPKR = (value = 0) => `PKR ${Number(value || 0).toLocaleString()}`;
const compactNumber = (value = 0) => Number(value || 0).toLocaleString();
const percentText = (value = 0) => `${Number(value || 0).toFixed(Number.isInteger(Number(value || 0)) ? 0 : 1)}%`;

const BLANK_PRODUCT = {
  name: '', description: '', short_description: '', price: '', compare_price: '',
  brand: '', category: 'Cases', stock_status: 'In Stock', is_featured: false,
  is_draft: true,
  thumbnail: '', images: '', affiliate_link: '', affiliate_platform: 'Daraz',
  device_compatibility: '', tags: '',
  seo_meta_title: '', seo_meta_description: '', seo_meta_keywords: '', seo_canonical_url: '', seo_og_image: '',
  is_deal: false,
  deal_ends_at: '',
  deal_stock_total: '',
  deal_stock_remaining: '',
  deal_sort_order: '0',
};

const CATEGORY_IMAGE_BANK = {
  Cases: [
    'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1556656793-08538906a9f8?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1512054502232-10a0a035d672?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?auto=format&fit=crop&w=1200&q=80',
  ],
  Chargers: [
    'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?auto=format&fit=crop&w=1200&q=80',
  ],
  Cables: [
    'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1517336714739-489689fd1ca8?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80',
  ],
  Earphones: [
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?auto=format&fit=crop&w=1200&q=80',
  ],
  'Screen Guards': [
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1556656793-08538906a9f8?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?auto=format&fit=crop&w=1200&q=80',
  ],
  Bundles: [
    'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80',
  ],
  Other: [
    'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1556656793-08538906a9f8?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80',
  ],
};

const buildTitleImageQuery = (title = '', category = 'Other') => {
  const cleanTitle = String(title || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 6)
    .join(',');

  if (cleanTitle) return `${cleanTitle},mobile accessory,product photography`;
  return `${String(category || 'mobile accessory').toLowerCase()},mobile accessory,product photography`;
};

const makeDefaultProductImages = (title = '', category = 'Cases') => {
  const query = buildTitleImageQuery(title, category);
  if (query) {
    const base = `https://source.unsplash.com/1200x900/?${encodeURIComponent(query)}`;
    const thumb = `${base}&sig=1`;
    const gallery = [`${base}&sig=2`, `${base}&sig=3`, `${base}&sig=4`];
    return { thumbnail: thumb, images: gallery.join(', ') };
  }

  const bank = CATEGORY_IMAGE_BANK[category] || CATEGORY_IMAGE_BANK.Other;
  const seed = Date.now();
  const len = bank.length;
  const start = seed % len;
  const thumb = bank[start];
  const gallery = [
    bank[(start + 1) % len],
    bank[(start + 2) % len],
    bank[(start + 3) % len],
  ];
  return { thumbnail: thumb, images: gallery.join(', ') };
};

export default function AdminDashboard() {
  const [tab, setTab]             = useState('overview');
  const [analyticsView, setAnalyticsView] = useState('summary');
  const [stats, setStats]         = useState(null);
  const [products, setProducts]   = useState([]);
  const [orders, setOrders]       = useState([]);
  const [users, setUsers]         = useState([]);
  const [reviews, setReviews]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState(null);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [analyticsFilters, setAnalyticsFilters] = useState({
    range: '30d',
    category: '',
    productId: '',
    orderStatus: '',
    stockStatus: '',
  });

  // Product form state
  const [showProdForm, setShowProdForm] = useState(false);
  const [editProduct, setEditProduct]   = useState(null);
  const [prodForm, setProdForm]         = useState(BLANK_PRODUCT);
  const [savingProd, setSavingProd]     = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);

  // Order inline-edit state
  const [editOrderId, setEditOrderId]     = useState(null);
  const [editOrderData, setEditOrderData] = useState({});

  const [detailModal, setDetailModal] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editUserRecord, setEditUserRecord] = useState(null);
  const [userForm, setUserForm] = useState({ first_name: '', last_name: '' });
  const [savingUser, setSavingUser] = useState(false);
  const [generationSource, setGenerationSource] = useState('both');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewProduct, setPreviewProduct] = useState(null);

  useEffect(() => { loadAll(); }, []);

  useEffect(() => {
    if (tab === 'analytics') loadAnalytics();
  }, [tab, analyticsFilters]);

  const loadAll = () => {
    setLoading(true);
    Promise.all([
      axios.get('/api/admin/stats').catch(() => ({ data: {} })),
      axios.get('/api/admin/products?limit=50').catch(() => ({ data: { products: [] } })),
      axios.get('/api/admin/orders?limit=50').catch(() => ({ data: { orders: [] } })),
      axios.get('/api/admin/users?limit=50').catch(() => ({ data: { users: [] } })),
      axios.get('/api/admin/reviews?limit=50').catch(() => ({ data: { reviews: [] } })),
      axios.get('/api/admin/analytics').catch(() => ({ data: { analytics: null } })),
    ]).then(([s, p, o, u, r, a]) => {
      setStats(s.data.stats || s.data);
      setProducts(p.data.products || []);
      setOrders(o.data.orders || []);
      setUsers(u.data.users || []);
      setReviews(r.data.reviews || []);
      setAnalytics(a.data.analytics || null);
    }).finally(() => setLoading(false));
  };

  const analyticsQuery = () => new URLSearchParams(
    Object.fromEntries(Object.entries(analyticsFilters).filter(([, value]) => value))
  ).toString();

  const loadAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const { data } = await axios.get(`/api/admin/analytics?${analyticsQuery()}`);
      setAnalytics(data.analytics || null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Analytics load failed');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const generateAnalyticsSummary = async () => {
    if (!analytics) return;
    setAiSummaryLoading(true);
    try {
      const { data } = await axios.post('/api/admin/analytics/ai-summary', { analytics });
      setAiSummary(data.aiSummary);
      toast.success(data.provider === 'rules' ? 'Generated rule-based summary' : 'Generated AI summary');
    } catch (err) {
      toast.error(err.response?.data?.message || 'AI summary failed');
    } finally {
      setAiSummaryLoading(false);
    }
  };

  const downloadAnalyticsCSV = async () => {
    try {
      const res = await axios.get(`/api/admin/analytics/export.csv?${analyticsQuery()}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `gadgetglam-admin-analytics-${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('CSV export failed');
    }
  };

  const downloadAnalyticsPDF = () => {
    window.print();
  };

  // ── Product handlers ─────────────────────────────────────
  const openAddProduct = () => {
    setEditProduct(null);
    setProdForm({ ...BLANK_PRODUCT, ...makeDefaultProductImages(BLANK_PRODUCT.name, BLANK_PRODUCT.category) });
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
      is_draft: p.is_draft === true,
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
      is_deal: !!p.is_deal,
      deal_ends_at: p.deal_ends_at ? new Date(p.deal_ends_at).toISOString().slice(0, 16) : '',
      deal_stock_total: p.deal_stock_total ?? '',
      deal_stock_remaining: p.deal_stock_remaining ?? '',
      deal_sort_order: String(p.deal_sort_order ?? 0),
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
        },
        is_deal: !!rest.is_deal,
        deal_ends_at: rest.is_deal && rest.deal_ends_at ? new Date(rest.deal_ends_at) : null,
        deal_stock_total: rest.is_deal ? Number(rest.deal_stock_total) || 0 : 0,
        deal_stock_remaining: rest.is_deal ? Number(rest.deal_stock_remaining) || 0 : 0,
        deal_sort_order: rest.is_deal ? Number(rest.deal_sort_order) || 0 : 0,
      };
      if (editProduct) {
        const { data } = await axios.put(`/api/admin/products/${editProduct._id}`, payload);
        setProducts(ps => ps.map(p => p._id === editProduct._id ? data.product : p));
        toast.success(payload.is_draft ? 'Product saved as draft' : 'Product published');
      } else {
        const { data } = await axios.post('/api/admin/products', payload);
        setProducts(ps => [data.product, ...ps]);
        toast.success(payload.is_draft ? 'Draft created' : 'Product created');
      }
      setShowProdForm(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSavingProd(false);
    }
  };

  const generateProductAIContent = async () => {
    if (!prodForm.name.trim() && !prodForm.description.trim()) {
      toast.error('Enter a title or description first.');
      return;
    }

    setGeneratingAI(true);
    try {
      const { data } = await axios.post('/api/admin/products/generate-content', {
        title: prodForm.name,
        description: prodForm.description,
        source: generationSource
      });

      const ai = data?.content || {};
      setProdForm(prev => ({
        ...prev,
        name: ai.name || prev.name,
        category: ai.category || prev.category,
        short_description: ai.short_description || prev.short_description,
        description: ai.description || prev.description,
        tags: Array.isArray(ai.tags) && ai.tags.length ? ai.tags.join(', ') : prev.tags,
        seo_meta_title: ai?.seo?.meta_title || prev.seo_meta_title,
        seo_meta_description: ai?.seo?.meta_description || prev.seo_meta_description,
        seo_meta_keywords: Array.isArray(ai?.seo?.meta_keywords) && ai.seo.meta_keywords.length
          ? ai.seo.meta_keywords.join(', ')
          : prev.seo_meta_keywords,
        thumbnail: (() => {
          const nextTitle = ai.name || prev.name;
          const nextCategory = ai.category || prev.category;
          const autoImages = makeDefaultProductImages(nextTitle, nextCategory);

          const hasCustomThumb =
            prev.thumbnail &&
            !prev.thumbnail.includes('source.unsplash.com') &&
            !prev.thumbnail.includes('images.unsplash.com/photo-');

          return hasCustomThumb ? prev.thumbnail : autoImages.thumbnail;
        })(),
        images: (() => {
          const nextTitle = ai.name || prev.name;
          const nextCategory = ai.category || prev.category;
          const autoImages = makeDefaultProductImages(nextTitle, nextCategory);

          const hasCustomImages =
            prev.images &&
            !prev.images.includes('source.unsplash.com') &&
            !prev.images.includes('images.unsplash.com/photo-');

          return hasCustomImages ? prev.images : autoImages.images;
        })(),
      }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'AI content generation failed');
    } finally {
      setGeneratingAI(false);
    }
  };

  const regenerateProduct = async (productId, fields = ['all']) => {
    setGeneratingAI(true);
    try {
      const { data } = await axios.post(`/api/admin/products/${productId}/regenerate`, { fields });
      const updated = data.product;
      if (updated) {
        setProducts(ps => ps.map(p => p._id === updated._id ? updated : p));
        if (editProduct && editProduct._id === updated._id) {
          setEditProduct(updated);
          setProdForm({
            name: updated.name || '',
            description: updated.description || '',
            short_description: updated.short_description || '',
            price: updated.price || '',
            compare_price: updated.compare_price || '',
            brand: updated.brand || '',
            category: updated.category || 'Cases',
            stock_status: updated.stock_status || 'In Stock',
            is_featured: updated.is_featured || false,
            is_draft: true,
            thumbnail: updated.thumbnail || '',
            images: (updated.images || []).join(', '),
            affiliate_link: updated.affiliate_link || '',
            affiliate_platform: updated.affiliate_platform || 'Daraz',
            device_compatibility: (updated.device_compatibility || []).join(', '),
            tags: (updated.tags || []).join(', '),
            seo_meta_title: updated.seo?.meta_title || '',
            seo_meta_description: updated.seo?.meta_description || '',
            seo_meta_keywords: (updated.seo?.meta_keywords || []).join(', '),
            seo_canonical_url: updated.seo?.canonical_url || '',
            seo_og_image: updated.seo?.og_image || '',
          });
          setShowProdForm(true);
        }
        toast.success('AI regeneration applied to draft');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'AI regeneration failed');
    } finally {
      setGeneratingAI(false);
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

  const publishProduct = async (product) => {
    try {
      const { data } = await axios.put(`/api/admin/products/${product._id}`, { is_draft: false });
      setProducts(ps => ps.map(p => p._id === product._id ? data.product : p));
      toast.success('Product published');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Publish failed');
    }
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
      if (detailModal?.type === 'review' && detailModal.record?._id === id) setDetailModal(null);
      toast.success('Review deleted');
    } catch { toast.error('Delete failed'); }
  };

  const openDetail = async (type, id) => {
    setDetailModal({ type, record: null });
    setDetailLoading(true);
    try {
      const paths = {
        product: `/api/admin/products/${id}`,
        order: `/api/admin/orders/${id}`,
        user: `/api/admin/users/${id}`,
        review: null,
      };
      if (type === 'review') {
        const found = reviews.find((r) => r._id === id);
        setDetailModal({ type, record: found || null });
      } else {
        const { data } = await axios.get(paths[type]);
        const key = type === 'product' ? 'product' : type === 'order' ? 'order' : 'user';
        setDetailModal({ type, record: data[key] || data[type] || data });
      }
    } catch {
      toast.error('Could not load details');
      setDetailModal(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const openEditUser = (user) => {
    setEditUserRecord(user);
    setUserForm({ first_name: user.first_name || '', last_name: user.last_name || '' });
  };

  const saveUser = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!editUserRecord) return;
    setSavingUser(true);
    try {
      const { data } = await axios.put(`/api/admin/users/${editUserRecord._id}`, userForm);
      setUsers((us) => us.map((u) => (u._id === editUserRecord._id ? data.user : u)));
      if (detailModal?.type === 'user' && detailModal.record?._id === editUserRecord._id) {
        setDetailModal({ type: 'user', record: data.user });
      }
      setEditUserRecord(null);
      toast.success('User updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSavingUser(false);
    }
  };

  const tabStyle = (t) => ({
    padding: '10px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer',
    fontWeight: '700', fontSize: '14px',
    background: tab === t ? 'var(--accent-yellow)' : 'var(--gray-100)',
    color: tab === t ? '#fff' : 'var(--gray-700)',
  });

  return (
    <>
      <SEOHead title="Admin Dashboard | GadgetGlam" description="Manage your GadgetGlam store." />
      <div className="container page-shell py-8 md:py-10">
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="rounded-4xl border border-theme bg-theme-panel p-4 shadow-card">
            <div className="border-b border-theme pb-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-theme-muted">Admin console</p>
              <h2 className="mt-1 text-lg font-black text-theme">Store control</h2>
            </div>

            <nav className="mt-4 space-y-2">
              {ADMIN_SECTIONS.map((section) => {
                const Icon = section.icon;
                const active = tab === section.key;
                return (
                  <div key={section.key}>
                    <button
                      type="button"
                      onClick={() => {
                        setTab(section.key);
                        setShowProdForm(false);
                        setEditOrderId(null);
                        if (section.key === 'analytics') setAnalyticsView('summary');
                      }}
                      className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${active ? 'bg-accent text-on-accent shadow-[0_14px_28px_rgba(37,99,235,0.18)]' : 'text-theme-muted hover:bg-[var(--accent-yellow-light)] hover:text-theme'}`}
                    >
                      <Icon size={17} />
                      <span>{section.label}</span>
                    </button>

                    {section.key === 'analytics' && (
                      <div className="mt-2 ml-3 space-y-1 border-l border-theme pl-3">
                        {ANALYTICS_SECTIONS.map((view) => (
                          <button
                            key={view.key}
                            type="button"
                            onClick={() => {
                              setTab('analytics');
                              setAnalyticsView(view.key);
                              setShowProdForm(false);
                              setEditOrderId(null);
                            }}
                            className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.16em] transition ${tab === 'analytics' && analyticsView === view.key ? 'bg-accent-light text-theme' : 'text-theme-muted hover:bg-accent-light hover:text-theme'}`}
                          >
                            <span>{view.label}</span>
                            <ChevronRight size={12} className="opacity-60" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </aside>

          <main className="min-w-0">
            <div className="mb-8">
              <h1 className="text-3xl font-black text-theme md:text-4xl">Admin Dashboard</h1>
              <p className="mt-2 text-sm text-theme-muted">Manage your store from the sidebar.</p>
            </div>

            {loading ? <div className="spinner" /> : (
              <>
                {tab === 'overview' && <OverviewTab stats={stats} products={products} />}
                {tab === 'analytics' && (
                  <AnalyticsTab
                    analytics={analytics}
                    products={products}
                    filters={analyticsFilters}
                    setFilters={setAnalyticsFilters}
                    loading={analyticsLoading}
                    aiSummary={aiSummary}
                    aiSummaryLoading={aiSummaryLoading}
                    onRefresh={loadAnalytics}
                    onGenerateSummary={generateAnalyticsSummary}
                    onDownloadCSV={downloadAnalyticsCSV}
                    onDownloadPDF={downloadAnalyticsPDF}
                    view={analyticsView}
                    onOpenProducts={() => setTab('products')}
                  />
                )}
                {tab === 'products' && (
                  <ProductsTab
                    products={products}
                    showProdForm={showProdForm}
                    editProduct={editProduct}
                    prodForm={prodForm}
                    setProdForm={setProdForm}
                    savingProd={savingProd}
                    generatingAI={generatingAI}
                    onAdd={openAddProduct}
                    onEdit={openEditProduct}
                    onDelete={deleteProduct}
                    onPublish={publishProduct}
                    onSave={saveProd}
                    onGenerateAI={generateProductAIContent}
                    setProducts={setProducts}
                    setEditProduct={setEditProduct}
                    setShowProdForm={setShowProdForm}
                    setGeneratingAI={setGeneratingAI}
                    onCancel={() => setShowProdForm(false)}
                    onView={(id) => openDetail('product', id)}
                    generationSource={generationSource}
                    setGenerationSource={setGenerationSource}
                    onRegenerate={regenerateProduct}
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
                    onView={(id) => openDetail('order', id)}
                  />
                )}
                {tab === 'users' && (
                  <UsersTab
                    users={users}
                    onToggleRole={toggleUserRole}
                    onToggleActive={toggleUserActive}
                    onDelete={deleteUser}
                    onView={(id) => openDetail('user', id)}
                    onEdit={openEditUser}
                  />
                )}
                {tab === 'reviews' && (
                  <ReviewsTab reviews={reviews} onDelete={deleteReview} onView={(id) => openDetail('review', id)} />
                )}
              </>
            )}
          </main>
        </div>
      </div>

      <AdminDetailModal
        open={!!detailModal}
        title={
          detailModal?.type === 'product' ? 'Product details'
            : detailModal?.type === 'order' ? 'Order details'
              : detailModal?.type === 'user' ? 'User details'
                : 'Review details'
        }
        subtitle={detailModal?.record?.name || detailModal?.record?.email || (detailModal?.record?._id ? `#${detailModal.record._id.slice(-8)}` : '')}
        onClose={() => setDetailModal(null)}
        footer={
          detailModal?.type === 'product' && detailModal.record?.slug ? (
            <>
              <AdminModalFooterLink to={`/products/${detailModal.record.slug}`}>View on store</AdminModalFooterLink>
              <button type="button" className="rounded-xl border border-theme px-4 py-2 text-sm font-semibold text-theme hover:bg-accent-light" onClick={() => { openEditProduct(detailModal.record); setDetailModal(null); }}>
                Edit product
              </button>
            </>
          ) : detailModal?.type === 'user' ? (
            <button type="button" className="rounded-xl border border-theme px-4 py-2 text-sm font-semibold text-theme hover:bg-accent-light" onClick={() => { openEditUser(detailModal.record); setDetailModal(null); }}>
              Edit user
            </button>
          ) : null
        }
      >
        {detailLoading ? <p className="text-theme-muted">Loading…</p> : (
          <>
            {detailModal?.type === 'product' && <AdminProductDetail product={detailModal.record} />}
            {detailModal?.type === 'order' && <AdminOrderDetail order={detailModal.record} />}
            {detailModal?.type === 'user' && <AdminUserDetail user={detailModal.record} />}
            {detailModal?.type === 'review' && <AdminReviewDetail review={detailModal.record} />}
          </>
        )}
      </AdminDetailModal>

      <AdminDetailModal
        open={!!editUserRecord}
        title="Edit user"
        subtitle={editUserRecord?.email}
        onClose={() => setEditUserRecord(null)}
        footer={(
          <>
            <button type="button" className="btn-gradient rounded-xl px-4 py-2 text-sm font-semibold" disabled={savingUser} onClick={saveUser}>
              {savingUser ? 'Saving…' : 'Save changes'}
            </button>
            <button type="button" className="rounded-xl border border-theme px-4 py-2 text-sm font-semibold text-theme" onClick={() => setEditUserRecord(null)}>Cancel</button>
          </>
        )}
      >
        <form onSubmit={saveUser} className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold text-theme-muted">
            First name
            <input className="input-theme mt-2 w-full rounded-xl px-4 py-3" value={userForm.first_name} onChange={(e) => setUserForm((f) => ({ ...f, first_name: e.target.value }))} required />
          </label>
          <label className="block text-sm font-semibold text-theme-muted">
            Last name
            <input className="input-theme mt-2 w-full rounded-xl px-4 py-3" value={userForm.last_name} onChange={(e) => setUserForm((f) => ({ ...f, last_name: e.target.value }))} required />
          </label>
        </form>
      </AdminDetailModal>
    </>
  );
}

// ── Overview tab ─────────────────────────────────────────
function OverviewTab({ stats, products }) {
  return (
    <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {[
        { label: 'Total Products', value: stats?.totalProducts ?? products.length, icon: '📦' },
        { label: 'Total Orders',   value: stats?.totalOrders   ?? '—', icon: '🧾' },
        { label: 'Total Users',    value: stats?.totalUsers    ?? '—', icon: '👥' },
        { label: 'Total Reviews',  value: stats?.totalReviews  ?? '—', icon: '⭐' },
        { label: 'Total Revenue',  value: stats?.totalRevenue  ? `PKR ${Number(stats.totalRevenue).toLocaleString()}` : '—', icon: '💰' },
      ].map(card => (
        <div key={card.label} className="rounded-4xl border border-theme bg-theme-panel p-6 shadow-card">
          <div className="text-3xl mb-2">{card.icon}</div>
          <div className="font-display text-2xl font-extrabold text-theme">{card.value}</div>
          <div className="text-sm text-theme-muted mt-2">{card.label}</div>
        </div>
      ))}
    </div>
  );
}

// ── Products tab ─────────────────────────────────────────
function AnalyticsTab({
  analytics,
  products,
  filters,
  setFilters,
  loading,
  aiSummary,
  aiSummaryLoading,
  onRefresh,
  onGenerateSummary,
  onDownloadCSV,
  onDownloadPDF,
  view = 'summary',
  onOpenProducts,
}) {
  const setFilterValue = (key) => (val) => setFilters((prev) => ({ ...prev, [key]: val }));
  const sales = analytics?.sales || {};
  const productPerformance = analytics?.productPerformance || {};
  const stock = analytics?.stock || {};
  const returns = analytics?.returns || {};
  const trends = analytics?.trends || {};
  const customers = analytics?.customers || {};
  const charts = analytics?.charts || {};

  if (!analytics) {
    return <div className="rounded-4xl border border-theme bg-theme-panel p-8 text-theme-muted">Analytics are not available yet.</div>;
  }

  const kpis = [
    { label: 'Total Sales', value: formatPKR(sales.totalSales), meta: `${compactNumber(sales.paidOrders)} paid orders` },
    { label: "Today's Sales", value: formatPKR(sales.todaySales), meta: 'Live daily revenue' },
    { label: 'Weekly Sales', value: formatPKR(sales.weeklySales), meta: 'Last 7 days' },
    { label: 'Monthly Revenue', value: formatPKR(sales.monthlyRevenue), meta: `${percentText(sales.revenueGrowth)} growth` },
    { label: 'Average Order Value', value: formatPKR(sales.averageOrderValue), meta: 'Paid/delivered orders' },
    { label: 'Refund Rate', value: percentText(returns.refundPercentage), meta: `${compactNumber(returns.totalReturns)} returns/refunds` },
  ];

  const activeFilterChips = [
    filters.range !== '30d' && { key: 'range', label: `Range: ${filters.range}` },
    filters.category && { key: 'category', label: `Category: ${filters.category}` },
    filters.productId && { key: 'productId', label: `Product: ${products.find((p) => String(p._id) === filters.productId)?.name || 'Selected'}` },
    filters.orderStatus && { key: 'orderStatus', label: `Order: ${filters.orderStatus}` },
    filters.stockStatus && { key: 'stockStatus', label: `Stock: ${filters.stockStatus}` },
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="rounded-4xl border border-theme bg-theme-panel p-6 shadow-card md:p-8">
        <div className="flex flex-col gap-2 border-b border-theme pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h3 className="text-lg font-black text-theme">Analytics filters</h3>
            <p className="mt-1 max-w-2xl text-sm text-theme-muted">
              Adjust date range, category, product, and status — charts and KPIs update automatically.
            </p>
          </div>
          {loading && (
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-2 text-xs font-bold text-accent">
              <RefreshCw size={14} className="animate-spin" /> Updating…
            </span>
          )}
        </div>

        <div className={`mt-6 grid gap-5 ${view === 'stock' ? 'sm:grid-cols-2 xl:grid-cols-3' : 'sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5'}`}>
          <AnalyticsFilterField label="Date range">
            <SelectMenu
              value={filters.range}
              onChange={setFilterValue('range')}
              fullWidth
              options={[
                { value: '7d', label: 'Last 7 days' },
                { value: '30d', label: 'Last 30 days' },
                { value: '90d', label: 'Last 90 days' },
                { value: '365d', label: 'Last year' },
              ]}
              aria-label="Date range"
            />
          </AnalyticsFilterField>
          <AnalyticsFilterField label="Category">
            <SelectMenu
              value={filters.category}
              onChange={setFilterValue('category')}
              fullWidth
              placeholder="All categories"
              options={[{ value: '', label: 'All categories' }, ...CATEGORIES.map((c) => ({ value: c, label: c }))]}
              aria-label="Category filter"
            />
          </AnalyticsFilterField>
          {view !== 'stock' && (
            <>
              <AnalyticsFilterField label="Product">
                <SelectMenu
                  value={filters.productId}
                  onChange={setFilterValue('productId')}
                  fullWidth
                  placeholder="All products"
                  options={[{ value: '', label: 'All products' }, ...products.map((p) => ({ value: p._id, label: p.name }))]}
                  aria-label="Product filter"
                />
              </AnalyticsFilterField>
              <AnalyticsFilterField label="Order status">
                <SelectMenu
                  value={filters.orderStatus}
                  onChange={setFilterValue('orderStatus')}
                  fullWidth
                  placeholder="All order statuses"
                  options={[{ value: '', label: 'All order statuses' }, ...ORDER_STATUSES.map((s) => ({ value: s, label: s }))]}
                  aria-label="Order status filter"
                />
              </AnalyticsFilterField>
            </>
          )}
          <AnalyticsFilterField label="Stock status">
            <SelectMenu
              value={filters.stockStatus}
              onChange={setFilterValue('stockStatus')}
              fullWidth
              placeholder="All stock statuses"
              options={[{ value: '', label: 'All stock statuses' }, ...STOCK_STATUSES.map((s) => ({ value: s, label: s }))]}
              aria-label="Stock status filter"
            />
          </AnalyticsFilterField>
        </div>

        {activeFilterChips.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {activeFilterChips.map((chip) => (
              <span key={chip.key} className="rounded-full border border-accent/25 bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent">
                {chip.label}
              </span>
            ))}
          </div>
        )}

        <div className={`mt-8 flex flex-col gap-3 ${view === 'stock' ? 'sm:flex-row sm:flex-wrap' : 'grid sm:grid-cols-2 lg:grid-cols-4'}`}>
          <AnalyticsToolbarButton onClick={onRefresh} disabled={loading} variant="soft" icon={RefreshCw} className={view === 'stock' ? 'sm:min-w-[160px] sm:flex-1' : ''}>
            {loading ? 'Refreshing…' : 'Refresh data'}
          </AnalyticsToolbarButton>
          {view === 'stock' && onOpenProducts ? (
            <AnalyticsToolbarButton onClick={onOpenProducts} variant="secondary" icon={Package} className="sm:min-w-[180px] sm:flex-1">
              Manage inventory
            </AnalyticsToolbarButton>
          ) : null}
          <AnalyticsToolbarButton onClick={onGenerateSummary} disabled={aiSummaryLoading || loading} variant="primary" icon={BrainCircuit} className={view === 'stock' ? 'sm:min-w-[160px] sm:flex-1' : ''}>
            {aiSummaryLoading ? 'Generating…' : 'AI summary'}
          </AnalyticsToolbarButton>
          {view !== 'stock' ? (
            <>
              <AnalyticsToolbarButton onClick={onDownloadCSV} disabled={loading} variant="secondary" icon={Download}>
                Download CSV
              </AnalyticsToolbarButton>
              <AnalyticsToolbarButton onClick={onDownloadPDF} disabled={loading} variant="secondary" icon={FileDown}>
                Download PDF
              </AnalyticsToolbarButton>
            </>
          ) : (
            <AnalyticsToolbarButton onClick={onDownloadCSV} disabled={loading} variant="secondary" icon={Download} className="sm:min-w-[160px] sm:flex-1">
              Export stock CSV
            </AnalyticsToolbarButton>
          )}
        </div>
      </div>

      {view === 'summary' && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {kpis.map((card) => (
              <div key={card.label} className="rounded-4xl border border-theme bg-theme-panel p-6 shadow-card">
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-theme-muted">{card.label}</div>
                <div className="mt-3 font-display text-2xl font-black text-theme">{card.value}</div>
                <div className="mt-2 text-sm text-theme-muted">{card.meta}</div>
              </div>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {(analytics.aiInsightCards || []).map((insight, index) => (
              <div key={insight} className="rounded-4xl p-5" style={{ border: '1px solid rgba(37,99,235,0.18)', background: 'rgba(37,99,235,0.06)', boxShadow: '0 0 40px rgba(37,99,235,0.08)' }}>
                <div className="mb-3 inline-flex rounded-full px-3 py-1 text-xs font-bold" style={{ border: '1px solid rgba(37,99,235,0.12)', background: 'rgba(37,99,235,0.10)', color: 'var(--accent-gold)' }}>AI Insight {index + 1}</div>
                <p className="text-sm leading-6 text-theme-muted">{insight}</p>
              </div>
            ))}
          </div>

          {aiSummary && (
            <div className="rounded-4xl border border-fuchsia-400/20 bg-fuchsia-500/[0.06] p-5">
              <div className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-fuchsia-200"><Sparkles size={16} /> AI Executive Summary</div>
              <p className="text-sm leading-7 text-theme-muted">{aiSummary.summary}</p>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {[...(aiSummary.insights || []), ...(aiSummary.stockSuggestions || []), ...(aiSummary.returnSuggestions || [])].slice(0, 6).map((item) => (
                  <div key={item} className="rounded-3xl border border-theme bg-theme-panel p-3 text-sm text-theme-muted">{item}</div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {view === 'revenue' && (
        <div className="grid gap-5 xl:grid-cols-2">
          <AnalyticsPanel title="Revenue Line Chart">
            <ResponsiveContainer width="100%" height={290}>
              <LineChart data={charts.revenueLine || []}>
                <CartesianGrid stroke="rgba(148,163,184,.14)" vertical={false} />
                <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fontSize: 11 }} />
                <YAxis stroke="#9CA3AF" tick={{ fontSize: 11 }} />
                <Tooltip content={<ChartTooltip currency />} />
                <Line type="monotone" dataKey="sales" stroke="#60A5FA" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </AnalyticsPanel>
          <AnalyticsPanel title="Sales Bar Chart">
            <ResponsiveContainer width="100%" height={290}>
              <BarChart data={charts.salesBar || []}>
                <CartesianGrid stroke="rgba(148,163,184,.14)" vertical={false} />
                <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fontSize: 11 }} />
                <YAxis stroke="#9CA3AF" tick={{ fontSize: 11 }} />
                <Tooltip content={<ChartTooltip currency />} />
                <Bar dataKey="sales" radius={[12, 12, 0, 0]} fill="var(--accent-yellow)" />
              </BarChart>
            </ResponsiveContainer>
          </AnalyticsPanel>
        </div>
      )}

      {view === 'products' && (
        <>
          <div className="grid gap-5 xl:grid-cols-3">
            <AnalyticsList title="Best-Selling Products" items={productPerformance.bestSelling} render={(item) => `${item.name} - ${formatPKR(item.revenue)} / ${item.quantity} units`} />
            <AnalyticsList title="Most Viewed Products" items={productPerformance.mostViewed} render={(item) => `${item.name} - ${compactNumber(item.views)} views / ${percentText(item.conversionRate)} conversion`} />
            <AnalyticsList title="Most Searched Products" items={productPerformance.mostSearched} render={(item) => `${item.query} - ${item.count} searches`} />
          </div>
          <AnalyticsPanel title="Detailed Product Analytics">
            <div className="overflow-x-auto">
              <table className="min-w-[760px] w-full border-collapse">
                <thead>
                  <tr className="border-b border-theme text-left text-xs uppercase tracking-[0.18em] text-theme-muted">
                    <th className="py-3 pr-4">Product</th>
                    <th className="py-3 pr-4">Category</th>
                    <th className="py-3 pr-4">Revenue</th>
                    <th className="py-3 pr-4">Units</th>
                    <th className="py-3 pr-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(productPerformance.bestSelling || []).map((item) => (
                    <tr key={item._id} className="border-b border-black/5 text-sm text-theme-muted">
                      <td className="py-3 pr-4 font-semibold text-theme">{item.name}</td>
                      <td className="py-3 pr-4">{item.category}</td>
                      <td className="py-3 pr-4">{formatPKR(item.revenue)}</td>
                      <td className="py-3 pr-4">{item.quantity}</td>
                      <td className="py-3 pr-4">
                        <Link to={`/products/${products.find((p) => String(p._id) === String(item._id))?.slug || ''}`} className="text-accent">View detailed product analytics</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AnalyticsPanel>
        </>
      )}

      {view === 'stock' && (
        <StockAnalyticsView
          analytics={analytics}
          stock={stock}
          charts={charts}
          returns={returns}
          onOpenProducts={onOpenProducts}
        />
      )}

      {view === 'customers' && (
        <div className="grid gap-5 xl:grid-cols-2">
          <AnalyticsPanel title="Customer Analytics">
            <MetricRows rows={[
              ['New customers', customers.newCustomers || 0],
              ['Returning customers', customers.returningCustomers || 0],
              ['Top customer', customers.topCustomers?.[0]?.name || 'No purchases yet'],
              ['Most purchased category', customers.mostPurchasedCategories?.[0]?.category || 'No category signal'],
            ]} />
          </AnalyticsPanel>
          <AnalyticsPanel title="Refund Overview">
            <MetricRows rows={[
              ['Refund rate', percentText(returns.refundPercentage)],
              ['Total returns', returns.totalReturns || 0],
              ['Refunded value', formatPKR(returns.refundedValue)],
              ['Most returned product', returns.mostReturnedProducts?.[0]?.name || 'No returns yet'],
            ]} />
          </AnalyticsPanel>
        </div>
      )}

      {view === 'trends' && (
        <>
          <AnalyticsPanel title="Trending Product Insights">
            <div className="grid gap-4 md:grid-cols-3">
              <AnalyticsList title="Currently Trending" items={trends.currentlyTrending} render={(item) => `${item.name} - ${formatPKR(item.revenue)} demand`} compact />
              <AnalyticsList title="Likely To Trend Soon" items={trends.likelyTrendingSoon} render={(item) => `${item.name} - ${compactNumber(item.views)} views`} compact />
              <AnalyticsList title="Categories Gaining Demand" items={trends.categoriesGainingDemand} render={(item) => `${item.category} - ${formatPKR(item.revenue)}`} compact />
            </div>
          </AnalyticsPanel>
          <AnalyticsPanel title="Seasonal Demand Graph">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={charts.seasonalDemand || []}>
                <CartesianGrid stroke="rgba(148,163,184,.14)" vertical={false} />
                <XAxis dataKey="category" stroke="#9CA3AF" tick={{ fontSize: 11 }} />
                <YAxis stroke="#9CA3AF" tick={{ fontSize: 11 }} />
                <Tooltip content={<ChartTooltip currency />} />
                <Bar dataKey="revenue" radius={[12, 12, 0, 0]} fill="var(--accent-yellow)" />
              </BarChart>
            </ResponsiveContainer>
          </AnalyticsPanel>
        </>
      )}
    </div>
  );
}

function StockAnalyticsView({ analytics, stock, charts, returns, onOpenProducts }) {
  const suggestions = analytics?.aiStockSuggestions || [];
  const returnData = charts?.returnAnalytics || [];
  const metrics = [
    { key: 'out', label: 'Out of stock', count: stock.outOfStock?.length || 0, tone: 'danger' },
    { key: 'low', label: 'Low stock', count: stock.lowStock?.length || 0, tone: 'warn' },
    { key: 'runout', label: 'About to run out', count: stock.aboutToRunOut?.length || 0, tone: 'amber' },
    { key: 'over', label: 'Overstocked', count: stock.overstocked?.length || 0, tone: 'muted' },
    { key: 'dead', label: 'Dead inventory', count: stock.deadInventory?.length || 0, tone: 'muted' },
  ];
  const maxMetric = Math.max(1, ...metrics.map((m) => m.count));

  const toneStyles = {
    danger: 'border-rose-400/30 bg-rose-500/10 text-rose-600 dark:text-rose-300',
    warn: 'border-amber-400/30 bg-amber-500/10 text-amber-700 dark:text-amber-200',
    amber: 'border-orange-400/25 bg-orange-500/10 text-orange-700 dark:text-orange-200',
    muted: 'border-theme bg-[var(--surface-2)] text-theme-muted',
  };

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {metrics.map((m) => (
          <div key={m.key} className={`rounded-3xl border p-5 shadow-card ${toneStyles[m.tone]}`}>
            <div className="text-xs font-bold uppercase tracking-[0.16em] opacity-80">{m.label}</div>
            <div className="mt-2 font-display text-3xl font-black">{compactNumber(m.count)}</div>
            <div className="mt-1 text-xs opacity-75">products</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <AnalyticsPanel
          title="Returns by reason"
          subtitle="Refund and return volume — use this to spot quality or listing issues affecting stock planning."
          className="min-w-0 xl:col-span-3"
        >
          <div className="h-[min(420px,55vh)] w-full min-w-0">
            {returnData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={returnData} margin={{ top: 12, right: 16, left: 4, bottom: 72 }}>
                  <CartesianGrid stroke="rgba(148,163,184,.14)" vertical={false} />
                  <XAxis
                    dataKey="reason"
                    stroke="#9CA3AF"
                    tick={{ fontSize: 11 }}
                    interval={0}
                    angle={-28}
                    textAnchor="end"
                    height={72}
                  />
                  <YAxis stroke="#9CA3AF" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="count" radius={[10, 10, 0, 0]} fill="#F43F5E" maxBarSize={56} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="grid h-full min-h-[280px] place-items-center rounded-3xl border border-dashed border-theme text-sm text-theme-muted">
                No return data for the selected filters yet.
              </div>
            )}
          </div>
        </AnalyticsPanel>

        <AnalyticsPanel title="Stock health breakdown" subtitle="Counts by inventory signal." className="xl:col-span-2">
          <div className="space-y-4">
            {metrics.map((m) => (
              <div key={m.key}>
                <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                  <span className="font-semibold text-theme">{m.label}</span>
                  <span className="font-bold text-theme">{compactNumber(m.count)}</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-[var(--surface-2)]">
                  <div
                    className={`h-full rounded-full transition-all ${m.tone === 'danger' ? 'bg-rose-500' : m.tone === 'warn' || m.tone === 'amber' ? 'bg-amber-500' : 'bg-accent'}`}
                    style={{ width: `${Math.max(4, (m.count / maxMetric) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-2xl border border-theme bg-[var(--surface-2)] p-4 text-sm text-theme-muted">
            <strong className="text-theme">Refund rate:</strong> {percentText(returns.refundPercentage)} ·{' '}
            <strong className="text-theme">{compactNumber(returns.totalReturns)}</strong> returns
          </div>
        </AnalyticsPanel>
      </div>

      <AnalyticsPanel
        title="AI restock suggestions"
        subtitle="Recommended actions based on demand, views, and stock levels."
      >
        {suggestions.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {suggestions.map((item) => (
              <div
                key={`${item.product}-${item.action}`}
                className="flex flex-col rounded-3xl border border-theme bg-[var(--surface-2)] p-5"
              >
                <div className="font-bold text-theme">{item.product}</div>
                <p className="mt-2 flex-1 text-sm leading-6 text-theme-muted">{item.reason}</p>
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-theme pt-4">
                  <span className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-on-accent">{item.action}</span>
                  <span className="rounded-full border border-theme bg-theme-panel px-3 py-1 text-xs font-semibold text-theme-muted">
                    Suggested: {item.suggestedUnits} units
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => toast.success(`Restock queued for ${item.product}`)}
                    className="rounded-xl bg-accent px-4 py-2.5 text-xs font-bold text-on-accent transition hover:opacity-90"
                  >
                    Queue restock
                  </button>
                  {onOpenProducts ? (
                    <button
                      type="button"
                      onClick={onOpenProducts}
                      className="rounded-xl border border-theme bg-theme-panel px-4 py-2.5 text-xs font-bold text-theme transition hover:border-accent hover:text-accent"
                    >
                      Open in products
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-theme px-6 py-12 text-center text-sm text-theme-muted">
            No AI stock suggestions for the current filters. Try widening the date range or refresh data.
          </div>
        )}
      </AnalyticsPanel>
    </div>
  );
}

function AnalyticsFilterField({ label, children, className = '' }) {
  return (
    <div className={className}>
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-theme-muted">{label}</span>
      {children}
    </div>
  );
}

function AnalyticsToolbarButton({ children, onClick, disabled, variant = 'secondary', icon: Icon, className = '' }) {
  const styles = {
    primary: 'btn-primary text-on-accent shadow-glow',
    secondary: 'border border-theme bg-theme-panel text-theme hover:border-accent hover:bg-accent-light/50',
    soft: 'border border-accent/30 bg-accent/10 text-accent hover:bg-accent/15',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-[48px] w-full items-center justify-center gap-2.5 rounded-2xl px-5 py-3.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant] || styles.secondary} ${className}`}
    >
      {Icon ? <Icon size={17} strokeWidth={2.25} /> : null}
      <span>{children}</span>
    </button>
  );
}

function AnalyticsPanel({ title, subtitle, children, className = '' }) {
  return (
    <section className={`rounded-4xl border border-theme bg-theme-panel p-5 shadow-card md:p-6 ${className}`}>
      <div className="mb-5">
        <div className="flex items-center gap-2 font-display text-lg font-bold text-theme">
          <TrendingUp size={18} className="shrink-0 text-accent" /> {title}
        </div>
        {subtitle ? <p className="mt-1.5 max-w-3xl text-sm leading-6 text-theme-muted">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

function AnalyticsList({ title, items = [], render, compact = false }) {
  return (
    <div className={compact ? '' : 'rounded-4xl border border-theme bg-theme-panel p-5'}>
      <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-theme-muted">{title}</h3>
      <div className="space-y-2">
        {items.length ? items.slice(0, compact ? 5 : 8).map((item, index) => (
          <div key={`${title}-${item._id || item.name || item.query || index}`} className="rounded-2xl border border-theme bg-theme-panel/[0.035] px-3 py-2 text-sm text-theme-muted">
            {render(item)}
          </div>
        )) : <div className="rounded-2xl border border-theme bg-theme-panel px-3 py-2 text-sm text-theme-muted">No signal yet</div>}
      </div>
    </div>
  );
}

function MetricRows({ rows }) {
  return (
    <div className="space-y-3">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-center justify-between gap-4 rounded-2xl border border-theme bg-theme-panel/[0.035] px-4 py-3">
          <span className="text-sm text-theme-muted">{label}</span>
          <strong className="text-right text-sm text-theme">{value}</strong>
        </div>
      ))}
    </div>
  );
}

function ChartTooltip({ active, payload, label, currency }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl border border-theme bg-theme-panel/95 px-3 py-2 text-xs text-theme-muted shadow-card">
      <div className="mb-1 font-bold text-theme">{label || payload[0]?.name}</div>
      {payload.map(item => (
        <div key={item.dataKey || item.name}>
          {item.name || item.dataKey}: {currency ? formatPKR(item.value) : compactNumber(item.value)}
        </div>
      ))}
    </div>
  );
}

function ProductsTab({ products, showProdForm, editProduct, prodForm, setProdForm, savingProd, generatingAI, onAdd, onEdit, onDelete, onPublish, onSave, onGenerateAI, setProducts, setEditProduct, setShowProdForm, setGeneratingAI, onCancel, onView, generationSource, setGenerationSource, onRegenerate }) {
  const f = (field) => (e) => setProdForm(p => ({ ...p, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const onCategoryChange = (category) => {
    setProdForm((p) => {
      const hasCustomThumb = p.thumbnail && !p.thumbnail.includes('images.unsplash.com') && !p.thumbnail.includes('source.unsplash.com');
      const hasCustomImages = p.images && !p.images.includes('images.unsplash.com') && !p.images.includes('source.unsplash.com');
      if (hasCustomThumb || hasCustomImages) {
        return { ...p, category };
      }
      return { ...p, category, ...makeDefaultProductImages(p.name, category) };
    });
  };
  const setField = (field) => (val) => setProdForm((p) => ({ ...p, [field]: val }));
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-lg font-bold">Products ({products.length})</h2>
        {!showProdForm && (
          <button onClick={onAdd} className="rounded-2xl px-4 py-2 text-sm font-semibold btn-primary">+ Add Product</button>
        )}
      </div>

      {showProdForm && (
        <div className="card-theme border rounded-4xl p-7 mb-7">
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', marginBottom: '20px' }}>
            {editProduct ? 'Edit Product' : 'Add New Product'}
          </h3>
          <div className="flex items-center gap-3 flex-wrap mb-4">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '13px', color: 'var(--gray-600)', marginRight: '6px' }}>Generate from</label>
              <SelectMenu
                value={generationSource}
                onChange={setGenerationSource}
                size="sm"
                className="min-w-[220px]"
                options={[
                  { value: 'both', label: 'Both (title + description)' },
                  { value: 'title', label: 'Title only' },
                  { value: 'description', label: 'Description only' },
                ]}
                aria-label="AI generation source"
              />
            </div>
            <button type="button" onClick={onGenerateAI} disabled={generatingAI} className="rounded-2xl px-4 py-2 text-sm font-semibold btn-primary">
              {generatingAI ? 'Generating AI Draft…' : 'Generate AI Content'}
            </button>
            <button type="button" onClick={async () => {
              if (!prodForm.name.trim() && !prodForm.description.trim()) {
                toast.error('Enter a title or description first.');
                return;
              }
              setGeneratingAI(true);
              try {
                const { data } = await axios.post('/api/admin/products/generate-and-save', {
                  title: prodForm.name,
                  description: prodForm.description,
                  source: generationSource
                });
                const created = data.product;
                if (created) {
                  setProducts(ps => [created, ...ps]);
                  setEditProduct(created);
                  setProdForm({
                    name: created.name || '',
                    description: created.description || '',
                    short_description: created.short_description || '',
                    price: created.price || '',
                    compare_price: created.compare_price || '',
                    brand: created.brand || '',
                    category: created.category || 'Cases',
                    stock_status: created.stock_status || 'In Stock',
                    is_featured: created.is_featured || false,
                    is_draft: true,
                    thumbnail: created.thumbnail || '',
                    images: (created.images || []).join(', '),
                    affiliate_link: created.affiliate_link || '',
                    affiliate_platform: created.affiliate_platform || 'Daraz',
                    device_compatibility: (created.device_compatibility || []).join(', '),
                    tags: (created.tags || []).join(', '),
                    seo_meta_title: created.seo?.meta_title || '',
                    seo_meta_description: created.seo?.meta_description || '',
                    seo_meta_keywords: (created.seo?.meta_keywords || []).join(', '),
                    seo_canonical_url: created.seo?.canonical_url || '',
                    seo_og_image: created.seo?.og_image || '',
                  });
                  setShowProdForm(true);
                  toast.success('AI draft created');
                }
              } catch (err) {
                toast.error(err.response?.data?.message || 'AI save failed');
              } finally {
                setGeneratingAI(false);
              }
            }} className="rounded-2xl px-4 py-2 text-sm font-semibold btn-primary">Generate & Save Draft</button>
            {editProduct?.isAIGenerated && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button type="button" onClick={() => onRegenerate(editProduct._id, ['title'])} className="rounded-xl px-3 py-2 text-sm border border-theme text-theme">Regenerate Title</button>
                <button type="button" onClick={() => onRegenerate(editProduct._id, ['description'])} className="rounded-xl px-3 py-2 text-sm border border-theme text-theme">Regenerate Description</button>
                <button type="button" onClick={() => onRegenerate(editProduct._id, ['all'])} className="rounded-xl px-3 py-2 text-sm border border-theme text-theme">Regenerate All</button>
                <button type="button" onClick={() => onRegenerate(editProduct._id, ['seo'])} className="rounded-xl px-3 py-2 text-sm border border-theme text-theme">Regenerate SEO</button>
              </div>
            )}
            <span style={{ fontSize: '12px', color: 'var(--gray-500)' }}>If both title and description are filled, AI refines both. Generated content stays in draft mode until published.</span>
          </div>
          <form onSubmit={onSave}>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Name *" colSpan={2}><input style={inputStyle} value={prodForm.name} onChange={f('name')} required /></FormField>
              <FormField label="Price (PKR) *"><input style={inputStyle} type="number" min="0" value={prodForm.price} onChange={f('price')} required /></FormField>
              <FormField label="Compare Price"><input style={inputStyle} type="number" min="0" value={prodForm.compare_price} onChange={f('compare_price')} /></FormField>
              <FormField label="Brand"><input style={inputStyle} value={prodForm.brand} onChange={f('brand')} /></FormField>
              <FormField label="Category *">
                <SelectMenu value={prodForm.category} onChange={onCategoryChange} fullWidth options={CATEGORIES} aria-label="Product category" />
              </FormField>
              <FormField label="Stock Status">
                <SelectMenu value={prodForm.stock_status} onChange={setField('stock_status')} fullWidth options={['In Stock', 'Out of Stock', 'Limited']} aria-label="Stock status" />
              </FormField>
              <FormField label="Affiliate Platform">
                <SelectMenu value={prodForm.affiliate_platform} onChange={setField('affiliate_platform')} fullWidth options={AFFY_PLATFORMS} aria-label="Affiliate platform" />
              </FormField>
              <FormField label="Affiliate Link *" colSpan={2}><input style={inputStyle} value={prodForm.affiliate_link} onChange={f('affiliate_link')} required /></FormField>
              <FormField label="Thumbnail URL" colSpan={2}><input style={inputStyle} value={prodForm.thumbnail} onChange={f('thumbnail')} placeholder="https://..." /></FormField>
              <FormField label="Images (comma-separated URLs)" colSpan={2}><input style={inputStyle} value={prodForm.images} onChange={f('images')} placeholder="https://img1.jpg, https://img2.jpg" /></FormField>
              <FormField label="Device Compatibility (comma-sep)" colSpan={2}><input style={inputStyle} value={prodForm.device_compatibility} onChange={f('device_compatibility')} placeholder="iPhone 15 Pro, Samsung Galaxy S24" /></FormField>
              <FormField label="Tags (comma-sep)" colSpan={2}><input style={inputStyle} value={prodForm.tags} onChange={f('tags')} placeholder="leather, wallet, iphone" /></FormField>
              <FormField label="Short Description" colSpan={2}><textarea style={{ ...inputStyle, height: '70px', resize: 'vertical' }} value={prodForm.short_description} onChange={f('short_description')} /></FormField>
              <FormField label="Description *" colSpan={2}><textarea style={{ ...inputStyle, height: '100px', resize: 'vertical' }} value={prodForm.description} onChange={f('description')} required /></FormField>

              <div style={{ gridColumn: 'span 2', borderTop: '2px solid var(--gray-200)', paddingTop: '16px', marginTop: '8px' }}>
                <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--gray-700)', marginBottom: '12px' }}>⏱️ Deals of the Week</div>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', marginBottom: '12px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={prodForm.is_deal} onChange={f('is_deal')} /> Show in time-limited deals panel
                </label>
              </div>
              {prodForm.is_deal && (
                <>
                  <FormField label="Deal ends at">
                    <input style={inputStyle} type="datetime-local" value={prodForm.deal_ends_at} onChange={f('deal_ends_at')} required={prodForm.is_deal} />
                  </FormField>
                  <FormField label="Sort order (lower = higher)">
                    <input style={inputStyle} type="number" min="0" value={prodForm.deal_sort_order} onChange={f('deal_sort_order')} />
                  </FormField>
                  <FormField label="Deal stock total">
                    <input style={inputStyle} type="number" min="0" value={prodForm.deal_stock_total} onChange={f('deal_stock_total')} />
                  </FormField>
                  <FormField label="Deal stock remaining">
                    <input style={inputStyle} type="number" min="0" value={prodForm.deal_stock_remaining} onChange={f('deal_stock_remaining')} />
                  </FormField>
                </>
              )}

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
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', margin: '0 0 20px', cursor: 'pointer' }}>
              <input type="checkbox" checked={prodForm.is_draft} onChange={f('is_draft')} /> Save as Draft (hidden from customers)
            </label>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button type="button" onClick={() => {
                // Build preview product from current form values
                const built = {
                  name: prodForm.name,
                  slug: prodForm.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
                  thumbnail: prodForm.thumbnail,
                  images: prodForm.images ? prodForm.images.split(',').map(s => s.trim()).filter(Boolean) : [],
                  price: prodForm.price,
                  short_description: prodForm.short_description,
                  description: prodForm.description,
                  category: prodForm.category,
                  tags: prodForm.tags ? prodForm.tags.split(',').map(s => s.trim()).filter(Boolean) : [],
                  seo: { meta_title: prodForm.seo_meta_title, meta_description: prodForm.seo_meta_description, meta_keywords: prodForm.seo_meta_keywords ? prodForm.seo_meta_keywords.split(',').map(s=>s.trim()) : [] }
                };
                setPreviewProduct(built);
                setPreviewOpen(true);
              }} style={btnStyle('var(--accent-yellow)')}>Preview</button>
              <button type="submit" disabled={savingProd} style={btnStyle('var(--accent-yellow)')}>
                {savingProd ? 'Saving…' : (editProduct ? (prodForm.is_draft ? 'Update Draft' : 'Update Product') : (prodForm.is_draft ? 'Create Draft' : 'Create Product'))}
              </button>
              <button type="button" onClick={onCancel} style={btnStyle('#9ca3af')}>Cancel</button>
            </div>
            <AdminDetailModal
              open={!!previewOpen}
              title="Preview product"
              subtitle={previewProduct?.name}
              onClose={() => setPreviewOpen(false)}
              footer={previewProduct && (
                <>
                  {editProduct?._id ? (
                    <button type="button" className="btn-gradient rounded-xl px-4 py-2 text-sm font-semibold" onClick={() => { publishProduct(editProduct); setPreviewOpen(false); }}>
                      Publish
                    </button>
                  ) : (
                    <button type="button" className="rounded-xl border border-theme px-4 py-2 text-sm font-semibold text-theme" onClick={() => toast.error('Save the draft first to publish')}>Save draft to publish</button>
                  )}
                  <button type="button" className="rounded-xl border border-theme px-4 py-2 text-sm font-semibold text-theme" onClick={() => setPreviewOpen(false)}>Close</button>
                </>
              )}
            >
              {previewProduct ? <AdminProductDetail product={previewProduct} /> : <p className="text-theme-muted">No preview available</p>}
            </AdminDetailModal>
          </form>
          {/* AI history viewer and restore */}
          {editProduct?.ai_history && editProduct.ai_history.length > 0 && (
            <div className="card-theme border rounded-4xl p-5 mt-4">
              <h4 className="font-bold mb-3">AI Version History</h4>
              <div className="space-y-3">
                {editProduct.ai_history.slice().reverse().map((h, idx) => {
                  const realIndex = editProduct.ai_history.length - 1 - idx;
                  return (
                    <div key={realIndex} className="rounded-2xl border border-theme bg-theme-panel p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-semibold text-theme">{h.note || `Version ${realIndex}`}</div>
                          <div className="text-xs text-theme-muted">{new Date(h.versionAt).toLocaleString()}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button type="button" onClick={async () => {
                            try {
                              await navigator.clipboard?.writeText(JSON.stringify(h.data, null, 2));
                              toast.success('History JSON copied');
                            } catch {
                              toast.success('Copy not available');
                            }
                          }} className="rounded-xl px-3 py-2 text-sm border border-theme">Copy JSON</button>
                          <button type="button" onClick={async () => {
                            if (!window.confirm('Restore this AI version to the draft?')) return;
                            try {
                              const { data } = await axios.post(`/api/admin/products/${editProduct._id}/restore-history`, { index: realIndex });
                              const updated = data.product;
                              if (updated) {
                                setProducts(ps => ps.map(p => p._id === updated._id ? updated : p));
                                setEditProduct(updated);
                                setProdForm(prev => ({
                                  ...prev,
                                  name: updated.name || prev.name,
                                  description: updated.description || prev.description,
                                  short_description: updated.short_description || prev.short_description,
                                  tags: (updated.tags || []).join(', '),
                                  seo_meta_title: updated.seo?.meta_title || prev.seo_meta_title,
                                  seo_meta_description: updated.seo?.meta_description || prev.seo_meta_description,
                                  seo_meta_keywords: (updated.seo?.meta_keywords || []).join(', '),
                                }));
                                toast.success('Draft restored from history');
                              }
                            } catch (err) {
                              toast.error(err.response?.data?.message || 'Restore failed');
                            }
                          }} className="rounded-xl px-3 py-2 text-sm border border-theme">Restore</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="card-theme border rounded-4xl overflow-hidden">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead className="bg-theme-panel">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold text-theme-muted uppercase tracking-wide">Product</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-theme-muted uppercase tracking-wide">Category</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-theme-muted uppercase tracking-wide">Price</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-theme-muted uppercase tracking-wide">Stock</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-theme-muted uppercase tracking-wide">Status</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-theme-muted uppercase tracking-wide">Featured</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-theme-muted uppercase tracking-wide">Actions</th>
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
                <td style={tdStyle}><strong style={{ color: 'var(--accent-yellow)', fontFamily: 'var(--font-display)' }}>PKR {p.price?.toLocaleString()}</strong></td>
                <td style={tdStyle}><span style={{ fontSize: '13px' }}>{p.stock_status}</span></td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                    <span style={{
                      padding: '3px 10px',
                      borderRadius: '20px',
                      fontSize: '11px',
                      fontWeight: '700',
                      background: p.is_draft ? 'rgba(245, 158, 11, .14)' : 'rgba(56, 161, 105, .14)',
                      color: p.is_draft ? '#b45309' : '#15803d'
                    }}>
                      {p.is_draft ? 'Draft' : 'Published'}
                    </span>
                    {p.is_deal && (
                      <span style={{ padding: '3px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: '700', background: 'rgba(37,99,235,.12)', color: 'var(--accent-yellow)' }}>
                        Deal{p.deal_ends_at ? ` · ${new Date(p.deal_ends_at).toLocaleDateString()}` : ''}
                      </span>
                    )}
                  </div>
                </td>
                <td style={tdStyle}>{p.is_featured ? '✅' : '—'}</td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button type="button" onClick={() => onView(p._id)} style={actionBtn('var(--gray-600)')}>View</button>
                    <button type="button" onClick={() => onEdit(p)} style={actionBtn('var(--accent-yellow)')}>Edit</button>
                    {p.is_draft && <button type="button" onClick={() => onPublish(p)} style={actionBtn('#15803d')}>Publish</button>}
                    <Link to={`/products/${p.slug}`} style={{ fontSize: '12px', color: 'var(--gray-600)', fontWeight: '600', textDecoration: 'none' }}>Store</Link>
                    <button type="button" onClick={() => onDelete(p._id)} style={actionBtn('#e53e3e')}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 && <EmptyRow cols={7} message="No products found. Seed the database to add products." />}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Orders tab ───────────────────────────────────────────
function OrdersTab({ orders, editOrderId, editOrderData, setEditOrderData, onStartEdit, onSave, onCancel, onDelete, onView }) {
  return (
    <div>
      <h2 className="font-display text-lg font-bold mb-4">Orders ({orders.length})</h2>
      <div className="overflow-x-auto card-theme border rounded-4xl">
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
          <thead className="bg-theme-panel">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold text-theme-muted uppercase tracking-wide">Order ID</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-theme-muted uppercase tracking-wide">Customer</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-theme-muted uppercase tracking-wide">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-theme-muted uppercase tracking-wide">Order Status</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-theme-muted uppercase tracking-wide">Payment</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-theme-muted uppercase tracking-wide">Tracking</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-theme-muted uppercase tracking-wide">Date</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-theme-muted uppercase tracking-wide">Actions</th>
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
                <td style={tdStyle}><strong style={{ color: 'var(--accent-yellow)' }}>PKR {o.total_price?.toLocaleString()}</strong></td>
                <td style={tdStyle}>
                  {editOrderId === o._id
                    ? (
                      <SelectMenu
                        size="sm"
                        value={editOrderData.order_status}
                        onChange={(val) => setEditOrderData((d) => ({ ...d, order_status: val }))}
                        options={ORDER_STATUSES}
                        className="min-w-[140px]"
                        aria-label="Order status"
                      />
                    )
                    : <StatusBadge status={o.order_status} />}
                </td>
                <td style={tdStyle}>
                  {editOrderId === o._id
                    ? (
                      <SelectMenu
                        size="sm"
                        value={editOrderData.payment_status}
                        onChange={(val) => setEditOrderData((d) => ({ ...d, payment_status: val }))}
                        options={PAYMENT_STATUSES}
                        className="min-w-[120px]"
                        aria-label="Payment status"
                      />
                    )
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
                        <button type="button" onClick={() => onView(o._id)} style={actionBtn('var(--gray-600)')}>View</button>
                        <button type="button" onClick={() => onStartEdit(o)} style={actionBtn('var(--accent-yellow)')}>Edit</button>
                        <button type="button" onClick={() => onDelete(o._id)} style={actionBtn('#e53e3e')}>Delete</button>
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
function UsersTab({ users, onToggleRole, onToggleActive, onDelete, onView, onEdit }) {
  return (
    <div>
      <h2 className="font-display text-lg font-bold mb-4">Users ({users.length})</h2>
      <div className="card-theme border rounded-4xl overflow-hidden">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead className="bg-theme-panel">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold text-theme-muted uppercase tracking-wide">Name</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-theme-muted uppercase tracking-wide">Email</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-theme-muted uppercase tracking-wide">Role</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-theme-muted uppercase tracking-wide">Status</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-theme-muted uppercase tracking-wide">Joined</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-theme-muted uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u._id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                <td style={tdStyle}><span style={{ fontWeight: '600', fontSize: '13px' }}>{u.first_name} {u.last_name}</span></td>
                <td style={tdStyle}><span style={{ fontSize: '13px', color: 'var(--gray-600)' }}>{u.email}</span></td>
                <td style={tdStyle}>
                  <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: u.role === 'admin' ? 'rgba(37,99,235,0.08)' : 'var(--gray-100)', color: u.role === 'admin' ? 'var(--accent-yellow)' : 'var(--gray-600)' }}>
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
                    <button type="button" onClick={() => onView(u._id)} style={actionBtn('var(--gray-600)')}>View</button>
                    <button type="button" onClick={() => onEdit(u)} style={actionBtn('var(--accent-yellow)')}>Edit</button>
                    <button type="button" onClick={() => onToggleRole(u)} style={actionBtn('var(--accent-yellow)')}>{u.role === 'admin' ? 'Make User' : 'Make Admin'}</button>
                    <button type="button" onClick={() => onToggleActive(u)} style={actionBtn(u.is_active ? '#d69e2e' : '#38a169')}>{u.is_active ? 'Deactivate' : 'Activate'}</button>
                    <button type="button" onClick={() => onDelete(u._id)} style={actionBtn('#e53e3e')}>Delete</button>
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
function ReviewsTab({ reviews, onDelete, onView }) {
  return (
    <div>
      <h2 className="font-display text-lg font-bold mb-4">Reviews ({reviews.length})</h2>
      <div className="card-theme border rounded-4xl overflow-hidden">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead className="bg-theme-panel">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold text-theme-muted uppercase tracking-wide">Product</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-theme-muted uppercase tracking-wide">User</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-theme-muted uppercase tracking-wide">Rating</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-theme-muted uppercase tracking-wide">Review</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-theme-muted uppercase tracking-wide">Date</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-theme-muted uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map(r => (
              <tr key={r._id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                <td style={tdStyle}>
                  {r.product_id
                    ? <Link to={`/products/${r.product_id.slug}`} style={{ fontSize: '13px', color: 'var(--accent-yellow)', fontWeight: '600', textDecoration: 'none' }}>
                        {r.product_id.name?.slice(0, 30)}{r.product_id.name?.length > 30 ? '…' : ''}
                      </Link>
                    : <span style={{ color: 'var(--gray-400)', fontSize: '13px' }}>—</span>}
                </td>
                <td style={tdStyle}><span style={{ fontSize: '13px' }}>{r.user_id?.first_name} {r.user_id?.last_name}</span></td>
                <td style={tdStyle}><span style={{ fontSize: '13px', color: '#d69e2e', fontWeight: '700' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span></td>
                <td style={tdStyle}><span style={{ fontSize: '12px', color: 'var(--gray-600)' }}>{r.review_text?.slice(0, 60)}{r.review_text?.length > 60 ? '…' : ''}</span></td>
                <td style={tdStyle}><span style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{new Date(r.createdAt).toLocaleDateString()}</span></td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button type="button" onClick={() => onView(r._id)} style={actionBtn('var(--gray-600)')}>View</button>
                    <button type="button" onClick={() => onDelete(r._id)} style={actionBtn('#e53e3e')}>Delete</button>
                  </div>
                </td>
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
  const colors = { Pending: 'var(--accent-yellow)', Confirmed: 'var(--accent-yellow)', Dispatched: 'var(--accent-gold)', Delivered: '#38a169', Cancelled: '#e53e3e', Processing: 'var(--accent-yellow)', Shipped: 'var(--accent-gold)' };
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
const tableWrap = { background: 'var(--surface)', borderRadius: '16px', border: '1.5px solid var(--border)', overflow: 'hidden' };
const theadRow  = { borderBottom: '1.5px solid var(--gray-200)', background: 'var(--gray-50)' };
const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid var(--gray-200)', fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };
const gridForm   = { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' };
const thumbBox   = { width: '40px', height: '40px', borderRadius: '8px', background: 'var(--accent-yellow-faint)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 };
const btnStyle   = (bg) => ({ background: bg, color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 20px', fontWeight: '700', fontSize: '14px', cursor: 'pointer' });
const actionBtn  = (color) => ({ fontSize: '12px', color, background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600', padding: 0 });

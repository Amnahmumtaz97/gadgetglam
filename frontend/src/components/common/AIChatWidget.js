import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useCart } from '../../context/CartContext';
import { getAssistantSessionId, setAssistantSessionId } from '../../utils/assistantSession';
import './AIChatWidget.css';

export default function AIChatWidget() {
  const navigate = useNavigate();
  const endRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [sessionId, setSessionId] = useState(getAssistantSessionId());
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: 'Hi! I can help you find products, recommend items, track orders, update cart, apply coupons, and answer FAQs.'
    }
  ]);

  const {
    cart,
    addToCart,
    removeFromCart,
    applyCoupon,
    lastCartActivity
  } = useCart();

  useEffect(() => {
    if (endRef.current) endRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  useEffect(() => {
    const q = input.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }

    const t = setTimeout(async () => {
      try {
        const { data } = await axios.get(`/api/assistant/suggestions?q=${encodeURIComponent(q)}`);
        setSuggestions(data.suggestions || []);
      } catch {
        setSuggestions([]);
      }
    }, 240);

    return () => clearTimeout(t);
  }, [input]);

  const quickReplies = useMemo(() => [
    'Show me chargers under 3000',
    'Recommend products for me',
    'Where is my order?',
    'What are payment methods?',
    'Open Help Center'
  ], []);

  const agentActions = useMemo(() => ([
    { label: 'Discover', text: 'Show me products under PKR 3000' },
    { label: 'Recommend', text: 'Recommend accessories for me' },
    { label: 'Track', text: 'Where is my order?' },
    { label: 'Cart', text: 'Apply coupon GLAM10' },
    { label: 'FAQ', text: 'What are payment methods?' },
    { label: 'Support', text: 'Open Help Center' },
  ]), []);

  const sendMessage = async (text) => {
    const content = String(text || '').trim();
    if (!content || loading) return;

    setMessages(prev => [...prev, { role: 'user', text: content }]);
    setInput('');
    setSuggestions([]);
    setLoading(true);

    try {
      const { data } = await axios.post('/api/assistant/chat', {
        message: content,
        cart,
        sessionId,
        lastCartActivity
      });

      if (data.sessionId) {
        setSessionId(data.sessionId);
        setAssistantSessionId(data.sessionId);
      }

      if (data.action?.type === 'add_to_cart' && data.action.productId) {
        try {
          const productRes = await axios.get(`/api/assistant/product/${data.action.productId}`);
          if (productRes.data?.product) {
            addToCart(productRes.data.product, data.action.quantity || 1);
          }
        } catch {
          toast.error('Unable to add product from chat action.');
        }
      }

      if (data.action?.type === 'remove_from_cart' && data.action.productId) {
        removeFromCart(data.action.productId);
      }

      if (data.action?.type === 'apply_coupon' && data.action.code) {
        applyCoupon(data.action.code);
      }

      if (data.action?.type === 'navigate' && data.action.path) {
        navigate(data.action.path);
      }

      if (/take me to checkout/i.test(content)) {
        navigate('/checkout');
      }

      setMessages(prev => [
        ...prev,
        {
          role: 'bot',
          text: data.reply || 'Done.',
          products: data.products || [],
          order: data.order || null,
          quickReplies: data.quickReplies || []
        }
      ]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', text: err.response?.data?.message || 'Assistant is unavailable right now.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!open && (
        <button className="ai-chat-toggle" onClick={() => setOpen(true)} aria-label="Open assistant">
          💬
        </button>
      )}

      {open && (
        <aside className="ai-chat-panel" aria-label="AI shopping assistant">
          <div className="ai-chat-head">
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>GadgetGlam AI Assistant</div>
              <div style={{ fontSize: 11, opacity: 0.9 }}>Discovery • Reco • Orders • Cart • FAQ • Support</div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close assistant">✕</button>
          </div>

          <div className="ai-agent-panel">
            {agentActions.map((action) => (
              <button key={action.label} onClick={() => sendMessage(action.text)} type="button">
                {action.label}
              </button>
            ))}
          </div>

          <div className="ai-chat-body">
            {messages.map((msg, idx) => (
              <div key={idx}>
                <div className={`ai-bubble ${msg.role}`}>{msg.text}</div>

                {msg.order?.timeline?.length > 0 && (
                  <div className="ai-order-timeline">
                    <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 12 }}>Order Timeline</div>
                    {msg.order.timeline.map((step, sIdx) => (
                      <div key={sIdx} className="ai-order-step">
                        {step.completed ? '✅' : '⬜'} {step.label}{step.current ? ' (current)' : ''}
                      </div>
                    ))}
                  </div>
                )}

                {msg.products?.length > 0 && (
                  <div className="ai-products">
                    {msg.products.map((p) => (
                      <Link key={p._id} to={`/products/${p.slug}`} className="ai-product-card">
                        <div style={{ fontWeight: 700, marginBottom: 4 }}>{p.name}</div>
                        <div style={{ color: 'var(--purple)', fontWeight: 700 }}>PKR {Number(p.price || 0).toLocaleString()}</div>
                        <div style={{ color: 'var(--gray-500)' }}>{p.brand || 'Gadget'}</div>
                      </Link>
                    ))}
                  </div>
                )}

                {msg.quickReplies?.length > 0 && (
                  <div className="ai-quick-replies">
                    {msg.quickReplies.slice(0, 3).map((reply, qIdx) => (
                      <button key={qIdx} onClick={() => sendMessage(reply)}>{reply}</button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && <div className="ai-bubble bot">Thinking...</div>}
            <div ref={endRef} />
          </div>

          <div className="ai-chat-foot">
            {suggestions.length > 0 && (
              <div className="ai-suggestions">
                {suggestions.slice(0, 5).map((s, idx) => (
                  <button key={idx} onClick={() => setInput(s)}>{s}</button>
                ))}
              </div>
            )}

            <div className="ai-chat-input">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
                placeholder="Ask: show me cases under 2000"
              />
              <button onClick={() => sendMessage(input)} disabled={loading}>Send</button>
            </div>

            {!messages.length && (
              <div className="ai-quick-replies" style={{ marginTop: 8 }}>
                {quickReplies.map((item, i) => (
                  <button key={i} onClick={() => sendMessage(item)}>{item}</button>
                ))}
              </div>
            )}
          </div>
        </aside>
      )}
    </>
  );
}

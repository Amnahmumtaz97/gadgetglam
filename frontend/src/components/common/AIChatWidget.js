import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, Mic, RotateCcw, Send, Sparkles, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useCart } from '../../context/CartContext';
import { getAssistantSessionId, setAssistantSessionId } from '../../utils/assistantSession';
import { getProductDisplayImage, getRealProductFallback } from '../../lib/mockups';
import './AIChatWidget.css';

const DEFAULT_BOT_MESSAGE = {
  role: 'bot',
  text: 'Hi! I can help with product search, compatibility, comparisons, bundles, order tracking, cart help, returns, shipping, and recommendations.',
  timestamp: Date.now(),
  quickReplies: ['Show trending products', 'Find cases for iPhone 15', 'Compare items for me'],
};

const QUICK_ACTIONS = [
  { label: 'Trending', text: 'Show trending products' },
  { label: 'Bundles', text: 'Recommend a bundle for my cart' },
  { label: 'Shipping', text: 'What is your shipping policy?' },
  { label: 'Returns', text: 'Help me with returns and refunds' },
];

function storageKey(sessionId) {
  return `gg_assistant_chat_${sessionId}`;
}

function loadMessages(sessionId) {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey(sessionId)) || '[]');
    if (Array.isArray(parsed) && parsed.length) return parsed;
  } catch {
    // Ignore broken local chat cache.
  }
  return [DEFAULT_BOT_MESSAGE];
}

function formatTime(ts) {
  try {
    return new Date(ts || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function inferIntent(text) {
  const q = String(text || '').toLowerCase();
  if (/compare/.test(q)) return 'compare';
  if (/compatib|iphone|samsung|device|fit/.test(q)) return 'compatibility';
  if (/track|order/.test(q)) return 'tracking';
  if (/return|refund/.test(q)) return 'returns';
  if (/shipping|delivery/.test(q)) return 'shipping';
  if (/bundle|cross|upsell|recommend|trending|suggest/.test(q)) return 'recommendation';
  if (/search|find|show|case|charger|cable|earphone/.test(q)) return 'discovery';
  return 'general';
}

function followUps({ intent, cartCount, compareCount }) {
  const map = {
    compare: ['Compare items for me', 'Recommend the best value'],
    compatibility: ['Check iPhone 15 compatibility', 'Show compatible cases'],
    tracking: ['Show order details page', 'Track my latest order'],
    returns: ['Open returns policy', 'Which products get returned most?'],
    shipping: ['How long does delivery take?', 'What payment methods are available?'],
    recommendation: ['Show trending products', 'Build a bundle for me'],
    discovery: ['Show me cases under PKR 3000', 'Show discounts on chargers'],
    general: ['Show trending products', 'Recommend accessories for me'],
  };
  const chips = [...(map[intent] || map.general)];
  if (cartCount) chips.unshift('Take me to checkout');
  if (compareCount >= 2) chips.unshift('Compare items for me');
  return Array.from(new Set(chips)).slice(0, 3);
}

export default function AIChatWidget() {
  const navigate = useNavigate();
  const endRef = useRef(null);
  const speechRef = useRef(null);
  const { cart, addToCart, removeFromCart, applyCoupon, lastCartActivity } = useCart();
  const [sessionId, setSessionId] = useState(() => getAssistantSessionId());
  const [messages, setMessages] = useState(() => loadMessages(getAssistantSessionId()));
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [compareItems, setCompareItems] = useState([]);
  const [isListening, setIsListening] = useState(false);

  const latestIntent = useMemo(() => inferIntent(messages[messages.length - 1]?.text), [messages]);
  const smartFollowUps = useMemo(
    () => followUps({ intent: latestIntent, cartCount: cart.length, compareCount: compareItems.length }),
    [latestIntent, cart.length, compareItems.length],
  );

  useEffect(() => {
    try {
      localStorage.setItem(storageKey(sessionId), JSON.stringify(messages.slice(-40)));
    } catch {
      // Ignore storage write errors.
    }
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sessionId, open]);

  useEffect(() => {
    const q = input.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return undefined;
    }
    const timer = setTimeout(async () => {
      try {
        const { data } = await axios.get(`/api/assistant/suggestions?q=${encodeURIComponent(q)}`);
        setSuggestions(data.suggestions || []);
      } catch {
        setSuggestions([]);
      }
    }, 180);
    return () => clearTimeout(timer);
  }, [input]);

  const toggleCompareItem = (product) => {
    setCompareItems((prev) => {
      if (prev.some((item) => item._id === product._id)) return prev.filter((item) => item._id !== product._id);
      return [product, ...prev].slice(0, 3);
    });
  };

  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice input is not supported in this browser.');
      return;
    }

    if (!speechRef.current) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => {
        setIsListening(false);
        toast.error('Voice input failed. Please try again.');
      };
      recognition.onresult = (event) => {
        const transcript = Array.from(event.results).map((result) => result[0]?.transcript || '').join(' ').trim();
        setInput(transcript);
      };
      speechRef.current = recognition;
    }

    if (isListening) {
      speechRef.current.stop();
      return;
    }

    try {
      speechRef.current.start();
    } catch {
      toast.error('Voice input is already active.');
    }
  };

  const sendMessage = async (text) => {
    const content = String(text || '').trim();
    if (!content || loading) return;

    const userMessage = { role: 'user', text: content, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setSuggestions([]);
    setLoading(true);

    try {
      const { data } = await axios.post('/api/assistant/chat', {
        message: content,
        cart,
        compareItems,
        sessionId,
        lastCartActivity,
      });

      if (data.sessionId) {
        setSessionId(data.sessionId);
        setAssistantSessionId(data.sessionId);
      }

      if (data.action?.type === 'add_to_cart' && data.action.productId) {
        const productRes = await axios.get(`/api/assistant/product/${data.action.productId}`);
        if (productRes.data?.product) addToCart(productRes.data.product, data.action.quantity || 1);
      }
      if (data.action?.type === 'remove_from_cart' && data.action.productId) removeFromCart(data.action.productId);
      if (data.action?.type === 'apply_coupon' && data.action.code) applyCoupon(data.action.code);
      if (data.action?.type === 'navigate' && data.action.path) navigate(data.action.path);
      if (/take me to checkout/i.test(content)) navigate('/checkout');

      setMessages((prev) => [...prev, {
        role: 'bot',
        text: data.reply || 'Done.',
        products: data.products || [],
        order: data.order || null,
        comparison: data.comparison || null,
        compatibility: data.compatibility || null,
        analytics: data.analytics || null,
        quickReplies: data.quickReplies || [],
        timestamp: Date.now(),
      }]);
    } catch (err) {
      setMessages((prev) => [...prev, {
        role: 'bot',
        text: err.response?.data?.message || 'Assistant is unavailable right now. Please try again in a moment.',
        timestamp: Date.now(),
        isError: true,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const clearConversation = () => {
    const reset = [{ ...DEFAULT_BOT_MESSAGE, timestamp: Date.now() }];
    setMessages(reset);
    setCompareItems([]);
    localStorage.setItem(storageKey(sessionId), JSON.stringify(reset));
  };

  return (
    <>
      {!open && (
        <button className="ai-chat-toggle" onClick={() => setOpen(true)} aria-label="Open assistant">
          <Bot size={24} />
        </button>
      )}

      {open && (
        <aside className="ai-chat-panel" aria-label="AI shopping assistant">
          <div className="ai-chat-head">
            <div>
              <div className="ai-chat-title"><Sparkles size={15} /> GadgetGlam AI</div>
              <div className="ai-chat-subtitle">Search, compare, recommend, track, support</div>
            </div>
            <div className="ai-head-actions">
              <button onClick={clearConversation} aria-label="Clear conversation" title="Clear conversation"><RotateCcw size={16} /></button>
              <button onClick={() => setOpen(false)} aria-label="Close assistant"><X size={17} /></button>
            </div>
          </div>

          <div className="ai-chat-body">
            {messages.map((msg, idx) => (
              <div key={`${msg.timestamp}-${idx}`} className={`ai-msg-row ${msg.role}`}>
                <div className={`ai-bubble ${msg.role}${msg.isError ? ' ai-bubble-error' : ''}`}>{msg.text}</div>
                <div className="ai-msg-time">{formatTime(msg.timestamp)}</div>

                {msg.compatibility && (
                  <div className="ai-insight-box">
                    <strong>{msg.compatibility.isCompatible ? 'Compatible' : 'Check carefully'}</strong>
                    <span>{msg.compatibility.reason}</span>
                  </div>
                )}

                {msg.comparison?.items?.length > 0 && (
                  <div className="ai-compare-table">
                    {msg.comparison.items.map((item) => (
                      <div key={item._id} className="ai-compare-row">
                        <strong>{item.name}</strong>
                        <span>PKR {Number(item.price || 0).toLocaleString()} | {(item.ratings_avg || 0).toFixed(1)} stars | {item.stock_status}</span>
                      </div>
                    ))}
                    {msg.comparison.winner && <div className="ai-insight-box"><strong>Best pick</strong><span>{msg.comparison.winner}</span></div>}
                  </div>
                )}

                {msg.order?.timeline?.length > 0 && (
                  <div className="ai-order-timeline">
                    <strong>Order Timeline</strong>
                    {msg.order.timeline.map((step) => (
                      <div key={step.label} className="ai-order-step">{step.completed ? 'Done' : 'Next'}: {step.label}{step.current ? ' (current)' : ''}</div>
                    ))}
                  </div>
                )}

                {msg.products?.length > 0 && (
                  <div className="ai-products">
                    {msg.products.map((p) => (
                      <div key={p._id} className="ai-product-card">
                        <Link to={`/products/${p.slug}`} className="ai-product-link">
                          <img
                            src={getProductDisplayImage(p)}
                            alt={p.name}
                            onError={(e) => {
                              const fallback = getRealProductFallback(p);
                              if (e.currentTarget.src !== fallback) e.currentTarget.src = fallback;
                            }}
                          />
                          <strong>{p.name}</strong>
                          <span>PKR {Number(p.price || 0).toLocaleString()}</span>
                          <small>{p.brand || p.category || 'Premium accessory'}</small>
                        </Link>
                        <div className="ai-product-actions">
                          <button type="button" onClick={() => addToCart(p, 1)}>Add</button>
                          <button type="button" className={compareItems.some((x) => x._id === p._id) ? 'active' : ''} onClick={() => toggleCompareItem(p)}>
                            {compareItems.some((x) => x._id === p._id) ? 'Added' : 'Compare'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {msg.quickReplies?.length > 0 && idx === messages.length - 1 && (
                  <div className="ai-quick-replies">
                    {msg.quickReplies.slice(0, 3).map((reply) => <button key={reply} onClick={() => sendMessage(reply)}>{reply}</button>)}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="ai-msg-row bot">
                <div className="ai-bubble bot"><span className="ai-typing"><span /><span /><span /></span></div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="ai-chat-foot">
            {compareItems.length > 0 && (
              <div className="ai-compare-panel">
                <div className="ai-compare-head"><strong>Compare ({compareItems.length}/3)</strong><button onClick={() => setCompareItems([])}>Clear</button></div>
                {compareItems.map((p) => (
                  <div key={p._id} className="ai-compare-item">
                    <span>{p.name}</span>
                    <button onClick={() => toggleCompareItem(p)}>Remove</button>
                  </div>
                ))}
              </div>
            )}

            {messages.length <= 2 && (
              <div className="ai-suggestions">{QUICK_ACTIONS.map((action) => <button key={action.label} onClick={() => sendMessage(action.text)}>{action.label}</button>)}</div>
            )}

            {suggestions.length > 0 && input.trim().length > 1 && (
              <div className="ai-suggestions">{suggestions.slice(0, 3).map((s) => <button key={s} onClick={() => setInput(s)}>{s}</button>)}</div>
            )}

            {!input.trim() && smartFollowUps.length > 0 && (
              <div className="ai-followups">{smartFollowUps.map((chip) => <button key={chip} onClick={() => sendMessage(chip)}>{chip}</button>)}</div>
            )}

            <div className="ai-chat-input">
              <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)} placeholder="Ask about cases, bundles, returns..." />
              <button type="button" className={`ai-voice-btn${isListening ? ' listening' : ''}`} onClick={handleVoiceInput} aria-label="Voice input"><Mic size={16} /></button>
              <button type="button" onClick={() => sendMessage(input)} disabled={loading || !input.trim()} aria-label="Send"><Send size={16} /></button>
            </div>
          </div>
        </aside>
      )}
    </>
  );
}

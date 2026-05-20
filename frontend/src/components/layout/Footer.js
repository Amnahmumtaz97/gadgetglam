import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Globe, MessageCircle, Send } from 'lucide-react';

const columns = [
  {
    title: 'Shop',
    links: [
      ['/category/cases', 'Phone Cases'],
      ['/category/chargers', 'Chargers'],
      ['/category/earphones', 'Earphones'],
      ['/category/cables', 'Cables'],
      ['/category/screen-guards', 'Screen Guards'],
      ['/products?featured=true', 'Hot Deals'],
    ],
  },
  {
    title: 'Account',
    links: [
      ['/login', 'Sign In'],
      ['/register', 'Register'],
      ['/account', 'My Profile'],
      ['/account/orders', 'My Orders'],
      ['/account/wishlist', 'Wishlist'],
    ],
  },
  {
    title: 'Help',
    links: [
      ['/help', 'Help Center'],
      ['/about', 'About Us'],
      ['/contact', 'Contact'],
      ['/faq', 'FAQ'],
      ['/returns', 'Returns & Refunds'],
      ['/privacy', 'Privacy Policy'],
      ['/terms', 'Terms of Service'],
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-theme bg-theme-panel pt-10">
      <div className="container grid gap-8 pb-10 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <div className="rounded-4xl border border-theme bg-theme-panel p-6 backdrop-blur-xl">
          <div className="text-3xl font-black tracking-tight text-theme">Gadget<span className="text-gradient">Glam</span></div>
          <p className="mt-4 max-w-md text-sm leading-6 text-theme-muted">
            Premium futuristic accessories for modern devices — designed like a luxury gadget brand with fast delivery and conversion-first shopping.
          </p>
            <div className="mt-6 flex items-center gap-3 text-theme-muted">
            <a href="https://instagram.com/gadgetglam" target="_blank" rel="noreferrer" className="grid h-11 w-11 place-items-center rounded-2xl border border-theme bg-theme-panel transition social-link"><Globe size={18} /></a>
            <a href="https://twitter.com/gadgetglam" target="_blank" rel="noreferrer" className="grid h-11 w-11 place-items-center rounded-2xl border border-theme bg-theme-panel transition social-link"><MessageCircle size={18} /></a>
            <a href="mailto:support@gadgetglam.pk" className="grid h-11 w-11 place-items-center rounded-2xl border border-theme bg-theme-panel transition social-link"><Send size={18} /></a>
          </div>
        </div>

        {columns.map((col) => (
          <div key={col.title} className="rounded-4xl border border-theme bg-theme-panel p-6">
            <h3 className="text-lg font-bold text-theme">{col.title}</h3>
            <div className="mt-4 space-y-3">
              {col.links.map(([href, label]) => (
                <Link key={label} to={href} className="flex items-center justify-between text-sm text-theme-muted transition hover:text-theme">
                  <span>{label}</span>
                  <ArrowRight size={14} className="opacity-60" />
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-black/5 py-5">
        <div className="container flex flex-col items-center justify-between gap-2 text-center text-xs text-theme-muted md:flex-row md:text-left">
          <p>© {new Date().getFullYear()} GadgetGlam. All rights reserved.</p>
          <p>Built in Pakistan · MERN stack · dark luxury commerce UI</p>
        </div>
      </div>
    </footer>
  );
}
